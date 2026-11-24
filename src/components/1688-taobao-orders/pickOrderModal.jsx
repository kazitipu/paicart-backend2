import React, { Component } from "react";
import FraudCheckPanel from "./fraudCheckPanel.jsx";
import "./pickOrderModal.css";

/* "Pick order" — create the 1688 order for a website order.
 *
 * Bootstrap modal shell (#pickModal, opened by the list's Pick buttons with
 * data-toggle) with its own state, so the carton choice resets for every
 * order and the Pick button can't fire twice while 1688 is working.
 *
 * Props:
 *   order            the website order being picked (productObj)
 *   rate             ৳ per ¥ used for the order (order.currency || today's)
 *   addresses        China shipping addresses from 1688 (shippingAddress)
 *   fraudCheckOrder  order to run the Pathao fraud check for (New tab), or null
 *   onPick({ carton, address, totalRmb })  → Promise; throws { code, message }
 *                    on failure, resolves when the order is saved
 */

const CARTONS = ["Shoes", "Clothing", "Bag", "Cosmetics", "Jewelry", "Machinary + Parts", "Battery Item", "China Mix", "Hongkong Mix"];
const cdn = (url) => (url ? String(url).replace("cbu01.alicdn.com", "global-img-cdn.1688.com") : "");
const rmb = (v) => `¥${(Number.isFinite(v) ? v : 0).toFixed(2)}`;

export default class PickOrderModal extends Component {
  state = { carton: "", addressId: null, picking: false, error: null, tried: false };

  componentDidUpdate(prev) {
    const prevId = prev.order && prev.order.orderId;
    const id = this.props.order && this.props.order.orderId;
    if (id && id !== prevId) {
      /* new order: fresh carton choice; keep the warehouse address the
         admin used last (usually the same), else the first one */
      const keep = this.props.addresses && this.props.addresses.find((a) => a.id === this.state.addressId);
      this.setState({
        carton: this.props.order.agentCarton || "",
        addressId: keep ? keep.id : this.props.addresses && this.props.addresses[0] ? this.props.addresses[0].id : null,
        picking: false,
        error: null,
        tried: false,
      });
    }
    if (!this.state.addressId && this.props.addresses && this.props.addresses.length && !(prev.addresses && prev.addresses.length)) {
      this.setState({ addressId: this.props.addresses[0].id });
    }
  }

  close = () => {
    if (this.state.picking) return;
    if (window.$) window.$("#pickModal").modal("hide");
  };

  pick = async () => {
    const { order, addresses = [], onPick } = this.props;
    const { carton, addressId, picking } = this.state;
    if (picking) return;
    this.setState({ tried: true, error: null });
    const address = addresses.find((a) => a.id === addressId);
    if (!carton || !address) return;
    this.setState({ picking: true });
    try {
      await onPick({ carton, address, totalRmb: this.totals(order).rmbTotal });
      this.setState({ picking: false });
      if (window.$) window.$("#pickModal").modal("hide");
    } catch (e) {
      this.setState({ picking: false, error: e || { message: "Could not pick the order." } });
    }
  };

  totals(order) {
    const rate = this.props.rate || 1;
    let rmbTotal = 0;
    let pcs = 0;
    let variants = 0;
    ((order && order.items) || []).forEach((item) =>
      (item.skus || []).forEach((sku) => {
        rmbTotal += (Number(sku.price) * Number(sku.totalQuantity)) / rate;
        pcs += Number(sku.totalQuantity) || 0;
        variants += 1;
      })
    );
    return { rmbTotal, pcs, variants };
  }

