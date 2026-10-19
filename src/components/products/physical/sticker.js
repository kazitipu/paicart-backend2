import React, { useRef } from "react";
import ReactToPrint from "react-to-print";
import logo from "../../../assets/images/dashboard/14.png";
import Barcode from "react-barcode";
import "./sticker.css";
const StickerContent = React.forwardRef(({ order, weight, user }, ref) => {
  let deliveryAddress = null;
  if (order && order.deliveryAddress) {
    deliveryAddress = order.deliveryAddress;
  } else if (user && user.addressBook && user.addressBook.length > 0) {
    deliveryAddress = user.addressBook.find(
      (address) => address.defaultShipping
    );
  }

  let totalQuantity = 0;

  if (order) {
    order.items.map((item) => {
      item.skus.map((sku) => {
        totalQuantity += parseFloat(sku.totalQuantity);
      });
    });
  }
  return (
    <div className="sticker" ref={ref}>
      <div className="sticker-container">
        <div className="logo-container">
          <img style={{ height: 75, width: 150 }} src={logo} />
          <div className="corner-text">
            {order?.agentCarton == "Hongkong Mix" ? "HK" : "CN"}
          </div>
        </div>
        <div className="barcode-container">
          <Barcode
            value={order?.trackingNo || "Umbrella12"}
            format="CODE128"
            width={2}
            height={40}
            displayValue={false} // shows the text below
          />
        </div>

        <div className="section-container">
          <div className="section-container-1">Order Id:{order?.orderId}</div>
          <div>Date: {new Date().toLocaleDateString("en-GB")}</div>
          <div>Tracking No: {order?.trackingNo}</div>
        </div>
        <div className="section-container">
          <div className="section-container-1">Customer Information</div>
          <div>Name: {deliveryAddress && deliveryAddress.name}</div>
          <div>Mobile No: {deliveryAddress && deliveryAddress.mobileNo}</div>
          <div>
            Delivery Address:{deliveryAddress && deliveryAddress.address},
            {deliveryAddress && deliveryAddress.thana},
            {deliveryAddress && deliveryAddress.district},{" "}
            {deliveryAddress && deliveryAddress.division}
          </div>
        </div>
        <div className="section-container">
          <div className="section-container-1">Product Information</div>
          <div>Product Type: {order?.agentCarton}</div>
          <div>Product Quantity: {totalQuantity}pc </div>
          <div>Carton Weight: {weight}kg</div>
        </div>
      </div>
    </div>
  );
});

export default StickerContent;
