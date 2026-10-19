import React, { Component, Fragment } from "react";
import { withRouter } from "react-router-dom";
import { connect } from "react-redux";
import { getAllOrdersByTrackingNo } from "../../firebase/firebase.utils";
import man from "../products/physical/plus image.jpeg";
import { getOrderTrackingResultRedux } from "../../actions";
import FullPageLoader from "../products/physical/fullPageLoader";
import { joinList, withUnit } from "../../constants/displayList";
export class SearchedOrder extends Component {
  constructor(props) {
    super(props);
    this.state = {
      orders: [],
      imageUrl: man,
      loader: true,
    };
  }

  componentDidMount = async () => {
    let orders = await getAllOrdersByTrackingNo(
      this.props.match.params.orderId
    );
    await this.props.getOrderTrackingResultRedux(
      this.props.match.params.orderId
    );
    this.setState({
      orders,
      loader: false,
    });
  };

  UNSAFE_componentWillReceiveProps = async (nextProps) => {
    if (this.props.match.params.orderId != nextProps.match.params.orderId) {
      let orders = await getAllOrdersByTrackingNo(
        nextProps.match.params.orderId
      );
      await this.props.getOrderTrackingResultRedux(
        nextProps.match.params.orderId
      );
      this.setState({
        orders,
        loader: false,
      });
    }
  };

  timeout = (delay) => {
    return new Promise((res) => setTimeout(res, delay));
  };
  toWait = () => {
    this.timeout(1000);
  };

  getTotal = (productObj) => {
    const { currency } = this.props;
    let totalRmbAmount = 0;

    if (productObj) {
      productObj.items.map((item) => {
        item.skus.map((sku) => {
          totalRmbAmount += parseFloat(
            (sku.price * sku.totalQuantity) /
              (productObj.currency ? productObj.currency : currency.taka)
          );

          console.log(
            parseFloat(
              (sku.price * sku.totalQuantity) /
                (productObj.currency ? productObj.currency : currency.taka)
            )
          );
        });
      });
    }
    return totalRmbAmount;
  };

