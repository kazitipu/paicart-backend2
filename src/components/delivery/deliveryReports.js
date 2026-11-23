// New-window documents for the Pathao Deliveries admin page:
//  - openPODPopup(record)            -> one delivery's A5 POD slip
//  - printActiveDeliveries(records)  -> A4 dispatch print report (auto print)
//  - openViewNewPODReport(records)   -> A4 "View New POD" report with per-row POD buttons
// Records are pre-computed by the page; nothing is fetched here.

const PICKUP_OR_RIDER_STATUSES = ["pathao pickup requested", "rider assigned"];

export function isPickupOrRiderAssigned(status) {
  const s = String(status == null ? "" : status).trim().toLowerCase();
  return PICKUP_OR_RIDER_STATUSES.indexOf(s) !== -1;
}

function esc(value) {
  return String(value == null ? "" : value).replace(/[&<>"']/g, function (ch) {
    return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[ch];
  });
}

function pad2(n) {
  const s = String(n);
  return s.length < 2 ? "0" + s : s;
}

function toNumber(value) {
  const n = Number(value);
  return isNaN(n) ? 0 : n;
}

function cartonsOf(record) {
  return record && Array.isArray(record.cartons) ? record.cartons : [];
}

function totalWeightText(record) {
  return toNumber(record.totalWeightNumber).toFixed(1) + " kg";
}

function billText(record) {
  return toNumber(record.billTotal).toLocaleString() + " ৳";
}

function reportDateText() {
  return new Date()
    .toLocaleDateString("en-GB", { day: "2-digit", month: "long", year: "numeric" })
    .toUpperCase();
}

function writeDocument(win, html) {
  win.document.open();
  win.document.write(html);
  win.document.close();
  win.focus();
}

// ---------------------------------------------------------------------------
// POD slip (A5)
// ---------------------------------------------------------------------------

const POD_CSS =
  '@page{size:A5 portrait;margin:10mm}*{box-sizing:border-box}body{font-family:Inter,"Segoe UI",Arial,sans-serif;margin:0;background:#f1f5f9;color:#1e293b;padding:20px;-webkit-print-color-adjust:exact;print-color-adjust:exact}.pod-sheet{max-width:700px;margin:auto;background:#fff;border:1px solid #e2e8f0;border-radius:18px;padding:28px;box-shadow:0 12px 30px rgba(15,23,42,.08)}.pod-brand{font-weight:900;font-size:24px;color:#ff5000;letter-spacing:1px}.pod-brand small{display:block;font-size:9px;color:#64748b;letter-spacing:2px;margin-top:4px}.pod-heading{display:flex;justify-content:space-between;align-items:flex-start;gap:15px;border-bottom:2px solid #f1f5f9;padding-bottom:18px;margin-bottom:18px}.pod-heading h1{font-size:18px;margin:2px 0 5px}.pod-heading p{font-size:11px;color:#64748b;margin:0}.pod-id{padding:8px 10px;background:#fff7ed;color:#c2410c;border:1px solid #fed7aa;border-radius:9px;font-family:monospace;font-size:12px;font-weight:900}.pod-grid{display:grid;grid-template-columns:1fr 1fr;gap:10px}.pod-field{border:1px solid #e2e8f0;border-radius:10px;padding:11px;min-height:64px}.pod-field.wide{grid-column:1/-1}.pod-field label{display:block;text-transform:uppercase;font-size:9px;color:#64748b;letter-spacing:.8px;font-weight:800;margin-bottom:6px}.pod-field strong{font-size:12px;line-height:1.5;overflow-wrap:anywhere}.pod-signatures{display:grid;grid-template-columns:1fr 1fr;gap:26px;margin-top:40px}.signature{border-top:1px solid #94a3b8;padding-top:7px;font-size:10px;color:#64748b;text-align:center}.pod-note{margin-top:24px;background:#f8fafc;border-radius:8px;padding:10px;color:#64748b;font-size:9px;line-height:1.5}.pod-actions{display:flex;justify-content:center;gap:10px;margin:18px auto 0}.pod-actions button{padding:10px 15px;border:0;border-radius:9px;font-size:12px;font-weight:800;cursor:pointer;background:#ff5000;color:#fff}.pod-actions button.secondary{background:#e2e8f0;color:#334155}@media print{body{padding:0;background:white}.pod-sheet{box-shadow:none;border:0;border-radius:0;padding:0}.pod-actions{display:none}}';

