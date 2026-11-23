import React, { useState } from "react";
import { useSelector } from "react-redux";
import { toast } from "react-toastify";
import PaymentModal, { PmBadge, orderStatusTone, paymentStateTone } from "../paymentModal.jsx";
import ShipUpdateModal from "../../shipment-request/updateRequestModal";
import OrderUpdateModal from "../../1688-taobao-orders/updateRequestModal";
import RequestUpdateModal from "../../product-requests/updateRequestModal";
import { PAYMENT_METHODS } from "../../../constants/bulkActions";
import { getDisplayPaymentState, getOrderPayable, getShipmentPayable, getOrderPaid } from "../../../constants/paymentMath";
import { getOfferDiscount } from "../../../constants/offerMath";
import { getShipmentMode } from "../../../constants/shipment";
import { statusDisplay } from "../../../constants/statusDisplay";
import { updateParcelRecordFields, uploadCashIn } from "../../../firebase/firebase.utils";

/* "Payment" and "Update …" on a details page — the same two dialogs the
 * Ship For Me / website order / product request lists open, so a record can
 * be edited and paid without going back to the list.
 *   - Update: the kind's own UpdateRequestModal (same save path as the list).
 *   - Payment: the shared PaymentModal with the list's breakdown, methods and
 *     save rule (a payment line + status; website orders also log a pending
 *     cash-in, as the list does).
 * onChanged() reloads the details page afterwards. */

const SHIPMENT_PAYMENT_METHODS = [
  { value: "Bkash", label: "Bkash" },
  { value: "Nagad", label: "Nagad" },
  { value: "Rocket", label: "Rocket" },
  { value: "City Bank", label: "City Bank" },
  { value: "Brack Bank", label: "Brack Bank" },
  { value: "Loan", label: "Loan" },
];
const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const UPDATE_LABEL = { ship: "Update booking", order: "Update order", request: "Update request" };