  render() {
    const { orderTracking, currency } = this.props;
    const { orders } = this.state;
    if (orders && orders.length > 0) {
      return (
        <div style={{ paddingTop: 30 }}>
          {this.state.loader && <FullPageLoader />}
          {orders.map((productObj) => {
            return (
              <div
                style={{
                  background: "white",
                  marginBottom: 40,
                  border: "2px solid gainsboro",
                  borderRadius: 10,
                }}
              >
                <div
                  className="modal-header"
                  style={{
                    backgroundColor: "rgb(0, 37, 76)",
                    paddingTop: 20,
                    paddingBottom: 20,
                  }}
                >
                  <div
                    className="modal-title"
                    style={{
                      fontWeight: "bold",
                      fontSize: 17,
                      color: "white",
                    }}
                    id="exampleModalLabel"
                  >
                    Order Id: {productObj && productObj.orderId}
                  </div>
                </div>

                <div className="modal-body">
                  <div style={{ padding: "0px 15px" }}></div>

                  {productObj && productObj.warehouse && (
                    <div style={{ fontSize: 11 }}>
                      Warehouse Address:{" "}
                      <span style={{ color: "gray", fontSize: 11 }}>
                        {productObj && productObj.warehouse}
                      </span>
                    </div>
                  )}

                  {productObj &&
                    productObj.items.length > 0 &&
                    productObj.items.map((item) => (
                      <div>
                        {" "}
                        <div style={{ fontWeight: "bold" }}>{item.name}</div>
                        <div>
                          Product Link:{" "}
                          <a href={item.detail_url} target="_blank">
                            <span style={{ color: "#ff8084" }}>
                              {item.detail_url}
                            </span>
                          </a>
                        </div>
                        {productObj && productObj.additionalNotes && (
                          <div style={{ fontWeight: "bold" }}>
                            Additioinal notes:{" "}
                            <span
                              style={{ color: "red", fontWeight: "lighter" }}
                            >
                              {productObj.additionalNotes}
                            </span>
                          </div>
                        )}
                        <table className="table table-bordered table-striped table-hover">
                          <tbody>
                            {item.skus.map((sku) => (
                              <tr>
                                <td>
                                  <img
                                    style={{
                                      height: 70,
                                      width: 70,
                                      border: "1px solid gainsboro",
                                      borderRadius: 5,
                                    }}
                                    src={
                                      sku.image
                                        ? sku.image
                                        : item.picture
                                        ? item.picture
                                        : man
                                    }
                                  />
                                </td>
                                <td>
                                  {item.propertyNames &&
                                    item.propertyNames.length > 0 && (
                                      <div>
                                        {item.propertyNames[0]}: {sku.color}
                                        , <br />
                                        {sku.size &&
                                          `${item.propertyNames[1]}: ${sku.size}`}
                                      </div>
                                    )}
                                  Shipping Rate: {item.shippingRate} tk/kg
                                </td>
                                <td>{item.productType}</td>
                                <td>
                                  {parseFloat(
                                    sku.price /
                                      (productObj.currency
                                        ? productObj.currency
                                        : currency.taka)
                                  ).toFixed(2)}
                                  rmb
                                </td>
                                <td>{sku.totalQuantity}pcs </td>

                                <td>
                                  {parseFloat(
                                    (sku.price * sku.totalQuantity) /
                                      (productObj.currency
                                        ? productObj.currency
                                        : currency.taka)
                                  ).toFixed(2)}
                                  rmb
                                </td>
                              </tr>
                            ))}{" "}
                          </tbody>
                        </table>
                      </div>
                    ))}

                  <div className="row">
                    <div className="col">
                      <div
                        className="row"
                        style={{
                          fontWeight: "bold",

                          paddingLeft: 20,
                          justifyContent: "flex-start",
                        }}
                      >
                        Total Rmb:
                        {parseFloat(this.getTotal(productObj)).toFixed(2)} Rmb
                      </div>
                      <div
                        className="row"
                        style={{
                          fontWeight: "bold",
                          paddingLeft: 20,
                          justifyContent: "flex-start",
                        }}
                      >
                        Agent Name:{" "}
                        {productObj &&
                          this.props.employees.find(
                            (employee) => employee.adminId == productObj.agentId
                          )?.name}
                      </div>
                      <div
                        className="row"
                        style={{
                          fontWeight: "bold",
                          paddingLeft: 20,
                          justifyContent: "flex-start",
                        }}
                      >
                        Picked Date:{" "}
                        {productObj &&
                          `${
                            productObj.pickedDate
                              ? `${productObj.pickedDate} at`
                              : ""
                          }`}
                        {productObj && productObj.pickedTime}
                      </div>
                      <div
                        className="row"
                        style={{
                          marginBottom: 20,
                          justifyContent: "flex-start",
                          paddingLeft: 20,
                        }}
                      >
                        <div>
                          <div style={{ fontWeight: "bold" }}>
                            BD warehouse image:{" "}
                          </div>
                          <div>
                            <a
                              href={
                                productObj && productObj.imageUrlBd
                                  ? productObj.imageUrlBd
                                  : ""
                              }
                              target="_blank"
                              onClick={(e) => {
                                if (!productObj?.imageUrlBd) {
                                  e.preventDefault(); // 🚫 Stop navigation
                                }
                              }}
                            >
                              <img
                                style={{
                                  height: 100,
                                  width: 100,
                                  border: "1px solid gainsboro",
                                  borderRadius: 5,
                                  marginTop: 5,
                                }}
                                src={
                                  productObj && productObj.imageUrlBd
                                    ? productObj.imageUrlBd
                                    : man
                                }
                              />
                            </a>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="col" style={{ marginBottom: 20 }}>
                      <div style={{ fontWeight: "bold" }}>
                        CN warehouse image:{" "}
                      </div>
                      <div>
                        <a
                          href={
                            productObj && productObj.imageUrl
                              ? productObj.imageUrl
                              : ""
                          }
                          target="_blank"
                          onClick={(e) => {
                            if (!productObj?.imageUrl) {
                              e.preventDefault(); // 🚫 Stop navigation
                            }
                          }}
                        >
                          <img
                            style={{
                              height: 100,
                              width: 100,
                              border: "1px solid gainsboro",
                              borderRadius: 5,
                              marginTop: 5,
                            }}
                            src={
                              productObj && productObj.imageUrl
                                ? productObj.imageUrl
                                : man
                            }
                          />
                        </a>
                      </div>
                    </div>
                  </div>
                  <div
                    className="row"
                    style={{
                      marginBottom: 10,
                      borderBottom: "1px solid gainsboro",
                    }}
                  >
                    <div className="col">
                      <div
                        style={{
                          color: "#18768f",
                          fontWeight: "bold",
                          marginBottom: 5,
                        }}
                      >
                        Purchasing Information
                      </div>

                      <div className="category-list-shipping">
                        Purchase Link:{" "}
                        <span
                          style={{
                            fontWeight: "lighter",
                            textTransform: "capitalize",
                          }}
                        >
                          {productObj && productObj.purchaseLink}
                        </span>
                      </div>
                      <div className="category-list-shipping">
                        Purchasing supplier:{" "}
                        <span
                          style={{
                            fontWeight: "lighter",
                            textTransform: "capitalize",
                          }}
                        >
                          {productObj && productObj.purchasingSupplier}
                        </span>
                      </div>
                      <div className="category-list-shipping">
                        Purchasing supplier (Payment method):{" "}
                        <span
                          style={{
                            fontWeight: "lighter",
                            textTransform: "capitalize",
                          }}
                        >
                          {productObj && productObj.purchasingSupplierPayment}
                        </span>
                      </div>
                      <div className="category-list-shipping">
                        Purchasing supplier (QR code):{" "}
                        <span
                          style={{
                            fontWeight: "lighter",
                            textTransform: "capitalize",
                          }}
                        >
                          {productObj && productObj.purchasingSupplierQr}
                        </span>
                      </div>
                      <div className="category-list-shipping">
                        Purchasing RMB:{" "}
                        <span
                          style={{
                            fontWeight: "lighter",
                            textTransform: "capitalize",
                          }}
                        >
                          {productObj && productObj.purchasingRmb
                            ? productObj.purchasingRmb
                            : 0}{" "}
                          rmb
                        </span>
                      </div>
                      <div className="category-list-shipping">
                        Exchange Rate:{" "}
                        <span
                          style={{
                            fontWeight: "lighter",
                            textTransform: "capitalize",
                          }}
                        >
                          {productObj && productObj.exchangeRate
                            ? productObj.exchangeRate
                            : 0}
                          Tk
                        </span>
                      </div>
                      <div className="category-list-shipping">
                        Total Buying Cost:{" "}
                        <span
                          style={{
                            fontWeight: "lighter",
                            textTransform: "capitalize",
                          }}
                        >
                          {productObj &&
                          productObj.exchangeRate &&
                          productObj.purchasingRmb
                            ? parseInt(
                                productObj.exchangeRate *
                                  productObj.purchasingRmb
                              )
                            : 0}
                          Tk
                        </span>
                      </div>

                      <div
                        className="category-list-shipping"
                        style={{ marginTop: 20 }}
                      >
                        Coupon Used:{" "}
                        <span
                          style={{
                            fontWeight: "lighter",
                            textTransform: "capitalize",
                          }}
                        >
                          {productObj && productObj.couponUsed
                            ? productObj.couponUsed.name
                            : "none"}
                        </span>
                      </div>

                      <div className="category-list-shipping">
                        Product Price:{" "}
                        <span
                          style={{
                            fontWeight: "bold",
                            textTransform: "capitalize",
                          }}
                        >
                          {productObj && parseInt(productObj.actualTotal)}
                          Tk
                        </span>
                      </div>
                    </div>
                    <div className="col">
                      <div
                        style={{
                          color: "#18768f",
                          fontWeight: "bold",
                          marginBottom: 5,
                        }}
                      >
                        Shipping Timeline
                      </div>
                      <div className="category-list-shipping">
                        Ordered:{" "}
                        <span style={{ fontWeight: "lighter" }}>
                          {productObj && productObj.orderedDate}
                        </span>
                      </div>
                      <div className="category-list-shipping">
                        Purchased:{" "}
                        <span style={{ fontWeight: "lighter" }}>
                          {productObj && productObj["PurchasedDate"]}
                        </span>
                      </div>

                      <div className="category-list-shipping">
                        Abroad Warehouse:{" "}
                        <span style={{ fontWeight: "lighter" }}>
                          {productObj &&
                            productObj["Received in WarehouseDate"]}
                        </span>
                      </div>
                      <div className="category-list-shipping">
                        Ready for fly:{" "}
                        <span style={{ fontWeight: "lighter" }}>
                          {productObj && productObj["Ready for flyDate"]}
                        </span>
                      </div>
                      <div className="category-list-shipping">
                        Bangladesh customs:{" "}
                        <span style={{ fontWeight: "lighter" }}>
                          {productObj
                            ? productObj["Bangladesh customsDate"]
                              ? productObj["Bangladesh customsDate"]
                              : productObj["Bangladesh warehouseDate"]
                              ? productObj["Bangladesh warehouseDate"]
                              : ""
                            : ""}
                        </span>
                      </div>
                      <div className="category-list-shipping">
                        Custom released:{" "}
                        <span style={{ fontWeight: "lighter" }}>
                          {productObj && productObj["Bangladesh warehouseDate"]}
                        </span>
                      </div>

                      <div className="category-list-shipping">
                        Paicart Warehouse:{" "}
                        <span style={{ fontWeight: "lighter" }}>
                          {productObj && productObj["Paicart warehouseDate"]}
                        </span>
                      </div>
                      <div
                        className="category-list-shipping"
                        style={{ marginBottom: 20 }}
                      >
                        Delivered:{" "}
                        <span style={{ fontWeight: "lighter" }}>
                          {productObj && productObj["DeliveredDate"]}
                        </span>
                      </div>

                      <div
                        className="category-list-shipping"
                        style={{ fontSize: 11 }}
                      >
                        Abroad Warehouse Address:{" "}
                        <span style={{ fontWeight: "lighter" }}>
                          {productObj && productObj.abroadWarehouseAddress}
                        </span>
                      </div>
                      <div
                        className="category-list-shipping"
                        style={{ fontSize: 11 }}
                      >
                        Bangladesh Warehouse Address:{" "}
                        <span style={{ fontWeight: "lighter" }}>
                          {productObj && productObj.bangladeshWarehouseAddress}
                        </span>
                      </div>
                      <div
                        className="category-list-shipping"
                        style={{ fontSize: 11 }}
                      >
                        Delivered through:{" "}
                        <span style={{ fontWeight: "lighter" }}>
                          {productObj && productObj.deliveredBy}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="row">
                    <div className="col">
                      <div
                        style={{
                          color: "#18768f",
                          fontWeight: "bold",
                          marginBottom: 5,
                        }}
                      >
                        Shipping Information
                      </div>
                      <div className="category-list-shipping">
                        Carton:{" "}
                        <span style={{ fontWeight: "lighter" }}>
                          {productObj && productObj.agentCarton}
                        </span>
                      </div>
                      <div className="category-list-shipping">
                        Customer Name:{" "}
                        <span style={{ fontWeight: "lighter" }}>
                          {productObj && productObj.displayName}
                        </span>
                      </div>
                      <div className="category-list-shipping">
                        Shipping mark:{" "}
                        <span style={{ fontWeight: "lighter" }}>
                          {productObj &&
                            productObj.shippingMark &&
                            `${productObj.shippingMark}`}
                        </span>
                      </div>
                      <div className="category-list-shipping">
                        Tracking No:{" "}
                        <span style={{ fontWeight: "lighter" }}>
                          {productObj && productObj.trackingNo}
                        </span>
                      </div>
                      <div className="category-list-shipping">
                        Cargo company:{" "}
                        <span style={{ fontWeight: "lighter" }}>
                          {productObj && productObj.cargoCompany}
                        </span>
                      </div>
                      <div className="category-list-shipping">
                        Lot Number:{" "}
                        <span style={{ fontWeight: "lighter" }}>
                          {productObj &&
                            productObj.lotNo &&
                            `${productObj.lotNo}`}
                        </span>
                      </div>
                      <div className="category-list-shipping">
                        Carton number:{" "}
                        <span style={{ fontWeight: "lighter" }}>
                          {productObj &&
                            productObj.ctnNo &&
                            `${productObj.ctnNo}`}
                        </span>
                      </div>
                      <div className="category-list-shipping">
                        Received weight:{" "}
                        <span style={{ fontWeight: "lighter" }}>
                          {productObj &&
                            productObj.receivedWeight &&
                            `${productObj.receivedWeight}kg`}
                        </span>
                      </div>
                      <div className="category-list-shipping">
                        Cargo rate:{" "}
                        <span style={{ fontWeight: "lighter" }}>
                          {productObj &&
                            productObj.cargoRate &&
                            withUnit(productObj.cargoRate, "Tk/Kg")}
                        </span>
                      </div>
                      <div className="category-list-shipping">
                        Customs & Shipping rate:{" "}
                        <span style={{ fontWeight: "lighter" }}>
                          {productObj && parseFloat(productObj.customerRate) > 0
                            ? `${productObj.customerRate} Tk/Kg`
                            : "—"}
                        </span>
                      </div>

                      <div className="category-list-shipping">
                        Total shipping charge (cargo company):{" "}
                        <span style={{ fontWeight: "lighter" }}>
                          {productObj &&
                            productObj.shippingChargeCargo &&
                            withUnit(productObj.shippingChargeCargo, "Tk")}
                        </span>
                      </div>
                      <div className="category-list-shipping">
                        Total shipping charge (customer):{" "}
                        <span style={{ fontWeight: "bold" }}>
                          {productObj &&
                            productObj.shippingChargeCustomer &&
                            `${productObj.shippingChargeCustomer}Tk`}
                        </span>
                      </div>

                      <div className="category-list-shipping">
                        Refund note:{" "}
                        <span style={{ fontWeight: "lighter" }}>
                          {productObj && productObj.refundNote}
                        </span>
                      </div>
                    </div>
                    <div className="col">
                      <div
                        style={{
                          color: "#18768f",
                          fontWeight: "bold",
                          marginBottom: 5,
                        }}
                      >
                        Parcel Info (caro company)
                      </div>
                      {orderTracking ? (
                        <>
                          <div className="category-list-shipping">
                            Cargo company:{" "}
                            <span style={{ fontWeight: "lighter" }}>
                              ALG LIMITED
                            </span>
                          </div>
                          <div className="category-list-shipping">
                            Customer:{" "}
                            <span style={{ fontWeight: "lighter" }}>
                              {orderTracking.userObj.userId}-
                              {orderTracking.userObj.displayName}
                            </span>
                          </div>

                          <div className="category-list-shipping">
                            Lot No:{" "}
                            <span style={{ fontWeight: "lighter" }}>
                              {joinList(orderTracking.lotArray)}
                            </span>
                          </div>
                          <div className="category-list-shipping">
                            Lot status:{" "}
                            <span style={{ fontWeight: "lighter" }}>
                              {orderTracking.lotObj.shipmentStatus}
                            </span>
                          </div>
                          <div className="category-list-shipping">
                            Parcel status:{" "}
                            <span style={{ fontWeight: "lighter" }}>
                              {orderTracking.parcelsArray[0].parcelStatus ||
                                orderTracking.lotObj.shipmentStatus}
                            </span>
                          </div>
                          <div className="category-list-shipping">
                            Carton No:{" "}
                            <span style={{ fontWeight: "lighter" }}>
                              {joinList(orderTracking.parcelsArray.map((parcel) => parcel.parcelId))}
                            </span>
                          </div>
                          <div className="category-list-shipping">
                            Received Date:{" "}
                            <span style={{ fontWeight: "lighter" }}>
                              {joinList(orderTracking.parcelsArray.map((parcel) => parcel.dateofWarehouseReceive))}
                            </span>
                          </div>
                          <div className="category-list-shipping">
                            Shipping Mark:{" "}
                            <span style={{ fontWeight: "lighter" }}>
                              {joinList(orderTracking.parcelsArray.map((parcel) => parcel.shippingMark))}
                            </span>
                          </div>
                          <div className="category-list-shipping">
                            Product Name:{" "}
                            <span style={{ fontWeight: "lighter" }}>
                              {joinList(orderTracking.parcelsArray.map((parcel) => parcel.productName))}
                            </span>
                          </div>
                          <div className="category-list-shipping">
                            Product Contains:{" "}
                            <span style={{ fontWeight: "lighter" }}>
                              {joinList(orderTracking.parcelsArray.map((parcel) => parcel.productType))}
                            </span>
                          </div>
                          <div className="category-list-shipping">
                            Total CBM:{" "}
                            <span style={{ fontWeight: "lighter" }}>
                              {joinList(orderTracking.parcelsArray.map((parcel) => parcel.totalCbm))}
                            </span>
                          </div>
                          <div className="category-list-shipping">
                            Total weight:{" "}
                            <span style={{ fontWeight: "lighter" }}>
                              {joinList(orderTracking.parcelsArray.map((parcel) => parcel.grossWeight), " kg")}
                            </span>
                          </div>
                          <div className="category-list-shipping">
                            Rate/kg:{" "}
                            <span style={{ fontWeight: "lighter" }}>
                              {joinList(orderTracking.parcelsArray.map((parcel) => {
                                if (parcel.ratePerKg) {
                                  return `${parcel.ratePerKg} tk/kg`;
                                } else {
                                  return "Not given yet";
                                }
                              }))}
                            </span>
                          </div>
                          <div className="category-list-shipping">
                            Other charge:{" "}
                            <span style={{ fontWeight: "lighter" }}>
                              {joinList(orderTracking.parcelsArray.map((parcel) => {
                                if (parcel.otherCharges) {
                                  return `${parcel.otherCharges} Tk`;
                                } else {
                                  return "Not given yet";
                                }
                              }))}
                            </span>
                          </div>
                          <div className="category-list-shipping">
                            Packaging cost:{" "}
                            <span style={{ fontWeight: "lighter" }}>
                              {joinList(orderTracking.parcelsArray.map((parcel) => {
                                if (parcel.packagingCost) {
                                  return `${parcel.packagingCost} Tk`;
                                } else {
                                  return "Not given yet";
                                }
                              }))}
                            </span>
                          </div>
                          <div className="category-list-shipping">
                            Final Total:{" "}
                            <span style={{ fontWeight: "lighter" }}>
                              {joinList(orderTracking.parcelsArray.map((parcel) => {
                                if (parcel.finalTotal) {
                                  return `${parcel.finalTotal} Tk`;
                                } else {
                                  return "Not given yet";
                                }
                              }))}
                            </span>
                          </div>
                        </>
                      ) : (
                        <div style={{ marginLeft: 8, color: "gray" }}>
                          No shipping data available.{" "}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      );
    } else {
      this.toWait();
      return (
        <div className="col-sm-12" style={{ marginTop: "10rem" }}>
          {this.state.loader && <FullPageLoader />}
          <div className="card">
            <div className="card-header">
              {!this.state.loader && (
                <h5>দুঃখিত এই অর্ডারটি খুজে পাওয়া যাচ্ছে না।</h5>
              )}
            </div>
          </div>
        </div>
      );
    }
  }
}

const mapStateToProps = (state, ownProps) => {
  return {
    orderTracking: state.orders.orderTracking,
    currency: state.users.currency,
    employees: state.employees.employees,
  };
};
export default withRouter(
  connect(mapStateToProps, { getOrderTrackingResultRedux })(SearchedOrder)
);
