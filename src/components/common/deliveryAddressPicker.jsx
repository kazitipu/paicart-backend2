import React, { Component } from "react";
import { MapPin, Plus, Check, AlertTriangle } from "react-feather";
import { getPathaoAreas, getPathaoCities, getPathaoZones } from "../../constants/pathao";
import SearchableSelect from "./searchableSelect.jsx";
import { addressAreaLine } from "../../constants/deliveryRequest";

/* "Deliver to" for the admin delivery request dialog.
 *
 * Lists the address on this record (if any) and every address in the
 * customer's address book; staff pick one, or add a new one with the Pathao
 * city → zone → area picker (same address shape the website / app write, so
 * the Delivery page can book Pathao from it). Addresses without Pathao
 * locations are shown but flagged — Pathao booking needs the ids.
 *
 * Props: current (address on the record / request), book (customer's
 *        addressBook), value (selected address), onChange(address, isNew).
 */

const C = { ink: "#3e4c61", text: "#4b5a70", muted: "#8391a5", line: "#e2e8f0", orange: "#ea580c" };
const input = { width: "100%", border: `1px solid ${C.line}`, borderRadius: 9, padding: "8px 10px", fontSize: 13, color: C.ink, background: "#fff", boxSizing: "border-box" };
const label = { display: "block", fontSize: 11, fontWeight: 600, color: C.muted, marginBottom: 4 };

const hasPathao = (a) => !!(a && a.pathao && a.pathao.cityId && a.pathao.zoneId);
const sameAddress = (a, b) =>
  !!a && !!b && ((a.id && b.id && String(a.id) === String(b.id)) || (a.address === b.address && a.mobileNo === b.mobileNo && a.name === b.name));
const areaLine = (a) => addressAreaLine(a);

export const buildPathaoAddress = ({ name, mobileNo, address, city, zone, area }) => ({
  id: parseInt(Math.random() * 1000000, 10),
  name: String(name || "").trim(),
  mobileNo: String(mobileNo || "").trim(),
  address: String(address || "").trim(),
  district: city ? city.name : "",
  thana: zone ? zone.name : "",
  area: area ? area.name : "",
  division: "",
  pathao: {
    cityId: city ? city.id : null,
    cityName: city ? city.name : "",
    zoneId: zone ? zone.id : null,
    zoneName: zone ? zone.name : "",
    areaId: area ? area.id : null,
    areaName: area ? area.name : "",
    homeDelivery: area ? area.home_delivery_available !== false : true,
  },
  defaultShipping: false,
  defaultBilling: false,
});

export default class DeliveryAddressPicker extends Component {
  state = {
    /* with an address chosen, only it shows until "Change address" */
    expanded: false,
    adding: false,
    form: { name: "", mobileNo: "", address: "" },
    cities: [],
    zones: [],
    areas: [],
    cityId: "",
    zoneId: "",
    areaId: "",
    loading: "",
    error: "",
  };

  openForm = async () => {
    const { customerName, customerPhone } = this.props;
    this.setState({ adding: true, error: "", form: { name: customerName || "", mobileNo: customerPhone || "", address: "" } });
    if (this.state.cities.length) return;
    this.setState({ loading: "cities" });
    try {
      const cities = await getPathaoCities();
      this.setState({ cities, loading: "" });
    } catch (e) {
      this.setState({ loading: "", error: "Couldn't load Pathao cities. The Pathao proxy only runs under `npm start` with the Pathao keys in .env.local." });
    }
  };

  pickCity = async (cityId) => {
    this.setState({ cityId, zoneId: "", areaId: "", zones: [], areas: [], loading: cityId ? "zones" : "" });
    if (!cityId) return;
    try {
      this.setState({ zones: await getPathaoZones(cityId), loading: "" });
    } catch (e) {
      this.setState({ loading: "", error: "Couldn't load Pathao zones." });
    }
  };

  pickZone = async (zoneId) => {
    this.setState({ zoneId, areaId: "", areas: [], loading: zoneId ? "areas" : "" });
    if (!zoneId) return;
    try {
      this.setState({ areas: await getPathaoAreas(zoneId), loading: "" });
    } catch (e) {
      this.setState({ loading: "", error: "Couldn't load Pathao areas." });
    }
  };

