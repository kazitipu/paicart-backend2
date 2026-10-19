import React, { Component } from "react";
import {
  getSingleOrderApiRedux,
  getSingleProductRequestRedux,
} from "../../actions/index";
import { connect } from "react-redux";
import "./invoice-by-order.css";
import PaicartLogo from "../common/paicart_logo.png";
import { withRouter } from "react-router-dom";
import { getSingleUser } from "../../firebase/firebase.utils";
import {
  getTotalPaid,
  getTotalDue,
  getGoodsTotal,
  getSingleShopTotal,
} from "../../constants/orderMath";
import { getOfferDiscount } from "../../constants/offerMath";
import InvoiceShell, {
  InvoiceSummary,
  InvoiceParties,
  InvoiceSection,
  InvoiceItemsTable,
  InvoiceTotals,
  InvoiceRow,
  InvoiceDivider,
  InvoiceDueRow,
  InvoicePayments,
  InvoiceNotes,
  InvoiceChipRow,
  InvoiceCartonTable,
  INVOICE_TERMS,
  invoiceStatusOf,
  billToFromAddress,
  billToFromUser,
  toInvoiceList,
  tk,
} from "../common/invoiceShell.jsx";
import { statusDisplay } from "../../constants/statusDisplay";

/* Same document as the customer's invoice (paicart-nextjs15
   src/app/pages/dashboard/buy-and-ship-for/invoice), plus the warehouse
   references only the admin copy needs: cartons and shipping marks. */

const fmtDate = (ms) =>
  ms
    ? new Date(ms).toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      })
    : "";

/* "0" is the placeholder written before a real tracking number exists */
const formatTrackingNo = (value) =>
  toInvoiceList(value)
    .filter((t) => t !== "0")
    .join(", ");

/* Carton numbers are relabelled CB -> AR on the admin copy */
const toCartonList = (value) =>
  toInvoiceList(value).map((carton) => carton.replace("CB", "AR"));

const CartonsSection = ({ record }) => {
  const cartons = toCartonList(record.ctnNo);
  const marks = toInvoiceList(record.shippingMark);
  if (cartons.length === 0 && marks.length === 0) return null;
  const paired = cartons.length > 0 && cartons.length === marks.length;
  return (
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
  );
};