  renderItems(order) {
    const rate = this.props.rate || 1;
    return (order.items || []).map((item, idx) => (
      <div className="pk-item" key={item.id || idx}>
        <div className="pk-item-head">
          <div className="pk-item-name">{item.name || "Item"}</div>
          {item.detail_url && (
            <a className="pk-link" href={item.detail_url} target="_blank" rel="noopener noreferrer">
              <i className="fa fa-external-link" /> Open on 1688
            </a>
          )}
        </div>
        <div className="pk-skus">
          {(item.skus || []).map((sku, j) => {
            const unit = Number(sku.price) / rate;
            const qty = Number(sku.totalQuantity) || 0;
            const variant = [
              sku.color ? `${(item.propertyNames && item.propertyNames[0]) || "Color"}: ${String(sku.color).replace(/^Color:/i, "")}` : "",
              sku.size ? `${(item.propertyNames && item.propertyNames[1]) || "Size"}: ${sku.size}` : "",
            ].filter(Boolean);
            return (
              <div className="pk-sku" key={j}>
                <img src={cdn(sku.image || item.picture)} alt="" />
                <div className="pk-sku-main">
                  <div className="pk-chips">
                    {variant.length ? variant.map((v) => <span key={v} className="pk-chip">{v}</span>) : <span className="pk-chip">Default</span>}
                    {item.productType && <span className="pk-chip pk-chip-soft">{item.productType}</span>}
                  </div>
                  {item.shippingRate && <small>Shipping rate ৳{item.shippingRate}/kg</small>}
                </div>
                <div className="pk-num">
                  <span>{rmb(unit)}</span>
                  <small>per pc</small>
                </div>
                <div className="pk-num">
                  <span>× {qty}</span>
                  <small>pcs</small>
                </div>
                <div className="pk-num pk-num-strong">
                  <span>{rmb(unit * qty)}</span>
                  <small>line total</small>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    ));
  }

  render() {
    const { order, addresses = [], fraudCheckOrder } = this.props;
    const { carton, addressId, picking, error, tried } = this.state;
    const t = this.totals(order);
    const cartonMissing = tried && !carton;
    const addressMissing = tried && !addresses.find((a) => a.id === addressId);

    return (
      <div className="modal fade pk-modal" id="pickModal" tabIndex="-1" role="dialog" aria-labelledby="pickModalTitle" aria-hidden="true" data-backdrop={picking ? "static" : true}>
        <div className="modal-dialog modal-dialog-centered pk-dialog" role="document">
          <div className="modal-content pk-content">
            {/* header */}
            <div className="pk-head">
              <div>
                <div className="pk-kicker">Pick order · create on 1688</div>
                <div className="pk-title" id="pickModalTitle">Order #{order && order.orderId}</div>
                {order && (
                  <div className="pk-head-chips">
                    {order.shopName && <span>{order.shopName}</span>}
                    <span>{t.variants} variant{t.variants === 1 ? "" : "s"} · {t.pcs} pcs</span>
                    {order.displayName && <span>👤 {order.displayName}</span>}
                  </div>
                )}
              </div>
              <button type="button" className="pk-x" onClick={this.close} disabled={picking} aria-label="Close">
                &times;
              </button>
            </div>

            {order && (
              <div className="pk-body">
                {fraudCheckOrder && (
                  <FraudCheckPanel phone={fraudCheckOrder.deliveryAddress && fraudCheckOrder.deliveryAddress.mobileNo} name={fraudCheckOrder.deliveryAddress && fraudCheckOrder.deliveryAddress.name} />
                )}

                {order.additionalNotes && (
                  <div className="pk-note">
                    <i className="fa fa-sticky-note-o" />
                    <div>
                      <b>Customer note</b>
                      <span>{order.additionalNotes}</span>
                    </div>
                  </div>
                )}

                <section className="pk-section">
                  <div className="pk-section-title">
                    <span className="pk-step">1</span> Items to order
                  </div>
                  {this.renderItems(order)}
                </section>

                <section className="pk-section">
                  <div className="pk-section-title">
                    <span className="pk-step">2</span> Carton type
                    {cartonMissing && <em className="pk-req">Choose a carton</em>}
                  </div>
                  <div className={`pk-cartons${cartonMissing ? " is-missing" : ""}`}>
                    {CARTONS.map((c) => (
                      <button type="button" key={c} className={`pk-carton${carton === c ? " is-on" : ""}`} onClick={() => this.setState({ carton: c, error: null })} disabled={picking}>
                        {carton === c && <i className="fa fa-check" />} {c}
                      </button>
                    ))}
                  </div>
                </section>

                <section className="pk-section">
                  <div className="pk-section-title">
                    <span className="pk-step">3</span> China shipping address
                    {addressMissing && <em className="pk-req">Choose an address</em>}
                  </div>
                  {addresses.length ? (
                    <div className={`pk-addrs${addressMissing ? " is-missing" : ""}`}>
                      {addresses.map((a) => {
                        const on = a.id === addressId;
                        return (
                          <button type="button" key={a.id} className={`pk-addr${on ? " is-on" : ""}`} onClick={() => this.setState({ addressId: a.id, error: null })} disabled={picking}>
                            <span className="pk-radio">{on && <i className="fa fa-check" />}</span>
                            <span className="pk-addr-body">
                              <span className="pk-addr-top">
                                <b>{a.fullName}</b>
                                <span>{a.mobilePhone}</span>
                              </span>
                              <span className="pk-addr-text">{a.address}</span>
                              <span className="pk-addr-meta">
                                ID {a.id} · Code {a.addressCode} · Post {a.post}
                              </span>
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="pk-empty">Loading the 1688 shipping addresses…</div>
                  )}
                </section>

                {error && (
                  <div className="pk-error">
                    <i className="fa fa-exclamation-circle" />
                    <div>
                      <b>1688 order creation failed</b>
                      <span>{error.message || error.code || "Unknown error"}</span>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* footer */}
            <div className="pk-foot">
              <div className="pk-total">
                <span>Total to pay on 1688</span>
                <b>{rmb(t.rmbTotal)}</b>
                <small>before China shipping · {t.pcs} pcs</small>
              </div>
              <div className="pk-actions">
                <button type="button" className="pk-btn pk-btn-ghost" onClick={this.close} disabled={picking}>
                  Cancel
                </button>
                <button type="button" className="pk-btn pk-btn-primary" onClick={this.pick} disabled={picking || !order}>
                  {picking ? (
                    <>
                      <i className="fa fa-spinner fa-spin" /> Creating 1688 order…
                    </>
                  ) : (
                    <>
                      <i className="fa fa-hand-paper-o" /> Pick order
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
}
