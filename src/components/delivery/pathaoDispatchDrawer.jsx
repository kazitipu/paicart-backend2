import React, { useEffect, useMemo, useState } from "react";
import SearchableSelect from "../common/searchableSelect.jsx";
import { X, Box, Truck, Send, AlertTriangle } from "react-feather";
import {
  createPathaoOrder,
  findByName,
  getPathaoAreas,
  getPathaoCities,
  getPathaoPricePlan,
  getPathaoStores,
  getPathaoZones,
  isValidBdPhone,
  normalizeBdPhone,
} from "../../constants/pathao";
import { HEAVY_KG, calculatePathaoRates, isoDate, money } from "../../constants/deliveryPanel";
import { savePathaoDelivery } from "../../firebase/firebase.utils";
import { addressFullLine } from "../../constants/deliveryRequest";

/* "Pathao Dispatch & Carton Breakdown" (one order, from Pathao Book) and
   "Master Package - Multiple Bookings" (several orders, from the floating
   bar). Books real Pathao consignments:
     - split_cartons  → one booking per ticked carton (Baby CTN), the order's
                        due shared across its cartons
     - master_cartons → one booking for every ticked carton (Master CTN)
     - master (many orders) → one booking for all of them, dues added up. */

let storesPromise = null;
let citiesPromise = null;

const num = (v) => {
  const n = parseFloat(v);
  return Number.isFinite(n) ? n : 0;
};