/* 1688 order — one line per SKU */
const OrderInvoiceBody = ({ order, address }) => {
  const totalPaid = getTotalPaid(order);
  const totalDue = getTotalDue(order);
  const goodsTotal = getGoodsTotal(order);
  const offer = getOfferDiscount(order);
  const hasShipping = parseInt(order.shippingChargeCustomer) > 0;
  const totalBill = totalDue + totalPaid;

  const items = [];
  (order.items || []).forEach((item) => {
    (item.skus || []).forEach((sku) => {
      const qty = parseInt(sku.totalQuantity || 0);
      const unitPrice = parseInt(parseFloat(sku.price || 0));
      items.push({
        name: item.name,
        meta: [sku.color, sku.size].filter(Boolean).join(" / "),
        qty,
        unitPrice,
        amount: qty * unitPrice,
      });
    });
  });
  const totalQty = items.reduce((a, l) => a + l.qty, 0);

  return (
    <>
      <InvoiceSummary total={totalBill} paid={totalPaid} due={totalDue} />
      <InvoiceParties
        billTo={billToFromAddress(address)}
        details={[
          { label: "Order ID", value: `#${order.orderId}` },
          { label: "Order Date", value: fmtDate(order.time) },
          { label: "Seller", value: order.shopName },
          { label: "Shipment", value: order.shipmentMethod || "Air" },
          { label: "Status", value: statusDisplay(order.orderStatus) },
          { label: "Tracking No", value: formatTrackingNo(order.trackingNo) },
        ]}
      />

      <CartonsSection record={order} />

      <InvoiceSection title={`Items (${totalQty} pcs)`}>
        <InvoiceItemsTable items={items} />
        <InvoiceTotals>
          <InvoiceRow label="Product Subtotal" value={tk(goodsTotal)} />
          <InvoiceRow
            label="China Local Delivery"
            value={parseInt(order.localShipping) > 0 ? tk(order.localShipping) : "—"}
          />
          <InvoiceRow
            label="Shipping (CN → BD)"
            value={hasShipping ? tk(order.shippingChargeCustomer) : "On actual weight"}
          />
          {parseInt(order.otherCost) > 0 && (
            <InvoiceRow label="Packaging & Other" value={`+${tk(order.otherCost)}`} />
          )}
          {parseInt(order.siteDiscountAmount) > 0 && (
            <InvoiceRow
              label={`Site Discount (${order.siteDiscountPercent}%)`}
              value={`-${tk(order.siteDiscountAmount)}`}
              tone="green"
            />
          )}
          {parseInt(order.couponAmount) > 0 && (
            <InvoiceRow label="Coupon" value={`-${tk(order.couponAmount)}`} tone="green" />
          )}
          {parseInt(order.discount) > 0 && (
            <InvoiceRow
              label="Discount (on shipping)"
              value={`-${tk(order.discount)}`}
              tone="green"
            />
          )}
          {offer > 0 && (
            <InvoiceRow
              label={`Pay-now Discount${
                order.offerPayNowPercent ? ` (${parseFloat(order.offerPayNowPercent)}%)` : ""
              }`}
              value={`-${tk(offer)}`}
              tone="green"
            />
          )}
          <InvoiceDivider />
          <InvoiceRow bold label="Total Bill" value={tk(totalBill)} />
          {totalPaid > 0 && <InvoiceRow label="Paid" value={`-${tk(totalPaid)}`} tone="green" />}
          {parseFloat(order.refund) > 0 && (
            <InvoiceRow label="Refunded" value={tk(order.refund)} hint="(returned to customer)" />
          )}
          <InvoiceDueRow due={totalDue} />
        </InvoiceTotals>
      </InvoiceSection>

      <InvoicePayments payments={order.payments} />
      <InvoiceNotes
        notes={[order.additionalNotes && `Note: ${order.additionalNotes}`]}
        terms={INVOICE_TERMS}
      />
    </>
  );
};

/* Product request — one quoted line */
const ProductRequestInvoiceBody = ({ booking, user }) => {
  const totalPaid = getTotalPaid(booking);
  const totalDue = getTotalDue(booking);
  const offer = getOfferDiscount(booking);
  const hasShipping = parseInt(booking.shippingChargeCustomer) > 0;
  const base = booking.actualTotal
    ? parseInt(booking.actualTotal)
    : getSingleShopTotal(booking);
  const grandTotal = totalDue + totalPaid;
  const qty = parseInt(booking.productQuantity) || null;

  return (
    <>
      <InvoiceSummary total={grandTotal} paid={totalPaid} due={totalDue} />
      <InvoiceParties
        billTo={billToFromUser(user)}
        details={[
          { label: "Request ID", value: `#${booking.bookingId}` },
          { label: "Request Date", value: booking.date || fmtDate(booking.time) },
          {
            label: "Store",
            value: [booking.store, booking.country].filter(Boolean).join(" · "),
          },
          {
            label: "Shipment",
            value: (booking.shipmentMethod || "Air") === "Sea" ? "By Sea" : "By Air",
          },
          { label: "Status", value: statusDisplay(booking.orderStatus || booking.status) },
          { label: "Tracking No", value: formatTrackingNo(booking.trackingNo) },
        ]}
      />

      <CartonsSection record={booking} />

      <InvoiceSection title="Items">
        <InvoiceItemsTable
          items={[
            {
              name: booking.productType || "Requested product",
              meta: booking.productVariant,
              qty,
              unitPrice: qty && base ? Math.round(base / qty) : null,
              amount: base || null,
            },
          ]}
        />
        <InvoiceTotals>
          <InvoiceRow label="Product Price" value={base > 0 ? tk(base) : "—"} />
          <InvoiceRow
            label="China Local Courier"
            value={parseInt(booking.localShipping) > 0 ? tk(booking.localShipping) : "—"}
          />
          <InvoiceRow
            label="Shipping (CN → BD)"
            hint={
              hasShipping && booking.receivedWeight && booking.customerRate
                ? `(${booking.receivedWeight} kg × ৳${booking.customerRate})`
                : ""
            }
            value={hasShipping ? tk(booking.shippingChargeCustomer) : "On actual weight"}
          />
          {parseInt(booking.otherCost) > 0 && (
            <InvoiceRow label="Packaging & Other" value={`+${tk(booking.otherCost)}`} />
          )}
          {parseInt(booking.discount) > 0 && (
            <InvoiceRow label="Discount" value={`-${tk(booking.discount)}`} tone="green" />
          )}
          {offer > 0 && (
            <InvoiceRow label="Pay-now Discount" value={`-${tk(offer)}`} tone="green" />
          )}
          <InvoiceDivider />
          <InvoiceRow bold label="Total Bill" value={tk(grandTotal)} />
          {totalPaid > 0 && <InvoiceRow label="Paid" value={`-${tk(totalPaid)}`} tone="green" />}
          {parseFloat(booking.refund) > 0 && (
            <InvoiceRow label="Refunded" value={tk(booking.refund)} hint="(returned to customer)" />
          )}
          <InvoiceDueRow due={totalDue} />
        </InvoiceTotals>
      </InvoiceSection>

      <InvoicePayments payments={booking.payments} />
      <InvoiceNotes notes={[booking.note && `Note: ${booking.note}`]} terms={INVOICE_TERMS} />
    </>
  );
};