function buildPODDocument(record) {
  const cellBase = "padding:6px 8px;border:1px solid #e2e8f0;";
  const cartonRowsHtml = cartonsOf(record)
    .map(function (c) {
      return (
        "<tr>" +
        '<td style="' + cellBase + 'font-family:monospace;font-weight:700;">' + esc(c.name) + "</td>" +
        '<td style="' + cellBase + 'font-family:monospace;">' + esc(c.trackingNo || "-") + "</td>" +
        '<td style="' + cellBase + 'font-family:monospace;font-weight:800;color:#ff5000;text-align:right;">' + esc(c.weight) + " kg</td>" +
        "</tr>"
      );
    })
    .join("");

  const customerLine =
    esc(record.customerName) + (record.customerId ? " · " + esc(record.customerId) : "");

  return (
    '<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">' +
    "<title>POD - " + esc(record.pathaoId) + "</title>" +
    "<style>" + POD_CSS + "</style></head><body>" +
    '<main class="pod-sheet"><header class="pod-heading"><div><div class="pod-brand">PAICART<small>WAREHOUSE &amp; DISPATCH</small></div>' +
    "<h1>Delivery Confirmation / POD Slip</h1>" +
    "<p>Admin-generated delivery record · Date: " + esc(record.displayDate) + "</p></div>" +
    '<div class="pod-id">' + esc(record.pathaoId) + "</div></header>" +
    '<section class="pod-grid">' +
    '<div class="pod-field"><label>Customer / User ID</label><strong>' + customerLine + "</strong></div>" +
    '<div class="pod-field"><label>Customer Phone</label><strong>' + esc(record.customerPhone || "Not provided") + "</strong></div>" +
    '<div class="pod-field"><label>Delivery Address</label><strong>' + esc(record.customerAddress || "") + "</strong></div>" +
    '<div class="pod-field"><label>Shipping Mark</label><strong>' + esc(record.shippingMark) + "</strong></div>" +
    '<div class="pod-field wide"><label>Product Name &amp; Details</label><strong>' + esc(record.productName) + "</strong></div>" +
    '<div class="pod-field wide">' +
    "<label>Carton, Tracking No &amp; Individual Weight Breakdown (" + esc(record.parcelType) + ")</label>" +
    '<table style="width:100%;border-collapse:collapse;font-size:11px;margin-top:4px;">' +
    '<thead><tr style="background:#f8fafc;text-align:left;">' +
    '<th style="' + cellBase + '">Carton Ref</th>' +
    '<th style="' + cellBase + '">Tracking No</th>' +
    '<th style="' + cellBase + 'text-align:right;">Individual Wt</th>' +
    "</tr></thead>" +
    "<tbody>" + cartonRowsHtml + "</tbody></table></div>" +
    '<div class="pod-field"><label>Total Weight</label><strong>' + esc(totalWeightText(record)) + "</strong></div>" +
    '<div class="pod-field"><label>Bill</label><strong>' + esc(billText(record)) + "</strong></div>" +
    '<div class="pod-field"><label>Payment Status</label><strong>' + esc(record.paymentStatus) + "</strong></div>" +
    '<div class="pod-field"><label>Current Parcel Status</label><strong>' + esc(record.parcelStatus) + "</strong></div>" +
    "</section>" +
    '<section class="pod-signatures"><div class="signature">Receiver Name / Signature</div><div class="signature">Delivery Date &amp; Time</div></section>' +
    '<div class="pod-note">Note: This is an admin-generated POD slip based on the information available in this dispatch interface.</div>' +
    '<div class="pod-actions"><button onclick="window.print()">Download / Print POD PDF</button><button class="secondary" onclick="window.close()">Close</button></div>' +
    "</main></body></html>"
  );
}

