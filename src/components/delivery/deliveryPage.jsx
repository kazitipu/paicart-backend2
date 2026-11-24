import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useSelector } from "react-redux";
import {
  Search, Clock, CheckCircle, ExternalLink, Eye, Navigation, ArrowRight, Edit, RotateCcw,
  AlertTriangle, Truck, Printer, FileText, Download, Trash2, Package, X, RefreshCw, Box,
  Copy, Calendar, Phone, MapPin,
} from "react-feather";
import { showDialog } from "../common/appDialog.jsx";
import {
  approvePathaoDeliveryPayment,
  deletePathaoDelivery,
  getCustomersForSearch,
  getDeliveryRequests,
  getPathaoDeliveriesOverview,
  getPathaoDeliveriesPage,
  searchPathaoDeliveries,
  ensurePathaoSearchKeys,
  setWarehouseDeliveryStatus,
  updateParcelRecordFields,
  updatePathaoDelivery,
} from "../../firebase/firebase.utils";
import { getPathaoOrderInfo } from "../../constants/pathao";
import {
  CLOSED_STATUSES,
  ORDER_TYPES,
  DELIVERY_TYPE_OF_METHOD,
  PATHAO_STATUSES,
  TIME_FILTERS,
  WAREHOUSE,
  approvalAmounts,
  approvalMoney,
  approvalStatusOf,
  buildWarehouseRow,
  displayDate,
  isInDeliverySection,
  isPickupOrRiderAssigned,
  kpis,
  money,
  needsApproval,
  pathaoStatusLabel,
  paymentStatusOf,
  withinDays,
} from "../../constants/deliveryPanel";
import { ApprovalModal, BillModal, ParcelInfoModal, WarehouseStatusModal } from "./deliveryModals.jsx";
import PathaoDispatchDrawer from "./pathaoDispatchDrawer.jsx";
import PathaoInvoices from "./pathaoInvoices.jsx";
import { getPathaoInvoices } from "../../constants/pathao";
import { getPathaoInvoiceReceipts } from "../../firebase/firebase.utils";
import { openPODPopup, openViewNewPODReport, printActiveDeliveries } from "./deliveryReports";
import "./delivery.css";

/* Delivery — "Warehouse Parcel & Delivery Management".
 *
 * Parcels come here once their delivery request is approved (arranged) on
 * Delivery Requests, or entered by staff on a Paicart warehouse list.
 * Delivery staff (role "Delivery") see only this page. */

/* a pathaoDeliveries doc → the row the table, POD and print read */
const decorateDelivery = (d) => ({
  ...d,
  paymentStatus: paymentStatusOf(d.parcelStatus),
  report: {
    pathaoId: d.pathaoId,
    bookingId: d.bookingId,
    displayDate: displayDate(d.date),
    customerId: (d.customer && d.customer.userId) || "",
    customerName: (d.customer && d.customer.name) || "",
    customerAddress: (d.customer && d.customer.address) || "",
    customerPhone: (d.customer && d.customer.phone) || "",
    shippingMark: d.shippingMark || "",
    productName: d.productName || "",
    parcelType: d.parcelType || "Single CTN",
    cartons: d.cartons || [],
    totalWeightNumber: Number(d.totalWeight) || 0,
    billTotal: Number(d.total) || 0,
    paymentStatus: paymentStatusOf(d.parcelStatus),
    parcelStatus: d.parcelStatus,
  },
});

/* Pathao Deliveries: rows per page */
const DL_PAGE_SIZE = 20;
const STATUS_STYLE = {
  "Pathao pickup requested": { bg: "#fff7ed", fg: "#c2410c", line: "#fed7aa", dot: "#f97316", live: true },
  "Rider Assigned": { bg: "#fffbeb", fg: "#b45309", line: "#fde68a", dot: "#f59e0b", live: true },
  "Picked parcel From Paicart": { bg: "#faf5ff", fg: "#7e22ce", line: "#e9d5ff", dot: "#a855f7", live: true },
  "In Transit": { bg: "#ecfeff", fg: "#0e7490", line: "#a5f3fc", dot: "#06b6d4", live: true },
  "Ready For Delivery": { bg: "#eff6ff", fg: "#1d4ed8", line: "#bfdbfe", dot: "#2563eb", live: true },
  Delivered: { bg: "#f0fdf4", fg: "#15803d", line: "#bbf7d0", dot: "#22c55e" },
  Returned: { bg: "#fff1f2", fg: "#be123c", line: "#fecdd3", dot: "#f43f5e" },
  Cancelled: { bg: "#f9fafb", fg: "#374151", line: "#e5e7eb", dot: "#6b7280" },
};
const TYPE_CLASS = { "Website Order": "dl-type-order", "Product Request": "dl-type-request", "Ship For Me": "dl-type-ship" };
const DELIVERY_TYPE_COLOR = {
  "Home Delivery - Pathao": "#e04500",
  "Office Pickup": "#374151",
  "Sundorbon Express": "#d97706",
  "Van / Truck Delivery": "#2563eb",
};
const PTYPE_CLASS = { "Master CTN": "dl-ptype-master", "Baby CTN": "dl-ptype-baby", "Single CTN": "dl-ptype-single" };
const APPROVAL_LIMIT = 2;

const SearchBox = ({ value, onChange, placeholder, width }) => (
  <div className="dl-search">
    <Search size={13} />
    <input type="search" className="dl-input" style={{ width }} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} aria-label={placeholder} />
  </div>
);

