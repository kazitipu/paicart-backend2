import React, { Component } from "react";
import { Redirect } from "react-router-dom";
import { connect } from "react-redux";
import { auth, getAllAdmins } from "../../firebase/firebase.utils";
import { setAllAdmins, setCurrentAdmin } from "../../actions";
import logo from "../auth/logo.png";
import "./auth-gate.css";

/**
 * Wraps every route behind the login. Three states:
 *
 *   checking     Firebase has not reported yet. Nothing is rendered and
 *                nothing is redirected - bouncing to the login here would
 *                throw out anyone whose persisted session is still being
 *                restored, which is most cold page loads.
 *   signed-out   No session, or the session belongs to somebody who has no
 *                record in `admins`. Straight to the login page.
 *   authed       The signed-in user is an admin. Routes render.
 *
 * This also owns the admin lookup, because App only mounts once the gate has
 * opened and so cannot be the thing that decides whether to open it.
 */
/* In development the gate observes but never blocks: the panel and the
 * storefront share one Firebase project, so a dev machine is often signed in
 * with a non-admin account, and bouncing every route to the login makes the
 * app impossible to work on locally. The admin lookup below still runs, so
 * currentAdmin/sidebar behave exactly as in production - only the redirect is
 * skipped. Production is unchanged. */
const BYPASS_IN_DEV = process.env.NODE_ENV === "development";

export class AuthGate extends Component {
  state = { status: "checking" };

  componentDidMount() {
    this.mounted = true;
    const adminsPromise = getAllAdmins();

    this.unsubscribe = auth.onAuthStateChanged(async (adminAuth) => {
      if (!adminAuth) {
        this.props.setCurrentAdmin(null);
        this.setState({ status: "signed-out" });
        return;
      }

      const admins = (await adminsPromise) || [];
      if (!this.mounted) return;
      this.props.setAllAdmins(admins);

      const admin = admins.find((one) => one.adminId == adminAuth.uid);
      if (!admin) {
        /* Signed in to Firebase, but not with an admin account - the
           storefront and the panel share one project. Treated as signed out
           rather than force-signed-out, so nothing is destroyed here. */
        console.warn(
          "Signed-in user has no admin record",
          adminAuth.uid,
          adminAuth.email
        );
        this.props.setCurrentAdmin(null);
        this.setState({ status: "signed-out" });
        return;
      }

      this.props.setCurrentAdmin(admin);
      if (admin.status == "Admin") {
        document.body.classList.add("disable-buttons");
      } else {
        document.body.classList.remove("disable-buttons");
      }
      this.setState({ status: "authed" });
    });
  }

  componentWillUnmount() {
    this.mounted = false;
    if (this.unsubscribe) this.unsubscribe();
  }

  render() {
    const { status } = this.state;

    /* Never hold the app on the splash or the redirect in dev. */
    if (BYPASS_IN_DEV && status !== "authed") {
      return this.props.children;
    }

    if (status === "checking") {
      return (
        <div className="pc-gate">
          <div className="pc-gate__mark">
            <img src={logo} alt="Paicart" />
          </div>
          <p className="pc-gate__label">Checking your session</p>
          <span className="pc-gate__bar" />
        </div>
      );
    }

    if (status === "signed-out") {
      return <Redirect to={`${process.env.PUBLIC_URL}/`} />;
    }

    return this.props.children;
  }
}

export default connect(null, { setAllAdmins, setCurrentAdmin })(AuthGate);
