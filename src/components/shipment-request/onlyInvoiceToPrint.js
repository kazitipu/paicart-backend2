import React, { Component } from "react";
import { getSingleShipForMeRedux } from "../../actions/index";
import { connect } from "react-redux";
import "./invoice-by-order.css";
import PaicartLogo from "../common/paicart_logo.png";
import { withRouter } from "react-router-dom";
import { getSingleUser } from "../../firebase/firebase.utils";
import InvoiceShell, {
  InvoiceSummary,
  InvoiceParties,
  InvoiceSection,
  InvoiceGrid,
  InvoiceField,
  InvoiceChipRow,
  InvoiceCartonTable,
  InvoiceItemsTable,
  InvoiceTotals,
  InvoiceRow,
  InvoiceDivider,
  InvoiceDueRow,
  InvoicePayments,
  InvoiceNotes,
  INVOICE_TERMS,
  invoiceStatusOf,
  billToFromUser,
  toInvoiceList,
  isInvoicePlaceholder,
  tk,
} from "../common/invoiceShell.jsx";

/* Same document as the customer's Ship For Me invoice (paicart-nextjs15
   src/app/pages/dashboard/ship-for/invoice). */

/* Requests store the booked date as dd/mm/yyyy. */
const toIsoDate = (value) => {
  if (!value) return "";
  const [d, m, y] = String(value).split("/");
  return d && m && y ? `${y}-${m}-${d}` : value;
};

/* The customer-facing wording for each stage, mirrored from the customer
   app's STATUS_BADGE so both invoices name a stage the same way. */
const STATUS_LABELS = {
  Pending: "Booking Confirmed",
  "Rates Provided": "Rates Provided",
  "Abroad Warehouse": "Abroad Warehouse",
  "Ready for fly": "Ready for fly",
  "Bangladesh customs": "🇧🇩 BD Customs",
  "Bangladesh warehouse": "Custom Released",
  "Paicart warehouse": "Paicart WH",
  Delivered: "Delivered",
  Reject: "Rejected",
  Cancelled: "Cancelled",
};

/* A sea parcel is loaded onto a vessel rather than flown. The stored status
   stays "Ready for fly" - only what is read changes. */
const isSeaShipment = (req) =>
  String((req && (req.shipmentMethod || req.method || req.shipBy)) || "")
    .trim()
    .toLowerCase() === "sea";

const getStatusLabel = (req) => {
  if (!req) return "";
  if (req.status === "Ready for fly" && isSeaShipment(req)) {
    return "Ready for vessel";
  }
  return STATUS_LABELS[req.status] || req.status || "Pending";
};

const getTotalPaid = (req) => {
  if (!req || !req.payments || req.payments.length === 0) return 0;
  return req.payments.reduce((a, p) => a + (parseInt(p.amount) || 0), 0);
};

export class OnlyInvoieToPrint extends Component {
  state = { loading: true, user: null };

  componentDidMount = async () => {
    await this.props.getSingleShipForMeRedux(this.props.match.params.bookingId);
    this.setState({ loading: false });
    this.loadUser();
  };

  componentDidUpdate = () => {
    this.loadUser();
  };

  /* Billed To comes from the customer's profile */
  loadUser = async () => {
    const req = this.props.orderObj;
    if (!req || !req.userId || this.loadingUserFor === req.userId) return;
    this.loadingUserFor = req.userId;
    const user = await getSingleUser(req.userId);
    this.setState({ user });
  };