const StatusPill = ({ status }) => {
  const s = STATUS_STYLE[status] || STATUS_STYLE["Rider Assigned"];
  return (
    <span className={`dl-status${s.live ? " is-live" : ""}`} style={{ background: s.bg, color: s.fg, borderColor: s.line }}>
      <i style={{ background: s.dot }} /> {status}
    </span>
  );
};

const DeliveryPage = () => {
  const admin = useSelector((s) => s.admins && s.admins.currentAdmin);
  const who = (admin && (admin.name || admin.email)) || "Paicart";
  const canApprove = !!admin && (admin.status === "Admin" || admin.status === "Accounts");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [records, setRecords] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [users, setUsers] = useState({});
  const [syncNote, setSyncNote] = useState("");

  /* approval section */
  const [apView, setApView] = useState("pending");
  const [apSearch, setApSearch] = useState("");
  const [apExpanded, setApExpanded] = useState(false);
  /* warehouse section */
  const [whView, setWhView] = useState("active");
  /* three tabs: warehouse parcels / Pathao deliveries / Pathao payment
     (?tab=warehouse|deliveries|payment keeps the choice on reload) */
  const [mainTab, setMainTab] = useState(() => {
    const t = new URLSearchParams(window.location.search).get("tab");
    return ["warehouse", "deliveries", "payment"].includes(t) ? t : "warehouse";
  });
  const switchTab = (t) => {
    setMainTab(t);
    const q = new URLSearchParams(window.location.search);
    q.set("tab", t);
    window.history.replaceState(null, "", `${window.location.pathname}?${q.toString()}`);
  };
  /* Pathao consignment → its Pathao invoice (filled by <PathaoInvoices />) */
  const [invoiceOf, setInvoiceOf] = useState({});
  /* paid Pathao invoices not yet received in Paicart (latest page) — the
     Pathao Payment tab's count, known before the tab is opened */
  const [awaitingReceive, setAwaitingReceive] = useState(0);
  useEffect(() => {
    let alive = true;
    getPathaoInvoices({ page: 1, limit: 10 })
      .then(async (l) => {
        const rows = (l && l.data) || [];
        const paid = rows.filter((r) => String(r.status).toLowerCase() === "paid");
        const rc = await getPathaoInvoiceReceipts(paid.map((r) => r.order_invoice_id));
        if (alive) setAwaitingReceive(paid.filter((r) => !rc[r.order_invoice_id]).length);
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, []);
  const [whType, setWhType] = useState("All");
  /* ?type=<method>&focus=<kind-id> — from a list's "In Delivery section" link */
  const urlParams = new URLSearchParams(window.location.search);
  const [whMethod, setWhMethod] = useState(urlParams.get("type") || "All");
  const [focusKey] = useState(urlParams.get("focus") || "");
  const [whSearch, setWhSearch] = useState("");
  const [selected, setSelected] = useState({});
  /* deliveries section */
  const [dlSearch, setDlSearch] = useState("");
  const [dlPage, setDlPage] = useState(1);
  const [dlRows, setDlRows] = useState([]);
  const [dlCursors, setDlCursors] = useState([null]);
  const [dlHasMore, setDlHasMore] = useState(false);
  const [dlLoading, setDlLoading] = useState(false);
  const [dlError, setDlError] = useState("");
  /* bump to refetch the current view (after a booking / delete) */
  const [dlReload, setDlReload] = useState(0);
  const [dlStatus, setDlStatus] = useState("All");
  const [dlPayment, setDlPayment] = useState("All");
  const [dlTime, setDlTime] = useState("all");
  /* popups */
  const [statusRow, setStatusRow] = useState(null);
  const [parcelInfo, setParcelInfo] = useState(null);
  const [billOf, setBillOf] = useState(null);
  const [approvalOf, setApprovalOf] = useState(null);
  const [dispatch, setDispatch] = useState(null);

  /* live Pathao statuses for every booking still on the road */
  const syncPathao = useCallback(async (list, recs) => {
    const open = (list || []).filter((d) => !CLOSED_STATUSES.includes(d.parcelStatus));
    if (!open.length) return;
    setSyncNote("Checking Pathao…");
    let changed = 0;
    let failed = 0;
    const next = await Promise.all(
      list.map(async (d) => {
        if (CLOSED_STATUSES.includes(d.parcelStatus)) return d;
        try {
          const info = await getPathaoOrderInfo(d.id);
          const raw = (info && (info.order_status || info.order_status_slug)) || "";
          const label = pathaoStatusLabel(raw);
          if (!raw || label === d.parcelStatus) return d;
          changed += 1;
          await updatePathaoDelivery(d.id, { parcelStatus: label, pathaoRawStatus: raw, statusSyncedAt: Date.now() });
          /* keep the customer's "Pathao Booked" strip in step */
          (d.items || []).forEach((it) => {
            const rec = (recs || []).find((x) => x.kind === it.kind && String(it.kind === "order" ? x.record.orderId : x.record.bookingId) === String(it.id));
            if (rec && rec.record.pathaoBooking && String(rec.record.pathaoBooking.consignmentId) === String(d.id)) {
              updateParcelRecordFields(it.kind, it.id, { "pathaoBooking.orderStatus": raw }).catch(() => {});
            }
          });
          return { ...d, parcelStatus: label, pathaoRawStatus: raw };
        } catch (e) {
          failed += 1;
          return d;
        }
      }),
    );
    setBookings(next);
    setSyncNote(
      failed === open.length
        ? "Couldn't reach Pathao — statuses not refreshed (the Pathao connection only runs on the admin's npm start server)."
        : `Pathao statuses refreshed${changed ? ` · ${changed} updated` : ""}${failed ? ` · ${failed} couldn't be checked` : ""}`,
    );
  }, []);

  const load = useCallback(() => {
    setLoading(true);
    setError("");
    Promise.all([getDeliveryRequests(), getPathaoDeliveriesOverview(), getCustomersForSearch()])
      .then(([requests, list, userList]) => {
        const index = {};
        (userList || []).forEach((u) => {
          if (u && u.id) index[u.id] = u;
        });
        setUsers(index);
        setRecords(requests);
        const sorted = list.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
        setBookings(sorted);
        setSelected({});
        setDlReload((n) => n + 1);
        syncPathao(sorted, requests);
      })
      .catch((e) => setError(String((e && e.message) || e)))
      .finally(() => setLoading(false));
  }, [syncPathao]);
  useEffect(load, [load]);
  /* deliveries saved before search existed get their keywords (once) */
  useEffect(() => {
    ensurePathaoSearchKeys().catch(() => {});
  }, []);

  /* ── derived lists ── */
  const rows = useMemo(
    () =>
      records
        .filter(({ record }) => isInDeliverySection(record))
        .map(({ kind, record }) => buildWarehouseRow(kind, record, users[record.userId]))
        .sort((a, b) => (Number(b.request.handledAt || b.request.requestedAt) || 0) - (Number(a.request.handledAt || a.request.requestedAt) || 0)),
    [records, users],
  );
  const rowByItem = useCallback((kind, id) => rows.find((r) => r.kind === kind && String(r.id) === String(id)), [rows]);

  const deliveries = useMemo(() => bookings.map(decorateDelivery), [bookings]);

  /* the "↓ POD" buttons inside View New POD call back into this page */
  useEffect(() => {
    window.__paicartOpenPOD = (id) => {
      const d = deliveries.find((x) => String(x.pathaoId) === String(id)) || dlRows.find((x) => String(x.pathaoId) === String(id));
      openPODPopup(d ? d.report : undefined);
    };
    return () => {
      delete window.__paicartOpenPOD;
    };
  }, [deliveries, dlRows]);

  const k = useMemo(() => kpis(deliveries), [deliveries]);

  /* approval rows */
  const approvalRows = useMemo(() => deliveries.filter(needsApproval), [deliveries]);
  const apInView = approvalRows.filter((d) => approvalStatusOf(d) === apView);
  const apQuery = apSearch.trim().toLowerCase();
  const apMatches = apQuery
    ? apInView.filter((d) =>
        [d.pathaoId, d.bookingId, ...(d.items || []).map((i) => i.id), d.customer && d.customer.name, d.customer && d.customer.userId, d.customer && d.customer.phone]
          .filter(Boolean)
          .some((v) => String(v).toLowerCase().includes(apQuery)),
      )
    : apInView;
  const apShown = apQuery || apExpanded ? apMatches : apMatches.slice(0, APPROVAL_LIMIT);
  const apExtra = apInView.length - APPROVAL_LIMIT;

  /* warehouse rows */
  const whQuery = whSearch.trim().toLowerCase();
  const whShown = rows.filter(
    (r) =>
      r.view === whView &&
      (whType === "All" || r.type === whType) &&
      (whMethod === "All" || r.method === whMethod) &&
      (!whQuery ||
        [r.id, r.userId, r.customer, r.mobile, r.type, r.shippingMark, r.product, r.deliveryType, ...r.cartons.map((c) => c.trackingNo), ...r.cartons.map((c) => c.name)]
          .filter(Boolean)
          .some((v) => String(v).toLowerCase().includes(whQuery))),
  );
  const remainingCartons = (r) => {
    const booked = new Set(r.request.pathaoCartons || []);
    return r.cartons.filter((c) => !booked.has(c.name));
  };
  const selectable = (r) => r.view === "active" && r.method === "pathao" && remainingCartons(r).length > 0;
  const selectedRows = rows.filter((r) => selected[r.key] && selectable(r));
  const visibleSelectable = whShown.filter(selectable);
  const allVisibleChecked = visibleSelectable.length > 0 && visibleSelectable.every((r) => selected[r.key]);

  /* deliveries table — read from Firestore page by page (newest first) or
     by a live search; never the whole collection */
  const activeCount = deliveries.filter((d) => !CLOSED_STATUSES.includes(d.parcelStatus)).length;
  const timeDays = (TIME_FILTERS.find((t) => t.key === dlTime) || TIME_FILTERS[0]).days;
  const dlQuery = dlSearch.trim();
  const fetchDlPage = useCallback(
    async (pageIndex, cursors) => {
      setDlLoading(true);
      setDlError("");
      try {
        const res = await getPathaoDeliveriesPage({
          after: cursors[pageIndex] || null,
          pageSize: DL_PAGE_SIZE,
          status: dlStatus,
          payment: dlPayment,
          sinceMs: timeDays ? Date.now() - timeDays * 86400000 : null,
        });
        const nextCursors = cursors.slice(0, pageIndex + 1);
        nextCursors[pageIndex + 1] = res.last;
        setDlCursors(nextCursors);
        setDlPage(pageIndex + 1);
        setDlHasMore(res.hasMore);
        setDlRows(res.rows.map(decorateDelivery));
      } catch (e) {
        setDlError(String((e && e.message) || e));
        setDlRows([]);
      } finally {
        setDlLoading(false);
      }
    },
    [dlStatus, dlPayment, timeDays]
  );
  /* filters (or a cleared search) → newest page */
  useEffect(() => {
    if (dlQuery) return undefined;
    fetchDlPage(0, [null]);
    return undefined;
  }, [fetchDlPage, dlQuery, dlReload]);
  /* search → live Firestore lookup (debounced) */
  useEffect(() => {
    if (!dlQuery) return undefined;
    let alive = true;
    setDlLoading(true);
    setDlError("");
    const t = setTimeout(() => {
      searchPathaoDeliveries(dlQuery)
        .then((list) => {
          if (!alive) return;
          const rowsFound = list
            .map(decorateDelivery)
            .filter(
              (d) =>
                (dlStatus === "All" || String(d.parcelStatus).toLowerCase() === dlStatus.toLowerCase()) &&
                (dlPayment === "All" || d.paymentStatus === dlPayment) &&
                withinDays(d.date, timeDays)
            );
          setDlRows(rowsFound);
          setDlHasMore(false);
          setDlPage(1);
        })
        .catch((e) => alive && setDlError(String((e && e.message) || e)))
        .finally(() => alive && setDlLoading(false));
    }, 400);
    return () => {
      alive = false;
      clearTimeout(t);
    };
  }, [dlQuery, dlStatus, dlPayment, timeDays, dlReload]);
  const dlShown = dlRows;
  const dlPaged = dlRows;

  /* ── actions ── */
  const saveWarehouseStatus = async (row, status) => {
    try {
      await setWarehouseDeliveryStatus(row.kind, row.record, status, who);
      setStatusRow(null);
      showDialog({
        tone: "success",
        title: status === WAREHOUSE.DELIVERED ? "Marked delivered" : "Back in Paicart warehouse",
        message: `${row.type} #${row.id} — ${row.deliveryType}.${status === WAREHOUSE.DELIVERED ? " It moved to History & Completed." : ""}`,
      });
      load();
      return true;
    } catch (e) {
      alert(e);
      return false;
    }
  };

  const restore = async (row) => {
    if (!window.confirm(`Restore ${row.type} #${row.id} to Active Warehouse Parcel?`)) return;
    await saveWarehouseStatus(row, WAREHOUSE.IN);
  };

  const approve = async (delivery, amounts) => {
    try {
      const recs = (delivery.items || [])
        .map((it) => rowByItem(it.kind, it.id))
        .filter(Boolean)
        .map((r) => ({ kind: r.kind, id: r.id, record: r.record, due: r.due }));
      await approvePathaoDeliveryPayment(delivery, amounts, who, recs);
      setApprovalOf(null);
      const extra = amounts.paid - amounts.due;
      showDialog({
        tone: "success",
        title: "Payment Approved!",
        items: [
          { label: "Pathao ID", value: delivery.pathaoId },
          {
            label: amounts.adjustment > 0 ? "Adjustment Amount" : extra > 0 ? "Extra Amount" : "Adjustment Amount",
            value: amounts.adjustment > 0 ? `-${approvalMoney(amounts.adjustment)}` : extra > 0 ? `+${approvalMoney(extra)}` : "None",
          },
          { label: "Approved Paid Amount", value: approvalMoney(amounts.paid), tone: "success" },
        ],
      });
      load();
      return true;
    } catch (e) {
      alert(e);
      return false;
    }
  };

  const removeBooking = async (d) => {
    if (!window.confirm(`Are you sure you want to delete this Pathao booking (${d.pathaoId})?\n\nThe customer's home delivery request is cancelled and the parcel goes back to their To Receive, where they can choose a delivery option again. This does NOT cancel the parcel at Pathao — cancel it in the Pathao merchant panel too.`)) return;
    try {
      await deletePathaoDelivery(d, who);
      showDialog({ tone: "success", title: "Booking deleted", message: `${d.pathaoId} was removed. The parcel is back in the customer's To Receive.` });
      load();
    } catch (e) {
      alert(e);
    }
  };

  const onBooked = (made, warning) => {
    setDispatch(null);
    setSelected({});
    showDialog({
      tone: warning ? "warning" : "success",
      title: warning ? "Some bookings were made" : made.length > 1 ? `${made.length} Pathao bookings created` : "Pathao booking successfully submitted!",
      message: warning || "The parcel moved to Pathao Deliveries.",
      items: made.map((d) => ({ label: `${d.pathaoId} · ${d.parcelType} · ${d.deliveryType}`, value: money(d.total), tone: "success" })),
    });
    if (made.length) switchTab("deliveries");
    load();
  };

  /* ── render ── */
  const kpiTile = (label, value, color, sub, subColor, small) => (
    <div className="dl-kpi">
      <div className="dl-kpi-label">{label}</div>
      <div className="dl-kpi-value" style={{ color }}>
        {value}
        {small && <small>{small}</small>}
      </div>
      <div className="dl-kpi-sub" style={{ color: subColor }}>{sub}</div>
    </div>
  );

  return (
    <div className="container-fluid">
      <div className="dl-page">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, flexWrap: "wrap", marginBottom: 16 }}>
          <h1 className="dl-title" style={{ margin: 0 }}>Warehouse Parcel &amp; Delivery Management</h1>
          <div className="dl-controls">
            {syncNote && <span className="dl-muted">{syncNote}</span>}
            <button type="button" className="dl-btn dl-btn-ghost" onClick={load} disabled={loading}>
              <RefreshCw size={13} /> {loading ? "Loading…" : "Refresh"}
            </button>
          </div>
        </div>
        {error && <div className="dl-infobox red" style={{ marginBottom: 16 }}>Could not load: {error}</div>}

        <div className="dl-stack">
          {/* ── KPI tiles ── */}
          <div className="dl-kpis">
            {kpiTile("Pathao Booked Parcel Qty", k.parcels, "#1f2937", <><ArrowRight size={11} style={{ transform: "rotate(-90deg)" }} /> +{k.today} today</>, "#16a34a", `(${k.cartons} Cartons)`)}
            {kpiTile("Pathao Returned Parcel Qty", k.returned, "#dc2626", k.returned > 0 ? `${k.returned} parcel(s) returned` : "No issues", k.returned > 0 ? "#ef4444" : "#9ca3af", `(${k.returnedCartons} Cartons)`)}
            {kpiTile("Bill Received from Cust.", money(k.billReceived), "#16a34a", "Cleared this month", "#16a34a")}
            {kpiTile("Waiting Payment Received", money(k.waitingDue), "#ea580c", k.waitingCount ? `Due across ${k.waitingCount} parcel${k.waitingCount > 1 ? "s" : ""}` : "All payments cleared", k.waitingCount ? "#ea580c" : "#9ca3af")}
            {kpiTile("Total COD Amount", money(k.codTotal), "#2563eb", "Pending collection", "#3b82f6")}
          </div>

          {/* ── section tabs ── */}
          <div className="dl-maintabs" role="tablist">
            {[
              ["warehouse", "Paicart Warehouse Parcels", rows.filter((r) => r.view === "active").length, <Box size={14} key="i" />],
              ["deliveries", "Pathao Deliveries", deliveries.length, <Truck size={14} key="i" />],
              ["payment", "Pathao Payment", awaitingReceive, <Navigation size={14} key="i" />],
            ].map(([key, label, count, icon]) => (
              <button
                key={key}
                type="button"
                role="tab"
                aria-selected={mainTab === key}
                className={`dl-maintab${mainTab === key ? " is-on" : ""}`}
                onClick={() => switchTab(key)}
              >
                {icon} {label}
                <span className="dl-maintab-count">{count}</span>
              </button>
            ))}
          </div>

          {mainTab === "warehouse" && (
            <>
          {/* ── Paicart Warehouse Parcels ── */}
          <div className="dl-card">
            <div className="dl-card-head">
              <div className="dl-controls">
                <h2 className="dl-h2" style={{ marginRight: 6 }}>Paicart Warehouse Parcels</h2>
                <button type="button" className={`dl-tab${whView === "active" ? " is-on" : ""}`} aria-pressed={whView === "active"} onClick={() => setWhView("active")}>🟢 Active Warehouse Parcel</button>
                <button type="button" className={`dl-tab${whView === "history" ? " is-on" : ""}`} aria-pressed={whView === "history"} onClick={() => setWhView("history")}>📦 History &amp; Completed</button>
                <span className="dl-count">{whShown.length} Items Shown</span>
              </div>
              <div className="dl-controls">
                <select className="dl-select" value={whType} onChange={(e) => setWhType(e.target.value)} aria-label="Order type">
                  <option value="All">Order Type: All</option>
                  {ORDER_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                </select>
                <select className="dl-select" value={whMethod} onChange={(e) => setWhMethod(e.target.value)} aria-label="Delivery type">
                  <option value="All">Delivery Type: All</option>
                  {Object.keys(DELIVERY_TYPE_OF_METHOD).map((m) => <option key={m} value={m}>{DELIVERY_TYPE_OF_METHOD[m]}</option>)}
                </select>
                <SearchBox value={whSearch} onChange={setWhSearch} placeholder="Search ID, Mark, Tracking..." width={210} />
              </div>
            </div>
            <div className="dl-table-wrap">
              <table className="dl-table">
                <thead>
                  <tr>
                    <th>
                      <input
                        type="checkbox"
                        title="Select All Pathao Home Delivery Parcels"
                        checked={allVisibleChecked}
                        disabled={!visibleSelectable.length}
                        onChange={(e) => {
                          const next = { ...selected };
                          visibleSelectable.forEach((r) => { next[r.key] = e.target.checked; });
                          setSelected(next);
                        }}
                      />
                    </th>
                    <th>User &amp; Customer Details</th><th>Type</th><th>Order ID</th><th>Shipping Mark</th><th>Tracking No &amp; Carton Wt</th>
                    <th>Carton Info</th><th>Product Name</th><th>BD Wt</th><th>Payment</th><th>Delivery Type</th><th className="right">Update / Action</th>
                  </tr>
                </thead>
                <tbody>
                  {loading && rows.length === 0 ? (
                    <tr><td colSpan={12} className="dl-empty">Loading parcels…</td></tr>
                  ) : whShown.length === 0 ? (
                    <tr><td colSpan={12} className="dl-empty">{whView === "active" ? "No parcels waiting for delivery. Parcels appear here once their delivery request is approved." : "No delivered or booked parcels yet."}</td></tr>
                  ) : (
                    whShown.map((r) => {
                      const remaining = remainingCartons(r);
                      const partial = r.method === "pathao" && remaining.length > 0 && remaining.length < r.cartons.length;
                      return (
                        <tr
                          key={r.key}
                          ref={r.key === focusKey ? (el) => el && !el.dataset.seen && ((el.dataset.seen = "1"), el.scrollIntoView({ block: "center", behavior: "smooth" })) : undefined}
                          style={r.key === focusKey ? { background: "#fff7ed", boxShadow: "inset 3px 0 0 #ff6a00" } : undefined}
                        >
                          <td>
                            <input
                              type="checkbox"
                              checked={!!selected[r.key] && selectable(r)}
                              disabled={!selectable(r)}
                              title={selectable(r) ? "Select this active Pathao parcel for a master package" : "Only active Home Delivery - Pathao parcels can be selected for a master package"}
                              onChange={(e) => setSelected({ ...selected, [r.key]: e.target.checked })}
                            />
                          </td>
                          <td>
                            <div className="dl-brand">{r.userId || "—"}</div>
                            <div style={{ fontWeight: 600, color: "#111827" }}>{r.customer}</div>
                            <div className="dl-muted">{r.mobile}</div>
                          </td>
                          <td><span className={`dl-type ${TYPE_CLASS[r.type]}`}>{r.type}</span></td>
                          <td className="dl-mono" style={{ fontWeight: 600 }}>{r.id}</td>
                          <td style={{ color: "#4b5563" }}>{r.shippingMark || "—"}</td>
                          <td>
                            <div className="dl-mini">
                              <div className="head"><span>Tracking</span><span>Wt</span></div>
                              {r.cartons.slice(0, 6).map((c, i) => (
                                <div key={i}><span style={{ color: "#374151" }}>{c.trackingNo || "-"}</span><b>{Number(c.weight || 0).toFixed(1)} kg</b></div>
                              ))}
                              {r.cartons.length > 6 && <div><span style={{ color: "#9ca3af" }}>+{r.cartons.length - 6} more</span><span /></div>}
                            </div>
                          </td>
                          <td>
                            <button type="button" className={`dl-chip-btn${r.parcelType === "Master CTN" ? " is-master" : ""}`} title="Click to view parcel info" onClick={() => setParcelInfo({ cartons: r.cartons })}>
                              {r.cartons.length} Carton{r.cartons.length === 1 ? "" : "s"} 🔍
                            </button>
                            {partial && <div className="dl-muted" style={{ marginTop: 3 }}>{r.cartons.length - remaining.length}/{r.cartons.length} booked</div>}
                          </td>
                          <td style={{ maxWidth: 220, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }} title={r.product}>{r.product}</td>
                          <td style={{ fontWeight: 600 }}>{r.totalWeight.toFixed(1)} kg</td>
                          <td>
                            {r.due > 0 ? (
                              <span className="dl-pill" style={{ background: "#ffedd5", color: "#c2410c", borderRadius: 6 }}><AlertTriangle size={11} /> Due: {money(r.due)}</span>
                            ) : (
                              <span className="dl-pill" style={{ background: "#dcfce7", color: "#15803d", borderRadius: 6 }}>Paid</span>
                            )}
                          </td>
                          <td style={{ fontWeight: 600, color: DELIVERY_TYPE_COLOR[r.deliveryType] || "#374151" }}>
                            {r.deliveryType}
                            {r.request.source === "admin" && <div className="dl-muted" style={{ fontWeight: 500 }}>set by {r.request.enteredBy || "Paicart"}</div>}
                          </td>
                          <td className="right" style={{ whiteSpace: "nowrap" }}>
                            {r.view === "active" ? (
                              r.method === "pathao" ? (
                                remaining.length ? (
                                  <button type="button" className="dl-btn dl-btn-primary dl-btn-sm" onClick={() => setDispatch({ rows: [r], master: false })}>Pathao Book <ArrowRight size={12} /></button>
                                ) : (
                                  <span className="dl-muted">All cartons booked</span>
                                )
                              ) : (
                                <button type="button" className="dl-btn dl-btn-dark dl-btn-sm" onClick={() => setStatusRow(r)}><Edit size={12} /> Edit Status</button>
                              )
                            ) : (
                              <span style={{ display: "inline-flex", gap: 6, alignItems: "center" }}>
                                {r.deliveryStatus === WAREHOUSE.DELIVERED || r.method !== "pathao" ? (
                                  <span className="dl-pill" style={{ background: "#f0fdf4", color: "#15803d", borderColor: "#bbf7d0" }}><CheckCircle size={11} /> Delivered</span>
                                ) : (
                                  <span className="dl-pill" style={{ background: "#fff7ed", color: "#e04500", borderColor: "#fed7aa" }}><Truck size={11} /> Pathao Booked</span>
                                )}
                                <button
                                  type="button"
                                  onClick={() => restore(r)}
                                  title="Restore to Active Warehouse Parcel"
                                  aria-label={`Restore parcel ${r.id} to Active Warehouse Parcel`}
                                  style={{ width: 34, height: 34, borderRadius: 10, border: "1px solid #a7f3d0", background: "#ecfdf5", color: "#047857", cursor: "pointer", display: "inline-flex", alignItems: "center", justifyContent: "center" }}
                                >
                                  <RotateCcw size={14} />
                                </button>
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
            </>
          )}

          {mainTab === "deliveries" && (
            <>
          {/* ── Pathao Deliveries ── */}
          <div className="dl-card" style={{ borderRadius: 16 }}>
            <div className="dl-card-head is-gray">
              <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                <span className="dl-icon-tile" style={{ boxShadow: "inset 0 1px 2px rgba(0,0,0,.06)" }}><Truck size={16} /></span>
                <div>
                  <h2 className="dl-h2">Pathao Deliveries</h2>
                  <p className="dl-sub">Real-time courier tracking, status updates, and COD collection metrics.</p>
                </div>
              </div>
              <div className="dl-controls">
                <SearchBox value={dlSearch} onChange={setDlSearch} placeholder="Pathao ID, order ID, phone, name…" width={220} />
                <select className="dl-select" value={dlStatus} onChange={(e) => setDlStatus(e.target.value)} aria-label="Parcel status">
                  <option value="All">All Status</option>
                  {PATHAO_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
                <select className="dl-select" value={dlPayment} onChange={(e) => setDlPayment(e.target.value)} aria-label="Payment">
                  <option value="All">Payment: All</option>
                  <option value="Paid">Paid</option>
                  <option value="Unpaid">Unpaid</option>
                </select>
                <select className="dl-select" value={dlTime} onChange={(e) => setDlTime(e.target.value)} aria-label="Time">
                  {TIME_FILTERS.map((t) => <option key={t.key} value={t.key}>{t.label}</option>)}
                </select>
                <span style={{ width: 1, height: 24, background: "#e5e7eb" }} />
                <button type="button" className="dl-btn dl-btn-ghost" title="Prints only Rider Assigned & Pathao pickup requested parcels (without Customer Details)" onClick={() => printActiveDeliveries(dlShown.map((d) => d.report))}>
                  <Printer size={13} color="#ff5000" /> Print
                </button>
                <button type="button" className="dl-btn dl-btn-primary" title="Views POD for Rider Assigned & Pathao pickup requested parcels (with Customer Details)" onClick={() => openViewNewPODReport(dlShown.map((d) => d.report))}>
                  <FileText size={13} /> View New POD
                </button>
                <span className="dl-live"><span className="dl-live-dot" /> {activeCount} Active</span>
              </div>
            </div>
            <div className="dl-table-wrap">
              <table className="dl-table">
                <thead>
                  <tr>
                    <th>Pathao Order ID &amp; Date</th><th>Customer Details</th><th>Shipping Mark</th><th>Product Name &amp; Details</th><th>Parcel Info</th>
                    <th>Total Weight</th><th>Bill</th><th>Payment Status</th><th>Parcel Status</th><th className="center">View POD</th><th className="right">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {dlShown.length === 0 ? (
                    <tr><td colSpan={11} className="dl-empty">{dlLoading ? "Loading…" : dlQuery ? `No delivery found for "${dlQuery}".` : "No Pathao deliveries match these filters."}</td></tr>
                  ) : (
                    dlPaged.map((d) => (
                      <tr key={d.id}>
                        <td className="dl-cid">
                          <span className="dl-cid-chip">
                            <span>{d.pathaoId}</span>
                            <button
                              type="button"
                              title="Copy Pathao order ID"
                              onClick={() => navigator.clipboard && navigator.clipboard.writeText(String(d.pathaoId || ""))}
                            >
                              <Copy size={11} />
                            </button>
                          </span>
                          <span className="dl-cid-date"><Calendar size={11} /> {displayDate(d.date)}</span>
                        </td>
                        <td className="dl-cust">
                          <div className="dl-cust-top">
                            {d.customer && d.customer.userId && <span className="dl-cust-id">{d.customer.userId}</span>}
                            <b>{(d.customer && d.customer.name) || "Customer"}</b>
                          </div>
                          {d.customer && d.customer.phone && (
                            <a className="dl-cust-line dl-cust-phone" href={`tel:${d.customer.phone}`}><Phone size={11} /> {d.customer.phone}</a>
                          )}
                          {d.customer && d.customer.address && (
                            <span className="dl-cust-line dl-cust-addr" title={d.customer.address}><MapPin size={11} /> <span>{d.customer.address}</span></span>
                          )}
                        </td>
                        <td style={{ fontWeight: 600, color: "#1f2937" }}>{d.shippingMark || "—"}</td>
                        <td style={{ maxWidth: 220, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }} title={d.productName}>{d.productName}</td>
                        <td style={{ whiteSpace: "nowrap" }}>
                          <button type="button" className={`dl-chip-btn${d.parcelType === "Master CTN" ? " is-master" : ""}`} onClick={() => setParcelInfo({ cartons: d.cartons, bookingId: (d.items || []).map((i) => i.id).join(", ") || d.bookingId })}>
                            <Box size={11} /> {(d.cartons || []).length} Carton{(d.cartons || []).length === 1 ? "" : "s"} 🔍
                          </button>
                          <span className={`dl-ptype ${PTYPE_CLASS[d.parcelType] || "dl-ptype-single"}`}>{d.parcelType}</span>
                        </td>
                        <td style={{ fontWeight: 800 }}>{Number(d.totalWeight || 0).toFixed(1)} kg</td>
                        <td>
                          <button type="button" className="dl-btn dl-btn-blue dl-btn-sm" style={{ background: "#eff6ff" }} onClick={() => setBillOf(d)}>
                            <FileText size={12} /> {money(d.total)}
                          </button>
                        </td>
                        <td>
                          <span className="dl-pill" style={d.paymentStatus === "Paid" ? { background: "#f0fdf4", color: "#15803d", borderColor: "#dcfce7", borderRadius: 8 } : { background: "#fef2f2", color: "#dc2626", borderColor: "#fee2e2", borderRadius: 8 }}>
                            {d.paymentStatus}
                          </span>
                        </td>
                        <td><StatusPill status={d.parcelStatus} /></td>
                        <td className="center">
                          <button type="button" className="dl-btn dl-btn-ghost dl-btn-sm" title="Download POD" onClick={() => openPODPopup(d.report)}>
                            <Download size={12} color="#ff5000" /> POD
                          </button>
                        </td>
                        <td className="right">
                          {isPickupOrRiderAssigned(d.parcelStatus) ? (
                            <button type="button" title="Delete Booking" onClick={() => removeBooking(d)} style={{ width: 32, height: 32, borderRadius: 12, border: 0, background: "#fef2f2", color: "#ef4444", cursor: "pointer", display: "inline-flex", alignItems: "center", justifyContent: "center" }}>
                              <Trash2 size={14} />
                            </button>
                          ) : (
                            <span style={{ color: "#d1d5db", fontWeight: 700 }}>-</span>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
            {dlError && (
              <div className="dl-infobox red" style={{ margin: "10px 16px" }}>
                {/requires an index/i.test(dlError) ? (
                  <>
                    This filter needs a one-time Firestore index (parcel status + date).{" "}
                    {(dlError.match(/https:\/\/console\.firebase\.google\.com\S+/) || [])[0] && (
                      <a href={(dlError.match(/https:\/\/console\.firebase\.google\.com\S+/) || [])[0]} target="_blank" rel="noopener noreferrer" style={{ fontWeight: 700, textDecoration: "underline" }}>
                        Create the index ↗
                      </a>
                    )}{" "}
                    — click Save there; it is ready in a few minutes, then this filter works for good.
                  </>
                ) : (
                  <>Could not load deliveries: {dlError}</>
                )}
              </div>
            )}
            <div className="dl-pager">
              <span>
                {dlLoading
                  ? "Loading…"
                  : dlQuery
                    ? `${dlRows.length} match${dlRows.length === 1 ? "" : "es"} for "${dlQuery}" (live search)`
                    : dlRows.length
                      ? `Page ${dlPage} · ${(dlPage - 1) * DL_PAGE_SIZE + 1}–${(dlPage - 1) * DL_PAGE_SIZE + dlRows.length} · newest first`
                      : "No deliveries"}
              </span>
              {!dlQuery && (
                <span style={{ display: "flex", gap: 6 }}>
                  <button type="button" className="dl-btn dl-btn-ghost dl-btn-sm" disabled={dlPage <= 1 || dlLoading} onClick={() => fetchDlPage(0, [null])}>« Latest</button>
                  <button type="button" className="dl-btn dl-btn-ghost dl-btn-sm" disabled={dlPage <= 1 || dlLoading} onClick={() => fetchDlPage(dlPage - 2, dlCursors)}>‹ Newer</button>
                  <button type="button" className="dl-btn dl-btn-ghost dl-btn-sm" disabled={!dlHasMore || dlLoading} onClick={() => fetchDlPage(dlPage, dlCursors)}>Older ›</button>
                </span>
              )}
            </div>
          </div>
            </>
          )}

          {mainTab === "payment" && (
            <>
          {/* ── Pathao's own invoices (merchant panel) ── */}
          <PathaoInvoices deliveries={deliveries} onMatch={setInvoiceOf} onAwaiting={setAwaitingReceive} />

            </>
          )}
        </div>

        {/* floating selection bar → master package */}
        {selectedRows.length > 0 && (
          <div className="dl-floating">
            <span><b style={{ color: "#ff5000" }}>{selectedRows.length}</b> bookings selected</span>
            <span className="sep" />
            <button type="button" className="dl-btn dl-btn-primary" onClick={() => setDispatch({ rows: selectedRows, master: true })}>
              <Package size={13} /> Master Package Selected Bookings
            </button>
            <button type="button" className="x" onClick={() => setSelected({})} aria-label="Clear selection"><X size={16} /></button>
          </div>
        )}

        {statusRow && <WarehouseStatusModal row={statusRow} onClose={() => setStatusRow(null)} onSave={(s) => saveWarehouseStatus(statusRow, s)} />}
        {parcelInfo && <ParcelInfoModal cartons={parcelInfo.cartons} bookingId={parcelInfo.bookingId} onClose={() => setParcelInfo(null)} />}
        {billOf && <BillModal delivery={billOf} onClose={() => setBillOf(null)} />}
        {approvalOf && (
          <ApprovalModal delivery={approvalOf} canApprove={canApprove} onClose={() => setApprovalOf(null)} onApprove={(a) => approve(approvalOf, a)} />
        )}
        {dispatch && (
          <PathaoDispatchDrawer rows={dispatch.rows} master={dispatch.master} admin={admin} onClose={() => setDispatch(null)} onBooked={onBooked} />
        )}
      </div>
    </div>
  );
};

export default DeliveryPage;
