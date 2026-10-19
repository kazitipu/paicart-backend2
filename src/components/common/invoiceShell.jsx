import React, { Component } from "react";
import ReactToPrint from "react-to-print";
import { Printer, Download } from "react-feather";
import { InvoiceSheet, InvoiceHeader, InvoiceFooter } from "./invoiceParts.jsx";

/* The invoice document itself lives in invoiceParts.jsx, a verbatim copy of
 * the customer app's src/components/invoice/InvoiceParts.jsx — so the admin's
 * printed invoice is the same document the customer downloads. This file only
 * adds the admin toolbar (react-to-print v2 + PDF download). */
export * from "./invoiceParts.jsx";

const toolbarButton = {
  display: "inline-flex",
  alignItems: "center",
  gap: 6,
  padding: "8px 16px",
  borderRadius: 12,
  fontSize: 13,
  fontWeight: "bold",
  cursor: "pointer",
  border: "1px solid #e5e7eb",
};

class InvoiceShell extends Component {
  state = { downloading: false };

  /* Rasterise the sheet and slice it across A4 pages — same approach as the
     customer app, so both produce the same PDF. */
  handleDownloadPdf = async () => {
    if (!this.printRef || this.state.downloading) return;
    this.setState({ downloading: true });
    try {
      const [{ default: html2canvas }, { jsPDF }] = await Promise.all([
        import("html2canvas"),
        import("jspdf"),
      ]);
      const canvas = await html2canvas(this.printRef, {
        scale: 2,
        useCORS: true,
        backgroundColor: "#ffffff",
      });
      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF({ orientation: "portrait", unit: "pt", format: "a4" });
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const imgHeight = (canvas.height * pageWidth) / canvas.width;

      let heightLeft = imgHeight;
      let position = 0;
      pdf.addImage(imgData, "PNG", 0, position, pageWidth, imgHeight);
      heightLeft -= pageHeight;
      while (heightLeft > 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, "PNG", 0, position, pageWidth, imgHeight);
        heightLeft -= pageHeight;
      }
      pdf.save(`Paicart-Invoice-${this.props.docId}.pdf`);
    } catch (err) {
      console.error(err);
      alert("Could not generate the PDF. Try Print instead.");
    } finally {
      this.setState({ downloading: false });
    }
  };

  render() {
    const { logo, docType, docId, docDate, status, paid, loading, notFound, children } =
      this.props;
    const { downloading } = this.state;
    return (
      <div style={{ background: "#f3f4f6", padding: "24px 12px", minHeight: "100vh" }}>
        <div style={{ width: "210mm", maxWidth: "100%", margin: "0 auto" }}>
          <div
            className="invoice-toolbar"
            style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginBottom: 16 }}
          >
            <ReactToPrint
              trigger={() => (
                <button style={{ ...toolbarButton, background: "white", color: "#374151" }}>
                  <Printer size={14} /> Print
                </button>
              )}
              content={() => this.printRef}
              documentTitle={`Paicart-Invoice-${docId}`}
            />
            <button
              onClick={this.handleDownloadPdf}
              disabled={downloading}
              style={{
                ...toolbarButton,
                background: "#FF6A00",
                color: "white",
                border: "1px solid #FF6A00",
                opacity: downloading ? 0.6 : 1,
              }}
            >
              <Download size={14} />
              {downloading ? "Preparing…" : "Download PDF"}
            </button>
          </div>
          {loading ? (
            <div
              style={{
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                height: 256,
                color: "#9ca3af",
                fontSize: 13,
              }}
            >
              Loading invoice…
            </div>
          ) : (
            <InvoiceSheet sheetRef={(el) => (this.printRef = el)} paid={paid && !notFound}>
              <InvoiceHeader
                logo={logo}
                docType={docType}
                docId={docId}
                docDate={docDate}
                status={notFound ? null : status}
              />
              {notFound ? (
                <p style={{ color: "#9CA3AF", textAlign: "center", padding: "64px 0" }}>
                  Invoice not found.
                </p>
              ) : (
                children
              )}
              <InvoiceFooter />
            </InvoiceSheet>
          )}
        </div>
      </div>
    );
  }
}

export default InvoiceShell;