  useNew = () => {
    const { form, cities, zones, areas, cityId, zoneId, areaId } = this.state;
    const phone = String(form.mobileNo || "").replace(/\D/g, "").replace(/^88/, "");
    if (!form.name.trim() || !form.address.trim()) return this.setState({ error: "Name and address are required." });
    if (!/^01[3-9]\d{8}$/.test(phone)) return this.setState({ error: "Enter a valid Bangladeshi mobile number (01XXXXXXXXX)." });
    if (!cityId || !zoneId) return this.setState({ error: "Choose the Pathao city and zone." });
    const find = (list, id) => list.find((x) => String(x.id) === String(id)) || null;
    const address = buildPathaoAddress({
      ...form,
      mobileNo: phone,
      city: find(cities, cityId),
      zone: find(zones, zoneId),
      area: find(areas, areaId),
    });
    this.props.onChange(address, true);
    this.setState({ adding: false, error: "", expanded: false });
  };

  renderOption = (a, tag) => {
    const { value, onChange } = this.props;
    const selected = sameAddress(a, value);
    const ok = hasPathao(a);
    return (
      <button
        type="button"
        key={`${tag}-${a.id || a.address}`}
        onClick={() => {
          onChange(a, false);
          this.setState({ expanded: false });
        }}
        style={{
          display: "flex", gap: 10, alignItems: "flex-start", width: "100%", textAlign: "left", cursor: "pointer",
          border: `1px solid ${selected ? "#fdba74" : C.line}`, background: selected ? "#fff8f2" : "#fff",
          borderRadius: 10, padding: "9px 11px", marginBottom: 6,
        }}
      >
        <span style={{ width: 18, height: 18, borderRadius: "50%", flexShrink: 0, marginTop: 1, display: "grid", placeItems: "center", border: `1.5px solid ${selected ? C.orange : "#cbd5e1"}`, background: selected ? C.orange : "#fff" }}>
          {selected && <Check size={11} color="#fff" />}
        </span>
        <span style={{ flex: 1, minWidth: 0 }}>
          <span style={{ display: "flex", flexWrap: "wrap", gap: 6, alignItems: "center" }}>
            <b style={{ fontSize: 12.5, fontWeight: 600, color: C.ink }}>{a.name || "No name"}</b>
            <span style={{ fontSize: 11.5, color: C.muted }}>{a.mobileNo}</span>
            {tag === "record" && <span style={{ fontSize: 9.5, fontWeight: 600, color: "#2f5fbf", background: "#eaf2ff", borderRadius: 999, padding: "1px 7px" }}>On this order</span>}
            {a.defaultShipping && tag !== "record" && <span style={{ fontSize: 9.5, fontWeight: 600, color: "#2f8a5b", background: "#e8f8ef", borderRadius: 999, padding: "1px 7px" }}>Default</span>}
            {!ok && (
              <span style={{ display: "inline-flex", gap: 3, alignItems: "center", fontSize: 9.5, fontWeight: 600, color: "#a66a14", background: "#fdf5e2", borderRadius: 999, padding: "1px 7px" }}>
                <AlertTriangle size={9} /> No Pathao area
              </span>
            )}
          </span>
          <span style={{ display: "block", fontSize: 12, color: C.text, marginTop: 2 }}>{a.address}</span>
          {areaLine(a) && <span style={{ display: "block", fontSize: 11, color: C.muted }}>{areaLine(a)}</span>}
        </span>
      </button>
    );
  };