export function openPODPopup(record) {
  if (!record) {
    window.alert("This Pathao order could not be found in the current table.");
    return;
  }
  const windowName = "pod_" + String(record.pathaoId || "").replace(/[^A-Za-z0-9_]/g, "_");
  const podWindow = window.open("", windowName, "width=820,height=900,resizable=yes,scrollbars=yes");
  if (!podWindow) {
    window.alert("Please allow pop-ups for this site to open the POD slip.");
    return;
  }
  writeDocument(podWindow, buildPODDocument(record));
}

// ---------------------------------------------------------------------------
// A4 reports (Print / View New POD)
// ---------------------------------------------------------------------------

function renderCartonBreakdown(record) {
  const cartons = cartonsOf(record);
  const count = cartons.length;
  const cartonLines = cartons
    .map(function (carton) {
      return (
        "<tr><td>" + esc(carton.name) + "</td><td>" + esc(carton.trackingNo || "") +
        '</td><td class="wt-col">' + esc(carton.weight) + " kg</td></tr>"
      );
    })
    .join("");
  return (
    '<div class="carton-box">' +
    '<div class="carton-countbar">' + count + " CARTON" + (count === 1 ? "" : "S") + "</div>" +
    '<table class="carton-mini"><thead><tr><th>CB REFERENCE</th><th>TRACKING NO.</th><th>WT</th></tr></thead><tbody>' +
    (cartonLines || '<tr><td colspan="3">Tracking details unavailable</td></tr>') +
    "</tbody></table></div>"
  );
}

function activeDeliveryTableRowsHTML(records, includePod) {
  return records
    .map(function (record) {
      const type = String(record.parcelType || "").toLowerCase();
      const parcelTheme =
        type.indexOf("baby") !== -1 ? "parcel-baby" : type.indexOf("master") !== -1 ? "parcel-master" : "parcel-single";

      const customerCellHTML = includePod
        ? '<td><div class="customer-details">' +
          "<span>ID: <b>" + esc(record.customerId) + "</b></span>" +
          "<span>Name: " + esc(record.customerName) + "</span>" +
          "<span>Address: " + esc(record.customerAddress) + "</span>" +
          "<span>Mobile: <b>" + esc(record.customerPhone) + "</b></span>" +
          "</div></td>"
        : "";

      // JSON.stringify gives a safe JS string literal; esc() makes it safe inside the attribute.
      const idLiteral = esc(JSON.stringify(String(record.pathaoId == null ? "" : record.pathaoId)));
      const podCellHTML = includePod
        ? '<td class="pod-cell"><div class="pod-number">' +
          "<span>" + esc(record.bookingId || record.pathaoId) + "</span>" +
          '<button type="button" class="pod-download-btn" title="Download POD for ' + esc(record.pathaoId) + '" ' +
          'onclick="if (window.opener &amp;&amp; !window.opener.closed &amp;&amp; typeof window.opener.__paicartOpenPOD === \'function\') { window.opener.__paicartOpenPOD(' +
          idLiteral +
          "); } else { window.print(); }\">↓ POD</button>" +
          "</div></td>"
        : "";

      return (
        "<tr>" +
        '<td class="order-id">' + esc(record.pathaoId) +
        '<div style="font-size:5.8px;color:#6b7280;margin-top:2px;">' + esc(record.displayDate) + "</div>" +
        '<div style="font-size:5.5px;color:#d97706;font-weight:700;margin-top:2px;">' + esc(record.parcelStatus) + "</div></td>" +
        customerCellHTML +
        '<td class="shipping-mark">' + esc(record.shippingMark) + "</td>" +
        '<td class="parcel-info-cell">' + renderCartonBreakdown(record) + "</td>" +
        '<td class="parcel-type-cell"><span class="parcel-type-pill ' + parcelTheme + '">' + esc(record.parcelType) + "</span></td>" +
        '<td class="weight-cell">' + esc(totalWeightText(record)) + "</td>" +
        podCellHTML +
        "</tr>"
      );
    })
    .join("");
}