const PathaoDispatchDrawer = ({ rows, master, admin, onClose, onBooked }) => {
  const first = rows[0];
  const multiCustomer = new Set(rows.map((r) => r.uid)).size > 1;

  /* every carton still to book, across the selected orders */
  const cartons = useMemo(() => {
    const out = [];
    rows.forEach((row) => {
      const booked = new Set((row.request && row.request.pathaoCartons) || []);
      row.cartons.forEach((c, i) => {
        if (!booked.has(c.name)) out.push({ key: `${row.key}|${i}`, row, index: i, ...c });
      });
    });
    return out;
  }, [rows]);

  const [strategy, setStrategy] = useState("split_cartons");
  const [checked, setChecked] = useState(() => Object.fromEntries(cartons.map((c) => [c.key, true])));
  const [names, setNames] = useState(() => Object.fromEntries(cartons.map((c) => [c.key, c.row.product])));
  const [customer, setCustomer] = useState({
    name: first.customer,
    phone: first.mobile,
    address: first.address ? addressFullLine(first.address) : "",
  });
  const [delivery, setDelivery] = useState(0);
  const [cod, setCod] = useState(0);
  const [edited, setEdited] = useState({ delivery: false, cod: false });
  const [deliveryType, setDeliveryType] = useState("home");
  const [typeEdited, setTypeEdited] = useState(false);
  const [productInfo, setProductInfo] = useState(Array.from(new Set(rows.map((r) => r.product))).join(", "));
  const [fragile, setFragile] = useState(false);
  const [liquid, setLiquid] = useState(false);
  const [note, setNote] = useState("Please call customer before delivery.");
  const [loc, setLoc] = useState({ stores: [], cities: [], zones: [], areas: [], storeId: "", cityId: "", zoneId: "", areaId: "", error: "" });
  /* Pathao price plans, keyed store|city|zone|weight */
  const [plans, setPlans] = useState({});
  /* the customer's address carries exact Pathao ids when saved after the
     switch to Pathao locations */
  const savedPathao = (first.address && first.address.pathao) || null;
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const singleOrder = !master;
  const isSplit = singleOrder && strategy === "split_cartons";
  const picked = cartons.filter((c) => checked[c.key]);

  /* ── the design's recalculation ── */
  const totalW = picked.reduce((a, c) => a + num(c.weight), 0);
  const heavy = picked.some((c) => num(c.weight) > HEAVY_KG);
  const dueOfRow = (row) => num(row.due);
  const dueBill = master
    ? rows.reduce((a, r) => a + dueOfRow(r), 0)
    : isSplit && first.cartons.length > 0
      ? (dueOfRow(first) / first.cartons.length) * picked.length
      : dueOfRow(first);
  /* Charges from Pathao's own price plan for this store / city / zone and
     weight (fetched below); the weight table only until it answers, or for
     parcels over Pathao's 10 kg API limit. COD at Pathao's percentage. */
  const weightKey = (w) => String(Math.min(Math.max(Math.round(num(w) * 10) / 10, 0.5), 10));
  const rateFor = (w, due) => {
    const plan = plans[`${loc.storeId}|${loc.cityId}|${loc.zoneId}|${weightKey(w)}`];
    if (plan && num(w) <= 10) {
      const deliveryCharge = Math.round(num(plan.final_price) || num(plan.price));
      return { delivery: deliveryCharge, cod: num(due) > 0 ? Math.round((num(due) + deliveryCharge) * num(plan.cod_percentage)) : 0, fromPathao: true };
    }
    return { ...calculatePathaoRates(w, due), fromPathao: false };
  };
  /* split books each carton on its own, so its default charges are the sum
     of every carton's own Pathao rate */
  const auto = isSplit
    ? picked.reduce(
        (a, c) => {
          const r = rateFor(c.weight, dueOfRow(first) / Math.max(first.cartons.length, 1));
          return { delivery: a.delivery + r.delivery, cod: a.cod + r.cod, fromPathao: a.fromPathao && r.fromPathao };
        },
        { delivery: 0, cod: 0, fromPathao: true },
      )
    : rateFor(totalW, dueBill);
  const deliveryValue = edited.delivery ? delivery : auto.delivery;
  const codValue = edited.cod ? cod : auto.cod;
  const total = dueBill + deliveryValue + codValue;
  const overweight = totalW > HEAVY_KG || heavy;
  const typeValue = typeEdited ? deliveryType : overweight ? "hub" : "home";

  /* ask Pathao for every weight the current choice needs */
  const neededWeights = Array.from(new Set((isSplit ? picked.map((c) => c.weight) : [totalW]).map(weightKey)));
  const neededKey = neededWeights.join(",");
  useEffect(() => {
    if (!loc.storeId || !loc.cityId || !loc.zoneId) return;
    let alive = true;
    neededWeights.forEach((w) => {
      const key = `${loc.storeId}|${loc.cityId}|${loc.zoneId}|${w}`;
      if (plans[key]) return;
      getPathaoPricePlan({
        store_id: parseInt(loc.storeId, 10),
        item_type: 2,
        delivery_type: 48,
        item_weight: parseFloat(w),
        recipient_city: parseInt(loc.cityId, 10),
        recipient_zone: parseInt(loc.zoneId, 10),
      })
        .then((plan) => alive && plan && setPlans((p) => ({ ...p, [key]: plan })))
        .catch(() => {});
    });
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loc.storeId, loc.cityId, loc.zoneId, neededKey]);

  /* master_cartons re-ticks every carton */
  useEffect(() => {
    if (singleOrder && strategy === "master_cartons") setChecked(Object.fromEntries(cartons.map((c) => [c.key, true])));
  }, [strategy, singleOrder, cartons]);

  /* Pathao store / city / zone / area, pre-picked from the address */
  useEffect(() => {
    let alive = true;
    storesPromise = storesPromise || getPathaoStores().catch((e) => { storesPromise = null; throw e; });
    citiesPromise = citiesPromise || getPathaoCities().catch((e) => { citiesPromise = null; throw e; });
    Promise.all([storesPromise, citiesPromise])
      .then(([stores, cities]) => {
        if (!alive) return;
        const a = first.address || {};
        const city =
          (savedPathao && cities.find((c) => String(c.id) === String(savedPathao.cityId))) ||
          findByName(cities, a.district) ||
          findByName(cities, a.division);
        setLoc((l) => ({ ...l, stores, cities, storeId: stores[0] ? String(stores[0].id) : "", cityId: city ? String(city.id) : "" }));
      })
      .catch((e) => alive && setLoc((l) => ({ ...l, error: `Couldn't load Pathao locations: ${e.message}` })));
    return () => {
      alive = false;
    };
  }, [first]);
  useEffect(() => {
    if (!loc.cityId) return;
    let alive = true;
    getPathaoZones(loc.cityId)
      .then((zones) => {
        if (!alive) return;
        const z =
          (savedPathao && zones.find((x) => String(x.id) === String(savedPathao.zoneId))) ||
          findByName(zones, (first.address || {}).thana);
        setLoc((l) => ({ ...l, zones, areas: [], zoneId: z ? String(z.id) : "", areaId: "" }));
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, [loc.cityId, first]);
  useEffect(() => {
    if (!loc.zoneId) return;
    let alive = true;
    getPathaoAreas(loc.zoneId)
      .then((areas) => {
        if (!alive) return;
        const a = savedPathao && areas.find((x) => String(x.id) === String(savedPathao.areaId));
        setLoc((l) => ({ ...l, areas, areaId: a ? String(a.id) : "" }));
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, [loc.zoneId]);

  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && !submitting && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose, submitting]);

  const validate = () => {
    if (!picked.length) return "Tick at least one carton.";
    if (!customer.name.trim()) return "Enter the customer's name.";
    if (!isValidBdPhone(normalizeBdPhone(customer.phone))) return "Enter a valid Bangladeshi mobile number (01XXXXXXXXX).";
    if (customer.address.trim().length < 10) return "The delivery address must be at least 10 characters.";
    if (!loc.storeId) return "Choose the Pathao pickup store.";
    if (!loc.cityId || !loc.zoneId) return "Choose the Pathao city and zone.";
    return "";
  };

  /* bookings to create: [{ cartons, items: [{ row, cartons }], due, delivery, cod }] */
  const plan = () => {
    if (isSplit) {
      const shareDue = dueOfRow(first) / Math.max(first.cartons.length, 1);
      const rates = picked.map((c) => rateFor(c.weight, shareDue));
      const sumDel = rates.reduce((a, r) => a + r.delivery, 0) || 1;
      const sumCod = rates.reduce((a, r) => a + r.cod, 0) || 1;
      return picked.map((c, i) => ({
        cartons: [c],
        items: [{ row: first, cartons: [c] }],
        due: shareDue,
        delivery: Math.round((deliveryValue * rates[i].delivery) / sumDel),
        cod: codValue ? Math.round((codValue * rates[i].cod) / sumCod) : 0,
        parcelType: picked.length > 1 ? "Baby CTN" : "Single CTN",
      }));
    }
    const items = rows
      .map((row) => ({ row, cartons: picked.filter((c) => c.row.key === row.key) }))
      .filter((it) => it.cartons.length);
    return [
      {
        cartons: picked,
        items,
        due: dueBill,
        delivery: deliveryValue,
        cod: codValue,
        parcelType: picked.length > 1 ? "Master CTN" : "Single CTN",
      },
    ];
  };

  const submit = async () => {
    const problem = validate();
    if (problem) return setError(problem);
    setError("");
    setSubmitting(true);
    const bookings = plan();
    const who = (admin && (admin.name || admin.email)) || "Paicart";
    const bookedSoFar = {};
    rows.forEach((r) => {
      bookedSoFar[r.key] = new Set((r.request && r.request.pathaoCartons) || []);
    });
    const made = [];
    try {
      for (let b = 0; b < bookings.length; b += 1) {
        const bk = bookings[b];
        const weight = bk.cartons.reduce((a, c) => a + num(c.weight), 0);
        const collect = Math.round(bk.due + bk.delivery + bk.cod);
        const ids = bk.items.map((it) => it.row.id);
        const merchantId = `${master ? "MP-" : ""}${ids.join("-")}${isSplit ? `-C${bk.cartons[0].index + 1}` : ""}-${Date.now().toString(36)}`.slice(0, 60);
        const description = [
          productInfo.trim() || "General Cargo",
          bk.cartons.map((c) => `${c.name}: ${names[c.key] || c.row.product}`).join("; "),
          fragile ? "FRAGILE" : "",
          liquid ? "LIQUID" : "",
        ].filter(Boolean).join(" | ");
        const data = await createPathaoOrder({
          store_id: parseInt(loc.storeId, 10),
          merchant_order_id: merchantId,
          recipient_name: customer.name.trim(),
          recipient_phone: normalizeBdPhone(customer.phone),
          recipient_address: customer.address.trim(),
          recipient_city: parseInt(loc.cityId, 10),
          recipient_zone: parseInt(loc.zoneId, 10),
          ...(loc.areaId ? { recipient_area: parseInt(loc.areaId, 10) } : {}),
          delivery_type: 48,
          item_type: 2,
          item_quantity: bk.cartons.length,
          item_weight: Math.max(0.5, Math.round(weight * 10) / 10),
          amount_to_collect: collect,
          item_description: description.slice(0, 250),
          special_instruction: `${typeValue === "hub" ? "HUB DELIVERY (heavy parcel). " : ""}${note.trim()}`.slice(0, 250) || undefined,
        });
        if (!data || !data.consignment_id) throw new Error("Pathao did not return a consignment id.");
        const now = new Date();
        const doc = {
          id: String(data.consignment_id),
          pathaoId: String(data.consignment_id),
          merchantOrderId: merchantId,
          createdAt: now.getTime(),
          date: isoDate(now),
          bookedBy: who,
          bookingId: ids[0],
          items: bk.items.map((it) => ({ kind: it.row.kind, id: it.row.id, cartons: it.cartons.map((c) => c.name) })),
          customer: {
            userId: first.userId,
            uid: first.uid,
            name: customer.name.trim(),
            phone: normalizeBdPhone(customer.phone),
            address: customer.address.trim(),
          },
          shippingMark: Array.from(new Set(bk.items.map((it) => it.row.shippingMark).filter(Boolean))).join(", "),
          productName: Array.from(new Set(bk.cartons.map((c) => names[c.key] || c.row.product))).join(", "),
          productInfo: productInfo.trim(),
          parcelType: bk.parcelType,
          cartons: bk.cartons.map((c) => ({ name: c.name, weight: num(c.weight), trackingNo: c.trackingNo || "" })),
          totalWeight: Math.round(weight * 10) / 10,
          due: Math.round(bk.due),
          deliveryCharge: Math.round(bk.delivery),
          codCharge: Math.round(bk.cod),
          total: collect,
          pathaoDeliveryFee: data.delivery_fee !== undefined ? data.delivery_fee : null,
          deliveryType: typeValue === "hub" ? "Hub Delivery" : "Home Delivery",
          attributes: { fragile, liquid },
          note: note.trim(),
          parcelStatus: "Pathao pickup requested",
          pathaoRawStatus: data.order_status || "Pending",
          approval: { status: "pending" },
        };
        const items = bk.items.map((it) => {
          it.cartons.forEach((c) => bookedSoFar[it.row.key].add(c.name));
          return {
            kind: it.row.kind,
            record: it.row.record,
            bookedCartons: it.cartons.map((c) => c.name),
            allBooked: it.row.cartons.every((c) => bookedSoFar[it.row.key].has(c.name)),
          };
        });
        await savePathaoDelivery(doc, items);
        made.push(doc);
      }
      onBooked(made, "");
    } catch (e) {
      setSubmitting(false);
      if (made.length) onBooked(made, `${made.length} of ${bookings.length} bookings were made, then Pathao refused the next one: ${e.message}`);
      else setError(e.message || "Pathao booking failed.");
    }
  };

  return (
    <div className="dl-overlay is-right" onClick={() => !submitting && onClose()}>
      <div className="dl-drawer" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
        <div className="dl-drawer-head">
          <div>
            <div style={{ fontSize: 15, fontWeight: 800 }}>{master ? "Master Package - Multiple Bookings" : "Pathao Dispatch & Carton Breakdown"}</div>
            <div style={{ fontSize: 12, color: "#6b7280", marginTop: 2 }}>
              {master ? `${rows.length} bookings: ` : "Booking / Order ID: "}
              <b className="dl-mono" style={{ color: "#ff5000" }}>{rows.map((r) => r.id).join(", ")}</b>
            </div>
          </div>
          <button type="button" onClick={onClose} disabled={submitting} style={{ width: 32, height: 32, borderRadius: "50%", border: 0, background: "#e5e7eb", cursor: "pointer" }} aria-label="Close">
            <X size={15} />
          </button>
        </div>

        <div className="dl-drawer-body">
          <div className="dl-infobox orange">
            <b style={{ color: "#c2410c" }}>{master ? "Combined Master Dispatch Options" : "Flexible Pathao Booking Options"}</b>
            <p style={{ margin: "4px 0 8px", color: "#7c2d12" }}>
              {master
                ? "All selected bookings and cartons are combined into 1 Master Pathao Booking with automatic Pathao rate calculation."
                : <>This order contains <b>{first.cartons.length}</b> carton(s). Check/uncheck cartons below. Selected weight updates dynamically according to{" "}
                    <a href="https://merchant.pathao.com/courier/plan" target="_blank" rel="noopener noreferrer" style={{ color: "#e04500", fontWeight: 700 }}>Pathao Courier Plan</a>.</>}
            </p>
            {singleOrder && (
              <select className="dl-field" value={strategy} onChange={(e) => setStrategy(e.target.value)} style={{ borderColor: "#fdba74", color: "#e04500", fontWeight: 700 }}>
                <option value="split_cartons">Option 1 For Baby CTN Book Individual Cartons Separately</option>
                <option value="master_cartons">Option 2: Master Package All Cartons into 1 Pathao Booking</option>
              </select>
            )}
          </div>

          {multiCustomer && (
            <div className="dl-infobox amber" style={{ display: "flex", gap: 8 }}>
              <AlertTriangle size={14} style={{ flexShrink: 0, marginTop: 1 }} />
              <span>The selected bookings belong to different customers. One master package goes to one address — check the customer details below.</span>
            </div>
          )}

          <div>
            <span className="dl-label">Select Cartons &amp; Edit Product Names:</span>
            <div className="dl-carton-list" style={{ opacity: singleOrder && strategy === "master_cartons" ? 0.6 : 1 }}>
              {cartons.length === 0 && <div className="dl-empty">Every carton of this order is already booked with Pathao.</div>}
              {cartons.map((c) => (
                <label key={c.key} className="dl-carton">
                  <input
                    type="checkbox"
                    checked={!!checked[c.key]}
                    disabled={singleOrder && strategy === "master_cartons"}
                    onChange={(e) => setChecked({ ...checked, [c.key]: e.target.checked })}
                  />
                  <span style={{ display: "flex", flexWrap: "wrap", gap: 6, alignItems: "center" }}>
                    <Box size={12} color="#9ca3af" />
                    <b className="dl-mono">{master ? `[${c.name}]` : c.name}</b>
                    <span style={{ background: "#f3f4f6", borderRadius: 4, padding: "1px 6px", fontSize: 10 }} className="dl-mono">{c.trackingNo || "-"}</span>
                    <span className="dl-orange-chip">{num(c.weight).toFixed(1)} kg</span>
                  </span>
                  <span />
                  <input
                    className="dl-field"
                    value={names[c.key] || ""}
                    placeholder="Edit carton product name..."
                    onChange={(e) => setNames({ ...names, [c.key]: e.target.value })}
                  />
                </label>
              ))}
            </div>
          </div>

          <div>
            <span className="dl-label">Customer Details (Editable Address)</span>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
              <input className="dl-field" value={customer.name} onChange={(e) => setCustomer({ ...customer, name: e.target.value })} placeholder="Name" aria-label="Customer name" />
              <input className="dl-field" value={customer.phone} onChange={(e) => setCustomer({ ...customer, phone: e.target.value })} placeholder="01XXXXXXXXX" aria-label="Customer mobile" />
            </div>
            <span className="dl-label" style={{ marginTop: 8 }}>Delivery Address (Editable):</span>
            <input className="dl-field" value={customer.address} maxLength={220} onChange={(e) => setCustomer({ ...customer, address: e.target.value })} />
          </div>

          <div>
            <span className="dl-label">Pathao Store &amp; Delivery Area</span>
            {loc.error ? (
              <div className="dl-infobox red" style={{ fontSize: 12 }}>{loc.error}</div>
            ) : (
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                <select className="dl-field" value={loc.storeId} onChange={(e) => setLoc({ ...loc, storeId: e.target.value })} aria-label="Pathao store">
                  <option value="">Pickup store…</option>
                  {loc.stores.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
                <SearchableSelect
                  inputClassName="dl-field"
                  ariaLabel="City"
                  placeholder="Search city…"
                  options={loc.cities}
                  value={loc.cityId}
                  onChange={(id) => setLoc((l) => ({ ...l, cityId: id, zoneId: "", areaId: "", zones: [], areas: [] }))}
                />
                <SearchableSelect
                  inputClassName="dl-field"
                  ariaLabel="Zone"
                  placeholder={loc.cityId ? "Search zone…" : "Zone…"}
                  options={loc.zones}
                  value={loc.zoneId}
                  disabled={!loc.cityId}
                  onChange={(id) => setLoc((l) => ({ ...l, zoneId: id, areaId: "", areas: [] }))}
                />
                <SearchableSelect
                  inputClassName="dl-field"
                  ariaLabel="Area"
                  placeholder={loc.zoneId ? "Search area (optional)…" : "Area (optional)…"}
                  options={loc.areas}
                  value={loc.areaId}
                  disabled={!loc.zoneId}
                  onChange={(id) => setLoc((l) => ({ ...l, areaId: id }))}
                />
              </div>
            )}
          </div>

          <div className="dl-stat2">
            <div className="dl-stat-box"><span>Selected Total Weight</span><b>{totalW.toFixed(1)} kg</b></div>
            <div className="dl-stat-box"><span>Due Bill (Unchanged)</span><b style={{ color: "#ea580c" }}>{money(dueBill)}</b></div>
          </div>

          <div>
            <span className="dl-label">
              Courier &amp; Collection Charges (Pathao Plan)
              <span style={{ fontWeight: 600, color: auto.fromPathao ? "#16a34a" : "#9ca3af", marginLeft: 6 }}>
                {auto.fromPathao ? "· from Pathao's price plan" : "· estimated — choose city & zone"}
              </span>
            </span>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
              <label style={{ fontSize: 11, color: "#6b7280" }}>
                Delivery Charge (৳)
                <input className="dl-field" type="number" min={0} value={Math.round(deliveryValue)} onChange={(e) => { setDelivery(num(e.target.value)); setEdited({ ...edited, delivery: true }); }} />
              </label>
              <label style={{ fontSize: 11, color: "#6b7280" }}>
                COD Charge (৳)
                <input className="dl-field" type="number" min={0} value={Math.round(codValue)} onChange={(e) => { setCod(num(e.target.value)); setEdited({ ...edited, cod: true }); }} />
              </label>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", marginTop: 8, fontWeight: 700 }}>
              <span>Total Collection Amount:</span>
              <span className="dl-mono" style={{ color: "#2563eb" }}>{money(total)}</span>
            </div>
            {isSplit && picked.length > 1 && (
              <p className="dl-muted" style={{ margin: "4px 0 0" }}>{picked.length} separate Pathao bookings — charges are split per carton.</p>
            )}
          </div>

          <div className="dl-infobox blue">
            <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", marginBottom: 6 }}>
              <Truck size={14} color="#1d4ed8" /> <b style={{ color: "#1e3a8a" }}>Pathao Delivery Type:</b>
              {overweight && <span style={{ background: "#fef3c7", color: "#92400e", borderRadius: 6, padding: "1px 8px", fontWeight: 700 }}>⚠️ &gt;15kg: Hub Delivery Recommended</span>}
            </div>
            <select className="dl-field" value={typeValue} onChange={(e) => { setDeliveryType(e.target.value); setTypeEdited(true); }}>
              <option value="home">Home Delivery (Standard)</option>
              <option value="hub">Hub Delivery (Recommended for heavy parcels &gt;15kg)</option>
            </select>
          </div>

          <div>
            <span className="dl-label">Product Content &amp; Handling Attributes:</span>
            <input className="dl-field" value={productInfo} placeholder="e.g. Stainless Steel Conveyor Parts" onChange={(e) => setProductInfo(e.target.value)} />
            <div style={{ display: "flex", gap: 16, marginTop: 8 }}>
              <label style={{ color: "#dc2626", fontWeight: 700 }}><input type="checkbox" checked={fragile} onChange={(e) => setFragile(e.target.checked)} /> ⚠ Fragile (Vongur)</label>
              <label style={{ color: "#2563eb", fontWeight: 700 }}><input type="checkbox" checked={liquid} onChange={(e) => setLiquid(e.target.checked)} /> 💧 Liquid Item</label>
            </div>
          </div>

          <div>
            <span className="dl-label">Instruction / Note for Pathao Rider</span>
            <input className="dl-field" value={note} maxLength={200} onChange={(e) => setNote(e.target.value)} />
          </div>

          {error && <div className="dl-infobox red" style={{ fontSize: 12 }}>{error}</div>}
        </div>

        <div className="dl-drawer-foot">
          <button type="button" className="dl-btn dl-btn-ghost" onClick={onClose} disabled={submitting}>Cancel</button>
          <button type="button" className="dl-btn dl-btn-primary" onClick={submit} disabled={submitting || !picked.length}>
            <Send size={13} /> {submitting ? "Booking with Pathao…" : master ? "Confirm Master Dispatch" : "Confirm & Book via Pathao"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default PathaoDispatchDrawer;
