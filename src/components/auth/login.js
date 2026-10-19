import React, { Component, Fragment } from "react";
import LoginTabset from "./loginTabset";
import logo from "./logo.png";
import "./login.css";

/**
 * The stages an order actually moves through in Paicart ops — the same
 * sequence the sales routes are built around. The rail animates a cargo
 * beacon down this list, lighting each stage as it passes.
 */
const LIFECYCLE = [
  "Pending",
  "Payment approved",
  "Ordered",
  "China warehouse",
  "In shipment",
  "In stock",
  "Delivered",
];

export class Login extends Component {
  render() {
    return (
      <Fragment>
        <div className="pc-auth">
          <aside className="pc-brand">
            <div className="pc-brandmark">
              <span className="pc-brandmark__disc">
                <img src={logo} alt="Paicart" />
              </span>
              <span>
                <span className="pc-brandmark__name">Paicart</span>
                <span className="pc-brandmark__tag">Operations console</span>
              </span>
            </div>

            <div className="pc-brand__body">
              <h1 className="pc-headline">
                Every carton, from the supplier&rsquo;s floor to the
                customer&rsquo;s <em>door</em>.
              </h1>
              <p className="pc-sub">
                Orders, shipments, payments and stock across the Paicart
                network — in one place.
              </p>
            </div>

            <div className="pc-rail">
              <p className="pc-rail__label">Order lifecycle</p>
              <div className="pc-rail__track">
                <span className="pc-rail__line" />
                <span className="pc-rail__trail" />
                {LIFECYCLE.map((stage, i) => (
                  <div className="pc-stage" key={stage} style={{ "--i": i }}>
                    <span className="pc-stage__node" />
                    <span className="pc-stage__name">{stage}</span>
                  </div>
                ))}
              </div>
            </div>

            <p className="pc-brand__foot">
              <span />
              China → Bangladesh
            </p>
          </aside>

          <main className="pc-panel">
            <LoginTabset
              setCurrentAdmin={this.props.setCurrentAdmin}
              currentAdmin={this.props.currentAdmin}
            />
          </main>
        </div>
      </Fragment>
    );
  }
}

export default Login;