function buildActiveDeliveriesReportHTML(records, includePod) {
  const reportDate = reportDateText();
  const totalWeight = records.reduce(function (sum, r) {
    return sum + toNumber(r.totalWeightNumber);
  }, 0);
  const totalCartons = records.reduce(function (sum, r) {
    return sum + (Array.isArray(r.cartons) ? r.cartons.length : 1);
  }, 0);
  const uniqueIds = {};
  records.forEach(function (r) {
    if (r.bookingId) uniqueIds[String(r.bookingId)] = true;
  });
  const uniquePodIds = Object.keys(uniqueIds).length;

  const thirdStatLabel = includePod ? "UNIQUE POD IDS" : "TOTAL CARTONS";
  const thirdStatValue = includePod ? pad2(uniquePodIds) : pad2(totalCartons);
  const customerHeaderHTML = includePod ? "<th>Customer Details</th>" : "";
  const podHeaderHTML = includePod ? "<th>POD</th>" : "";
  const tableClass = includePod ? "report-table with-pod" : "report-table no-pod";

  return (
    '<div class="report-shell">' +
    '<header class="report-heading">' +
    '<div class="eyebrow">DELIVERY OPERATIONS / PATHAO (PICKUP REQUESTED &amp; RIDER ASSIGNED)</div>' +
    "<h1>" + (includePod ? "View New POD - Pathao Dispatch" : "Active Pathao Delivery - Dispatch Print") + "</h1>" +
    "<p>FILTERED STATUS: PATHAO PICKUP REQUESTED &amp; RIDER ASSIGNED · " + esc(reportDate) + "</p>" +
    "</header>" +
    '<section class="report-stats">' +
    '<div class="stat-card"><span>TOTAL ORDERS</span><strong>' + pad2(records.length) + "</strong></div>" +
    '<div class="stat-card"><span>TOTAL WEIGHT</span><strong>' + totalWeight.toFixed(1) + " kg</strong></div>" +
    '<div class="stat-card"><span>' + thirdStatLabel + "</span><strong>" + thirdStatValue + "</strong></div>" +
    "</section>" +
    '<h2 class="section-title">DISPATCH PARCELS (RIDER ASSIGNED &amp; PATHAO PICKUP REQUESTED)</h2>' +
    '<div class="table-wrap"><table class="' + tableClass + '">' +
    "<thead><tr><th>Pathao ID<br>&amp; Date</th>" + customerHeaderHTML +
    "<th>Shipping<br>Mark</th><th>Parcel Info (Tracking &amp; Wt)</th><th>Parcel Type</th><th>Total<br>Weight</th>" +
    podHeaderHTML + "</tr></thead>" +
    "<tbody>" + activeDeliveryTableRowsHTML(records, includePod) + "</tbody>" +
    "</table></div>" +
    '<footer class="report-footer">' +
    (includePod
      ? "Showing Rider Assigned &amp; Pathao pickup requested parcels with Customer Details and individual POD download buttons."
      : "Print View: Showing Rider Assigned &amp; Pathao pickup requested parcels (Customer Details &amp; POD columns excluded).") +
    "</footer></div>"
  );
}