export class OnlyInvoieToPrint extends Component {
  state = {
    user: null,
    productRequest: null,
    loading: true,
  };

  componentDidMount = async () => {
    const query = new URLSearchParams(this.props.location.search);
    const productRequest = query.get("productRequest");
    if (productRequest) {
      await this.props.getSingleProductRequestRedux(this.props.match.params.bookingId);
    } else {
      await this.props.getSingleOrderApiRedux(this.props.match.params.bookingId);
    }
    this.setState({ productRequest, loading: false });
  };

  componentWillReceiveProps = async (nextProps) => {
    const record = this.state.productRequest
      ? nextProps.productRequestObj
      : nextProps.orderObj;
    if (record && record.userId && !this.state.user) {
      const user = await getSingleUser(record.userId);
      this.setState({ user });
    }
  };

  /* The order's own delivery address is authoritative; fall back to the
     customer's default shipping address for older records that carry none. */
  getAddress = (record) => {
    if (record && record.deliveryAddress) return record.deliveryAddress;
    const { user } = this.state;
    if (user && user.addressBook && user.addressBook.length > 0) {
      return (
        user.addressBook.find((address) => address.defaultShipping) ||
        user.addressBook[0]
      );
    }
    return null;
  };

  render() {
    const { orderObj, productRequestObj } = this.props;
    const { productRequest, loading, user } = this.state;
    const record = productRequest ? productRequestObj : orderObj;
    const settled = record ? getTotalDue(record) <= 0 && getTotalPaid(record) > 0 : false;

    return (
      <InvoiceShell
        logo={PaicartLogo}
        docType={productRequest ? "Product Request Invoice" : "Order Invoice"}
        docId={this.props.match.params.bookingId}
        docDate={fmtDate(record && record.time)}
        status={record ? invoiceStatusOf(record) : null}
        paid={settled}
        loading={loading}
        notFound={!record}
      >
        {record &&
          (productRequest ? (
            <ProductRequestInvoiceBody booking={record} user={user} />
          ) : (
            <OrderInvoiceBody order={record} address={this.getAddress(record)} />
          ))}
      </InvoiceShell>
    );
  }
}

const mapStateToProps = (state) => {
  return {
    orderObj: state.orders.orderObj,
    productRequestObj: state.productRequests
      ? state.productRequests.productRequestObj
      : null,
    admin: state.admins.currentAdmin,
    currency: state.users.currency,
  };
};

export default withRouter(
  connect(mapStateToProps, {
    getSingleOrderApiRedux,
    getSingleProductRequestRedux,
  })(OnlyInvoieToPrint),
);