  render() {
    const req = this.props.orderObj;
    const bookingId = this.props.match.params.bookingId;
    const { user, loading } = this.state;

    const totalPaid = getTotalPaid(req);
    /* The weight × rate figure is an informational line only - the real
       bill is whatever the admin set on shippingChargeCustomer. */
    const weightRateCharge =
      req && req.receivedWeight && req.customerRate
        ? Math.round(req.receivedWeight * req.customerRate)
        : null;
    const otherCost = parseFloat(req && req.otherCost) || 0;
    const discount = parseFloat(req && req.discount) || 0;
    const refund = parseFloat(req && req.refund) || 0;
    const totalBill = parseInt(req && req.shippingChargeCustomer) || 0;
    const totalDue = totalBill - totalPaid;
    const sea = isSeaShipment(req);

    const tracking = req
      ? (Array.isArray(req.trackingNumbers) && req.trackingNumbers.length
          ? req.trackingNumbers
          : toInvoiceList(req.trackingNo)
        ).filter((t) => !isInvoicePlaceholder(t))
      : [];
    const cartons = req ? toInvoiceList(req.ctnNo) : [];
    const marks = req ? toInvoiceList(req.shippingMark) : [];
    const paired = cartons.length > 0 && cartons.length === marks.length;

    return (
      <InvoiceShell
        logo={PaicartLogo}
        docType="Ship For Me Invoice"
        docId={bookingId}
        docDate={toIsoDate(req && req.date)}
        status={req ? invoiceStatusOf(req) : null}
        paid={totalBill > 0 && totalDue <= 0}
        loading={loading}
        notFound={!req}
      >
        {req && (
          <>
            <InvoiceSummary
              total={totalBill}
              paid={totalPaid}
              due={totalBill > 0 ? totalDue : null}
              totalLabel="Shipping Bill"
            />
            <InvoiceParties
              billTo={billToFromUser(user)}
              details={[
                { label: "Booking ID", value: `#${req.bookingId || bookingId}` },
                { label: "Booked On", value: toIsoDate(req.date) },
                { label: "Ship From", value: req.shipFrom },
                { label: "Method", value: sea ? "By Sea" : "By Air" },
                { label: "Status", value: getStatusLabel(req) },
              ]}
            />

            <InvoiceSection title="Shipment Details">
              <InvoiceGrid columns={3}>
                <InvoiceField label="Product" value={req.othersProductName} />
                <InvoiceField
                  label="Quantity"
                  value={req.productQuantity ? `${req.productQuantity} pcs` : ""}
                />
                <InvoiceField
                  capitalize
                  label="Contains"
                  value={
                    req.productContains && req.productContains !== "none"
                      ? req.productContains
                      : "None"
                  }
                />
                <InvoiceField label="Cartons" value={req.ctnQuantity} />
                <InvoiceField label="Total CBM" value={req.totalCbm ? `${req.totalCbm} cbm` : ""} />
                <InvoiceField
                  label="Actual Weight"
                  value={
                    req.receivedWeight
                      ? `${req.receivedWeight} kg`
                      : req.weight
                        ? `${req.weight} kg (booked)`
                        : "Pending"
                  }
                />
              </InvoiceGrid>
              {tracking.length > 0 && (
                <div style={{ marginTop: 14 }}>
                  <InvoiceChipRow label="Tracking No" items={tracking} />
                </div>
              )}
            </InvoiceSection>

            {(cartons.length > 0 || marks.length > 0) && (
              <InvoiceSection title={paired ? "Cartons & Shipping Marks" : "Cartons"}>
                {paired ? (
                  <InvoiceCartonTable cartons={cartons} marks={marks} />
                ) : (
                  <>
                    {cartons.length > 0 && <InvoiceChipRow label="Carton No" items={cartons} />}
                    {marks.length > 0 && <InvoiceChipRow label="Shipping Mark" items={marks} />}
                  </>
                )}
              </InvoiceSection>
            )}

            <InvoiceSection title="Charges">
              <InvoiceItemsTable
                items={[
                  {
                    name: `Shipping — ${sea ? "Sea" : "Air"} freight`,
                    meta:
                      weightRateCharge !== null
                        ? `${req.receivedWeight} kg × ৳${req.customerRate}/kg`
                        : "Billed on actual weight",
                    qty: req.receivedWeight ? `${req.receivedWeight} kg` : null,
                    unitPrice: req.customerRate ? Number(req.customerRate) : null,
                    amount: weightRateCharge,
                  },
                ]}
              />
              <InvoiceTotals>
                {weightRateCharge !== null && (
                  <InvoiceRow label="Shipping (weight × rate)" value={tk(weightRateCharge)} />
                )}
                {otherCost > 0 && <InvoiceRow label="Repacking Charge" value={`+${tk(otherCost)}`} />}
                {discount > 0 && (
                  <InvoiceRow label="Discount" value={`-${tk(discount)}`} tone="green" />
                )}
                <InvoiceDivider />
                <InvoiceRow
                  bold
                  label="Total Bill"
                  value={totalBill > 0 ? tk(totalBill) : "Pending"}
                />
                {totalPaid > 0 && (
                  <InvoiceRow label="Paid" value={`-${tk(totalPaid)}`} tone="green" />
                )}
                {refund > 0 && (
                  <InvoiceRow label="Refunded" value={tk(refund)} hint="(returned to customer)" />
                )}
                <InvoiceDueRow due={totalBill > 0 ? totalDue : null} />
              </InvoiceTotals>
            </InvoiceSection>

            <InvoicePayments payments={req.payments} />
            <InvoiceNotes terms={INVOICE_TERMS} />
          </>
        )}
      </InvoiceShell>
    );
  }
}

const mapStateToProps = (state) => {
  return {
    orderObj: state.productRequests.shipForMeObj,
  };
};

export default withRouter(
  connect(mapStateToProps, {
    getSingleShipForMeRedux,
  })(OnlyInvoieToPrint),
);