const REPORT_CSS = [
  "@page{size:A4 portrait;margin:7mm}",
  ".report-canvas,.report-canvas *{box-sizing:border-box;-webkit-print-color-adjust:exact;print-color-adjust:exact}",
  ".report-canvas{width:100%;margin:0;padding:0;background:#fff;color:#29313d;font-family:Arial,Helvetica,sans-serif}",
  ".report-shell{width:100%;max-width:none;margin:0;padding:0;background:#fff;border:0;border-radius:0;box-shadow:none}",
  ".report-heading{border-top:4px solid #ff6a00;padding:9px 7px 12px}",
  ".eyebrow{font-size:8px;font-weight:800;letter-spacing:1.2px;text-transform:uppercase;color:#e96a16;margin-bottom:5px}",
  ".report-heading h1{font-size:22px;line-height:1.1;margin:0 0 4px;font-weight:800;letter-spacing:-.35px;color:#17202d}",
  ".report-heading p{font-size:8px;font-weight:600;letter-spacing:.2px;color:#667080;margin:0}",
  ".report-stats{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));border:1px solid #dfe4ea;margin:7px 7px 17px;background:#fff}",
  ".stat-card{min-height:44px;padding:8px 14px;border-right:1px solid #e2e6eb;display:flex;flex-direction:column;justify-content:center;gap:4px}",
  ".stat-card:last-child{border-right:0}.stat-card span{font-size:6.5px;font-weight:800;color:#747d8a;letter-spacing:.5px}.stat-card strong{font-size:14px;font-weight:800;color:#26303d}",
  ".section-title{font-size:9px;font-weight:800;color:#343b45;margin:0 7px 6px;letter-spacing:.2px}",
  ".table-wrap{width:100%;overflow:visible}",
  ".report-table{width:100%;border-collapse:collapse;table-layout:fixed;border:1px solid #dfe3e8}",
  ".report-table th{background:#1f2937;color:#fff;font-size:6.3px;line-height:1.2;font-weight:800;text-transform:uppercase;text-align:center;vertical-align:middle;padding:8px 3px;border:1px solid #5e6670}",
  ".report-table th:first-child{background:#ff6500;border-color:#ff8c3b}",
  ".report-table.with-pod th:nth-child(1){width:12%}.report-table.with-pod th:nth-child(2){width:21%}.report-table.with-pod th:nth-child(3){width:11%}.report-table.with-pod th:nth-child(4){width:28%}.report-table.with-pod th:nth-child(5){width:10%}.report-table.with-pod th:nth-child(6){width:8%}.report-table.with-pod th:nth-child(7){width:10%}",
  ".report-table.no-pod th:nth-child(1){width:16%}.report-table.no-pod th:nth-child(2){width:16%}.report-table.no-pod th:nth-child(3){width:40%}.report-table.no-pod th:nth-child(4){width:14%}.report-table.no-pod th:nth-child(5){width:14%}",
  ".report-table td{font-size:7px;line-height:1.35;padding:7px 4px;border:1px solid #e1e5ea;vertical-align:middle;overflow-wrap:anywhere}",
  ".report-table tbody tr:nth-child(even){background:#f7f9fb}.report-table tbody tr{break-inside:avoid;page-break-inside:avoid}",
  ".order-id{text-align:center;font-weight:800;font-family:Consolas,monospace;color:#303945;font-size:7px!important}",
  ".customer-details{display:flex;flex-direction:column;gap:2px;color:#3f4752;font-size:6.5px;line-height:1.35}.customer-details b{color:#29313d}",
  ".shipping-mark{text-align:center;font-weight:800;font-size:7px!important;overflow-wrap:anywhere}",
  ".parcel-info-cell{padding:5px 3px!important}.carton-box{border:1px solid #e4e7eb;background:#fff;width:100%;}",
  ".carton-countbar{background:#fff0e3;color:#db6b23;font-size:6.5px;font-weight:800;text-align:center;padding:4px 2px;border-bottom:1px solid #f2dfcf;letter-spacing:.15px}",
  ".carton-mini{width:100%;table-layout:fixed;border-collapse:collapse}.carton-mini th{background:#f8fafc!important;color:#666f7b!important;border:0!important;border-bottom:1px solid #e8ebef!important;font-size:5px!important;letter-spacing:.1px;padding:3px 2px!important}",
  ".carton-mini td{font-family:Consolas,monospace;font-size:5.8px!important;line-height:1.2!important;text-align:center;padding:3px 1px!important;border:0!important;border-bottom:1px solid #edf0f3!important;overflow-wrap:anywhere}",
  ".carton-mini td.wt-col{font-weight:800;color:#e04500;background:#fffaf5}",
  ".carton-mini tr:last-child td{border-bottom:0!important}.carton-mini th:nth-child(1){width:38%}.carton-mini th:nth-child(2){width:40%}.carton-mini th:nth-child(3){width:22%}",
  ".parcel-type-cell{text-align:center}.parcel-type-pill{display:inline-block;padding:3px 3px;font-size:6.4px;font-weight:800;color:#26303d;overflow-wrap:anywhere}.parcel-master{color:#4b5563}.parcel-single{color:#353d49}.parcel-baby{color:#353d49}",
  ".weight-cell{text-align:center;font-size:7px!important;font-weight:800;white-space:nowrap}",
  ".pod-cell{text-align:center}.pod-number{display:flex;flex-direction:column;align-items:center;gap:5px;font-family:Consolas,monospace;font-size:6.7px;font-weight:800;color:#343c47;overflow-wrap:anywhere}",
  ".pod-download-btn{display:inline-flex;justify-content:center;align-items:center;background:#ff6500;color:#fff;border:0;border-radius:5px;padding:4px 7px;font-size:7px;font-family:Arial,sans-serif;font-weight:900;cursor:pointer;box-shadow:0 2px 5px rgba(255,101,0,.25)}",
  ".pod-download-btn:hover{background:#e04500}",
  ".report-footer{margin-top:10px;padding-top:7px;border-top:1px solid #e5e7eb;color:#7e8793;font-size:6px;line-height:1.4;font-weight:500}",
  "@media screen{.report-canvas{padding:14px;background:#f3f4f6}.report-canvas .report-shell{max-width:850px;margin:0 auto;padding:14px;background:#fff;box-shadow:0 4px 22px rgba(15,23,42,.08)}}",
  "@media print{.report-canvas{padding:0;background:#fff}.report-canvas .report-shell{max-width:none;margin:0;padding:0;box-shadow:none}.report-canvas .report-table thead{display:table-header-group}.report-canvas .report-table tr{break-inside:avoid;page-break-inside:avoid}.report-canvas .report-stats,.report-canvas .report-heading,.report-canvas .section-title{break-inside:avoid;page-break-inside:avoid}}",
].join("\n");