const DetailActions = ({ kind, record, onChanged }) => {
  const admin = useSelector((s) => s.admins && s.admins.currentAdmin);
  const [updating, setUpdating] = useState(null);
  const [form, setForm] = useState({ method: "", amount: "", paymentStatus: "" });
  if (!record) return null;

  const isShip = kind === "ship";
  const id = kind === "order" ? record.orderId : record.bookingId;
  const payable = isShip ? getShipmentPayable(record) : getOrderPayable(record);
  const paid = getOrderPaid(record);
  const stateLabel = getDisplayPaymentState(record, isShip ? getShipmentPayable : getOrderPayable);
  const status = isShip ? record.status : record.orderStatus;
  const who = (admin && admin.name) || "Paicart";

  const openPayment = () => {
    setForm({ method: "", amount: "", paymentStatus: "" });
    if (window.$) window.$("#paymentModal").modal("show");
  };
  const closePayment = () => {
    const btn = document.getElementById("close-button-for-payment-modal");
    if (btn) btn.click();
    else if (window.$) window.$("#paymentModal").modal("hide");
  };

  const submitPayment = async (e) => {
    e.preventDefault();
    const amount = parseInt(form.amount, 10) || 0;
    if (!form.method) return alert("Choose a payment method.");
    if (amount <= 0) return alert("Paid amount must be more than 0.");
    if (kind === "request" && amount > payable - paid) return alert("Paid amount can't be more than the due amount.");
    const line = isShip
      ? { amount: form.amount, method: form.method, paidBy: who, approvedBy: who, date: new Date().toLocaleDateString("en-GB") }
      : { amount: form.amount, method: form.method, receivedBy: who, date: new Date().toLocaleDateString("en-GB") };
    try {
      await updateParcelRecordFields(kind, id, {
        paymentStatus: form.paymentStatus || (isShip ? "Not Paid" : record.paymentStatus || (kind === "order" ? "purchaseLater" : "")),
        payments: [...(record.payments || []), line],
      });
      if (kind === "order") {
        const date = new Date();
        await uploadCashIn({
          id: date.getTime().toString(),
          category: "1688 Order",
          subCategory: form.method,
          month: MONTHS[date.getMonth()],
          date: date.toLocaleDateString("en-GB"),
          note: `Order Id: ${record.orderId}   User: ${record.displayName || "Guest"}`,
          amount: form.amount,
          receiveBy: who,
          status: "pending",
          unEditable: true,
        });
      }
      toast.success("successfully updated the payment");
      closePayment();
      onChanged();
    } catch (err) {
      alert(err);
    }
  };

  const withoutShipping = payable - (parseInt(record.shippingChargeCustomer, 10) || 0);
  const breakdown = isShip
    ? [
        { section: "Booking (estimate)" },
        { label: "Est. weight (customer)", text: `${record.weight || 0} kg` },
        { label: "Booking rate", text: record.result ? `৳${record.result.perKg}/kg` : "N/A" },
        {
          label: "Booking total shipping",
          text:
            record.result && Number.isFinite(parseFloat(record.result.result))
              ? `৳${Math.round(parseFloat(record.result.result)).toLocaleString("en-IN")}`
              : "—",
          strong: true,
        },
        { section: "Actual" },
        { label: "Received weight", text: `${record.receivedWeight || 0} kg` },
        { label: "Actual rate", text: `৳${record.customerRate || 0}/kg` },
        { label: "Actual total shipping", value: record.shippingChargeCustomer, strong: true },
      ]
    : [
        { section: "Product" },
        { label: kind === "order" ? "Product price" : "Order actual total", value: record.actualTotal },
        { label: `Coupon${record.couponUsed ? ` (${record.couponUsed.name})` : ""}`, value: record.couponAmount, sign: "-" },
        { label: `Pay-now discount (${record.offer || 0}%)`, value: record.offer ? getOfferDiscount(record) : 0, sign: "-" },
        { label: kind === "order" ? "Price after discount" : "Order total cost", value: record.orderTotal, strong: true },
        { section: "Charges" },
        { label: "Local shipping (China)", value: record.localShipping, sign: "+" },
        { label: "Packaging & other cost", value: record.otherCost, sign: "+" },
        { label: kind === "order" ? "Discount (on shipment)" : "Discount", value: record.discount, sign: "-" },
        { label: "Payable without shipping", value: withoutShipping, strong: true },
        { section: "International shipping" },
        { label: "Total shipping charge", value: record.shippingChargeCustomer, sign: "+" },
      ];

  const UpdateModal = isShip ? ShipUpdateModal : kind === "order" ? OrderUpdateModal : RequestUpdateModal;
  const updateProps = isShip ? { singleRequest: updating } : { order: updating };

  return (
    <>
      <button type="button" className="pd-btn pd-btn-ghost" onClick={openPayment} title="Record a payment">
        <i className="fa fa-money" /> Payment
      </button>
      <button type="button" className="pd-btn pd-btn-primary" onClick={() => setUpdating(record)}>
        <i className="fa fa-pencil" /> {UPDATE_LABEL[kind]}
      </button>

      <UpdateModal
        toggleModal={!updating}
        startToggleModal={() => {
          setUpdating(null);
          onChanged();
        }}
        {...updateProps}
      />

      <PaymentModal
        idLabel={kind === "order" ? "Order Id" : "Booking Id"}
        idValue={id}
        badges={
          <>
            {isShip ? (
              <PmBadge tone={getShipmentMode(record) === "Sea" ? "teal" : "blue"}>{getShipmentMode(record) === "Sea" ? "Sea" : "Air"}</PmBadge>
            ) : kind === "request" ? (
              <PmBadge tone={record.shipmentMethod === "Sea" ? "teal" : "blue"}>{record.shipmentMethod === "Sea" ? "By Sea" : "By Air"}</PmBadge>
            ) : null}
            <PmBadge tone={paymentStateTone(stateLabel)}>{stateLabel}</PmBadge>
            <PmBadge tone={status === "Reject" ? "red" : orderStatusTone(status)}>{statusDisplay(status) || "Pending"}</PmBadge>
          </>
        }
        summary={{
          total: payable || 0,
          paid,
          totalHint: isShip ? (record.shippingChargeCustomer ? "actual shipping charge" : "booking estimate") : "including shipping",
        }}
        breakdown={breakdown}
        facts={
          isShip
            ? undefined
            : [
                { label: "Received weight", value: `${record.receivedWeight || 0} kg` },
                { label: "Customs & shipping rate", value: `৳${record.customerRate || 0}/kg` },
                { label: kind === "order" ? "Refunded" : "Refund amount", value: `৳${record.refund || 0}` },
              ]
        }
        methods={isShip ? SHIPMENT_PAYMENT_METHODS : PAYMENT_METHODS}
        form={form}
        onChange={(e) => setForm({ ...form, [e.target.name]: e.target.value })}
        onSubmit={submitPayment}
        payments={record.payments}
        {...(isShip ? { historyPerson: (p) => p.approvedBy || p.receivedBy, historyPersonLabel: "Approved by" } : {})}
      />
    </>
  );
};

export default DetailActions;