  render() {
    const { current, book = [], value } = this.props;
    const { adding, form, cities, zones, areas, cityId, zoneId, areaId, loading, error, expanded } = this.state;
    const others = book.filter((a) => !sameAddress(a, current));

    /* an address is already chosen: show just that one + "Change address" */
    if (value && !expanded && !adding) {
      return (
        <div>
          {this.renderOption(value, sameAddress(value, current) ? "record" : "book")}
          <button
            type="button"
            onClick={() => this.setState({ expanded: true })}
            style={{ display: "inline-flex", alignItems: "center", gap: 5, border: "1px solid #e2e8f0", background: "#fff", color: "#4b5a70", borderRadius: 9, padding: "6px 12px", fontSize: 12, fontWeight: 600, cursor: "pointer" }}
          >
            <MapPin size={13} /> Change address
            {(others.length + (current && !sameAddress(current, value) ? 1 : 0)) > 0 && (
              <span style={{ color: "#94a3b8", fontWeight: 500 }}>
                · {others.length + (current && !sameAddress(current, value) ? 1 : 0)} saved
              </span>
            )}
          </button>
        </div>
      );
    }
    const select = (value, onChange, list, placeholder, disabled) => (
      <SearchableSelect
        options={list}
        value={value}
        onChange={onChange}
        disabled={disabled}
        placeholder={placeholder}
        inputStyle={{ ...input, padding: "7px 26px 7px 8px" }}
      />
    );
    return (
      <div>
        {current && this.renderOption(current, "record")}
        {others.map((a) => this.renderOption(a, "book"))}
        {!current && !book.length && !adding && (
          <div style={{ display: "flex", gap: 8, alignItems: "center", fontSize: 12, color: C.muted, border: `1px dashed ${C.line}`, borderRadius: 10, padding: "10px 12px", marginBottom: 6 }}>
            <MapPin size={14} /> The customer has no saved address. Add one below.
          </div>
        )}

        {!adding ? (
          <button
            type="button"
            onClick={this.openForm}
            style={{ display: "inline-flex", alignItems: "center", gap: 5, border: `1px dashed #fdba74`, background: "#fffaf5", color: C.orange, borderRadius: 9, padding: "7px 12px", fontSize: 12, fontWeight: 600, cursor: "pointer" }}
          >
            <Plus size={13} /> Add new address (Pathao)
          </button>
        ) : (
          <div style={{ border: `1px solid ${C.line}`, borderRadius: 12, padding: 12, background: "#fbfcfd" }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: C.ink, marginBottom: 8 }}>New delivery address</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
              <div>
                <span style={label}>Name</span>
                <input style={input} value={form.name} onChange={(e) => this.setState({ form: { ...form, name: e.target.value }, error: "" })} />
              </div>
              <div>
                <span style={label}>Mobile</span>
                <input style={input} value={form.mobileNo} placeholder="01XXXXXXXXX" onChange={(e) => this.setState({ form: { ...form, mobileNo: e.target.value }, error: "" })} />
              </div>
              <div>
                <span style={label}>City</span>
                {select(cityId, this.pickCity, cities, loading === "cities" ? "Loading…" : "Search city", loading === "cities")}
              </div>
              <div>
                <span style={label}>Zone</span>
                {select(zoneId, this.pickZone, zones, loading === "zones" ? "Loading…" : cityId ? "Search zone" : "Choose city first", !cityId || loading === "zones")}
              </div>
              <div style={{ gridColumn: "1 / -1" }}>
                <span style={label}>Area (optional)</span>
                {select(areaId, (v) => this.setState({ areaId: v }), areas, loading === "areas" ? "Loading…" : zoneId ? "Search area" : "Choose zone first", !zoneId || loading === "areas")}
              </div>
              <div style={{ gridColumn: "1 / -1" }}>
                <span style={label}>Address (house, road, block)</span>
                <textarea rows={2} style={{ ...input, resize: "vertical" }} value={form.address} onChange={(e) => this.setState({ form: { ...form, address: e.target.value }, error: "" })} />
              </div>
            </div>
            {error && <div style={{ marginTop: 8, fontSize: 11.5, color: "#b54848" }}>{error}</div>}
            <div style={{ display: "flex", justifyContent: "flex-end", gap: 6, marginTop: 10 }}>
              <button type="button" onClick={() => this.setState({ adding: false, error: "" })} style={{ border: `1px solid ${C.line}`, background: "#fff", borderRadius: 8, padding: "6px 12px", fontSize: 12, color: C.text, cursor: "pointer" }}>
                Cancel
              </button>
              <button type="button" onClick={this.useNew} style={{ border: 0, background: C.orange, color: "#fff", borderRadius: 8, padding: "6px 12px", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>
                Use this address
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }
}