function buildActiveDeliveriesDocument(records, includePod) {
  return (
    '<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0">' +
    "<title>" + (includePod ? "View New POD" : "Active Pathao Delivery Print") + " | PAICART</title>" +
    "<style>" + REPORT_CSS + "</style></head>" +
    '<body style="margin:0"><div class="report-canvas">' + buildActiveDeliveriesReportHTML(records, includePod) + "</div></body></html>"
  );
}

function pickupOrRiderRecords(records) {
  return (Array.isArray(records) ? records : []).filter(function (r) {
    return r && isPickupOrRiderAssigned(r.parcelStatus);
  });
}

export function printActiveDeliveries(records) {
  const rows = pickupOrRiderRecords(records);
  if (!rows.length) {
    window.alert('There are no visible parcels with "Rider Assigned" or "Pathao pickup requested" status to print.');
    return;
  }
  const printWindow = window.open("", "paicartActiveDeliveriesPrint", "width=1050,height=900,resizable=yes,scrollbars=yes");
  if (!printWindow) {
    window.alert("Please allow pop-ups for this site to open the print page.");
    return;
  }
  writeDocument(printWindow, buildActiveDeliveriesDocument(rows, false));
  printWindow.setTimeout(function () {
    printWindow.print();
  }, 500);
}

export function openViewNewPODReport(records) {
  const rows = pickupOrRiderRecords(records);
  if (!rows.length) {
    window.alert('There are no visible parcels with "Rider Assigned" or "Pathao pickup requested" status to view in POD.');
    return;
  }
  const podViewWindow = window.open("", "paicartViewNewPodWindow", "width=1100,height=900,resizable=yes,scrollbars=yes");
  if (!podViewWindow) {
    window.alert("Please allow pop-ups for this site to open View New POD.");
    return;
  }
  writeDocument(podViewWindow, buildActiveDeliveriesDocument(rows, true));
}
