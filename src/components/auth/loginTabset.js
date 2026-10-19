import React, { Component, Fragment } from "react";
import { withRouter } from "react-router-dom";
import {
  AlertCircle,
  ArrowRight,
  Check,
  Eye,
  EyeOff,
  LogIn,
  UserPlus,
} from "react-feather";
import {
  auth,
  createAdminProfileDocument,
  sendPasswordReset,
  setAuthPersistence,
} from "../../firebase/firebase.utils";
import "./login.css";

const REMEMBERED_EMAIL = "paicart.admin.email";

// Firebase codes are for logs; these are for the person at the keyboard.
const MESSAGES = {
  "auth/invalid-email": "That doesn't look like an email address.",
  "auth/user-disabled":
    "This account is switched off. Ask an admin to re-enable it.",
  "auth/user-not-found": "No Paicart account uses that email.",
  "auth/wrong-password": "That password doesn't match this account.",
  "auth/invalid-login-credentials": "That email and password don't match.",
  "auth/too-many-requests": "Too many attempts. Wait a minute, then try again.",
  "auth/network-request-failed":
    "You're offline. Check your connection and try again.",
  "auth/email-already-in-use": "That email already has a Paicart account.",
  "auth/weak-password": "Use at least 6 characters for the password.",
};

const readMessage = (error) =>
  MESSAGES[error && error.code] || "Something went wrong. Try again.";

export class LoginTabset extends Component {
  constructor(props) {
    super(props);

    let remembered = "";
    try {
      remembered = window.localStorage.getItem(REMEMBERED_EMAIL) || "";
    } catch (error) {
      remembered = "";
    }

    this.state = {
      tab: "login",
      inkLeft: 0,
      inkWidth: 0,
      busy: false,
      error: "",
      notice: "",
      showPassword: false,
      remember: Boolean(remembered),
      loginEmail: remembered,
      loginPassword: "",
      registerDisplayName: "",
      registerEmail: "",
      registerPassword: "",
      registerConfirmPassword: "",
      registerStatus: "",
    };
  }

  tabRefs = {};

  componentDidMount() {
    this.measureTabs();
  }

  componentDidUpdate(prevProps, prevState) {
    if (prevState.tab !== this.state.tab) this.measureTabs();
  }

  // The underline slides between tabs, so it has to know their real widths.
  measureTabs = () => {
    const el = this.tabRefs[this.canRegister() ? this.state.tab : "login"];
    if (!el) return;
    const { offsetLeft, offsetWidth } = el;
    if (
      offsetLeft !== this.state.inkLeft ||
      offsetWidth !== this.state.inkWidth
    ) {
      this.setState({ inkLeft: offsetLeft, inkWidth: offsetWidth });
    }
  };

  canRegister = () =>
    Boolean(
      this.props.currentAdmin && this.props.currentAdmin.status === "Admin",
    );

  selectTab = (tab) => this.setState({ tab, error: "", notice: "" });

  handleChange = (event) => {
    const { name, value, type, checked } = event.target;
    this.setState({
      [name]: type === "checkbox" ? checked : value,
      error: "",
      notice: "",
    });
  };

  handleLoginSubmit = async (event) => {
    event.preventDefault();
    if (this.state.busy) return;

    const { loginEmail, loginPassword, remember } = this.state;
    this.setState({ busy: true, error: "", notice: "" });

    try {
      await setAuthPersistence();
      await auth.signInWithEmailAndPassword(loginEmail.trim(), loginPassword);

      try {
        if (remember) {
          window.localStorage.setItem(REMEMBERED_EMAIL, loginEmail.trim());
        } else {
          window.localStorage.removeItem(REMEMBERED_EMAIL);
        }
      } catch (error) {
        // Storage is blocked — signing in still worked, so carry on.
      }

      this.props.history.push(`${process.env.PUBLIC_URL}/dashboard`);
    } catch (error) {
      console.error("login failed", error);
      this.setState({
        busy: false,
        loginPassword: "",
        error: readMessage(error),
      });
    }
  };

  handleResetPassword = async () => {
    const email = this.state.loginEmail.trim();

    if (!email) {
      this.setState({
        error: "Enter your email above, then choose Reset password.",
        notice: "",
      });
      return;
    }

    this.setState({ busy: true, error: "", notice: "" });

    try {
      await sendPasswordReset(email);
      this.setState({
        busy: false,
        notice: `Reset link sent to ${email}. Check your inbox.`,
      });
    } catch (error) {
      console.error("password reset failed", error);
      this.setState({ busy: false, error: readMessage(error) });
    }
  };

  handleRegisterSubmit = async (event) => {
    event.preventDefault();
    if (this.state.busy) return;

    const {
      registerDisplayName,
      registerEmail,
      registerPassword,
      registerConfirmPassword,
      registerStatus,
    } = this.state;

    if (registerPassword !== registerConfirmPassword) {
      this.setState({ error: "The two passwords don't match.", notice: "" });
      return;
    }

    this.setState({ busy: true, error: "", notice: "" });

    try {
      const { user } = await auth.createUserWithEmailAndPassword(
        registerEmail.trim(),
        registerPassword,
      );

      await createAdminProfileDocument(user, {
        name: registerDisplayName,
        status: registerStatus,
      });

      this.setState({
        busy: false,
        registerDisplayName: "",
        registerEmail: "",
        registerPassword: "",
        registerConfirmPassword: "",
        registerStatus: "",
        notice: `${registerDisplayName} can now sign in as ${registerStatus}.`,
      });
    } catch (error) {
      console.error("admin creation failed", error);
      this.setState({ busy: false, error: readMessage(error) });
    }
  };

  renderMessages() {
    const { error, notice } = this.state;

    if (error) {
      return (
        <p className="pc-alert pc-alert--error" role="alert" key={error}>
          <AlertCircle />
          {error}
        </p>
      );
    }

    if (notice) {
      return (
        <p className="pc-alert pc-alert--ok" role="status" key={notice}>
          <Check />
          {notice}
        </p>
      );
    }

    return null;
  }

  renderLogin() {
    const { busy, loginEmail, loginPassword, remember, showPassword } =
      this.state;

    return (
      <form className="pc-form" onSubmit={this.handleLoginSubmit} noValidate>
        {this.renderMessages()}

        <div className="pc-field" style={{ "--i": 0 }}>
          <label className="pc-field__label" htmlFor="pc-login-email">
            Email
          </label>
          <div className="pc-field__wrap">
            <input
              id="pc-login-email"
              className="pc-input"
              name="loginEmail"
              type="email"
              autoComplete="username"
              placeholder="you@paicart.com"
              value={loginEmail}
              onChange={this.handleChange}
              required
            />
          </div>
        </div>

        <div className="pc-field" style={{ "--i": 1 }}>
          <label className="pc-field__label" htmlFor="pc-login-password">
            Password
          </label>
          <div className="pc-field__wrap">
            <input
              id="pc-login-password"
              className="pc-input pc-input--pass"
              name="loginPassword"
              type={showPassword ? "text" : "password"}
              autoComplete="current-password"
              placeholder="••••••••"
              value={loginPassword}
              onChange={this.handleChange}
              required
            />
            <button
              type="button"
              className="pc-reveal"
              onClick={() => this.setState({ showPassword: !showPassword })}
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? <EyeOff /> : <Eye />}
            </button>
          </div>
        </div>

        <div className="pc-row">
          <label className="pc-check">
            <input
              type="checkbox"
              name="remember"
              checked={remember}
              onChange={this.handleChange}
            />
            <span className="pc-check__box">
              <Check />
            </span>
            Remember my email
          </label>

          <button
            type="button"
            className="pc-link"
            onClick={this.handleResetPassword}
            disabled={busy}
          >
            Reset password
          </button>
        </div>

        <button className="pc-submit" type="submit" disabled={busy}>
          {busy ? (
            <Fragment>
              <span className="pc-spinner" />
              Signing in…
            </Fragment>
          ) : (
            <Fragment>
              Sign in
              <ArrowRight />
            </Fragment>
          )}
        </button>
      </form>
    );
  }

  renderRegister() {
    const {
      busy,
      registerDisplayName,
      registerEmail,
      registerPassword,
      registerConfirmPassword,
      registerStatus,
    } = this.state;

    return (
      <form className="pc-form" onSubmit={this.handleRegisterSubmit} noValidate>
        {this.renderMessages()}

        <div className="pc-field" style={{ "--i": 0 }}>
          <label className="pc-field__label" htmlFor="pc-reg-name">
            Full name
          </label>
          <input
            id="pc-reg-name"
            className="pc-input"
            name="registerDisplayName"
            type="text"
            placeholder="Rahim Uddin"
            value={registerDisplayName}
            onChange={this.handleChange}
            required
          />
        </div>

        <div className="pc-field" style={{ "--i": 1 }}>
          <label className="pc-field__label" htmlFor="pc-reg-email">
            Email
          </label>
          <input
            id="pc-reg-email"
            className="pc-input"
            name="registerEmail"
            type="email"
            autoComplete="off"
            placeholder="name@paicart.com"
            value={registerEmail}
            onChange={this.handleChange}
            required
          />
        </div>

        <div className="pc-field" style={{ "--i": 2 }}>
          <label className="pc-field__label" htmlFor="pc-reg-role">
            Role
          </label>
          <select
            id="pc-reg-role"
            className="pc-input"
            name="registerStatus"
            value={registerStatus}
            onChange={this.handleChange}
            required
          >
            <option value="">Choose a role</option>
            <option value="Admin">Admin</option>
            <option value="Accounts">Accounts</option>
            <option value="Employee">Employee</option>
            <option value="Officer">Officer</option>
            <option value="Partner">Partner</option>
          </select>
        </div>

        <div className="pc-field" style={{ "--i": 3 }}>
          <label className="pc-field__label" htmlFor="pc-reg-password">
            Password
          </label>
          <input
            id="pc-reg-password"
            className="pc-input"
            name="registerPassword"
            type="password"
            autoComplete="new-password"
            placeholder="At least 6 characters"
            value={registerPassword}
            onChange={this.handleChange}
            required
          />
        </div>

        <div className="pc-field" style={{ "--i": 4 }}>
          <label className="pc-field__label" htmlFor="pc-reg-confirm">
            Confirm password
          </label>
          <input
            id="pc-reg-confirm"
            className="pc-input"
            name="registerConfirmPassword"
            type="password"
            autoComplete="new-password"
            placeholder="Repeat the password"
            value={registerConfirmPassword}
            onChange={this.handleChange}
            required
          />
        </div>

        <button className="pc-submit" type="submit" disabled={busy}>
          {busy ? (
            <Fragment>
              <span className="pc-spinner" />
              Creating account…
            </Fragment>
          ) : (
            <Fragment>
              Create account
              <ArrowRight />
            </Fragment>
          )}
        </button>
      </form>
    );
  }

  render() {
    const { tab } = this.state;
    const showRegister = this.canRegister();
    const onLogin = tab === "login" || !showRegister;

    return (
      <div className="pc-card">
        <div className="pc-card__head">
          <span className="pc-eyebrow">Staff access</span>
          <h2 className="pc-card__title">
            {onLogin ? "Sign in" : "Add an admin"}
          </h2>
          <p className="pc-card__note">
            {onLogin
              ? "Use the Paicart account your team lead set up for you."
              : "Create an account for a teammate and pick what they can reach."}
          </p>
        </div>

        {showRegister ? (
          <div className="pc-tabs">
            <button
              type="button"
              ref={(el) => {
                this.tabRefs.login = el;
              }}
              className={`pc-tab${onLogin ? " is-active" : ""}`}
              onClick={() => this.selectTab("login")}
            >
              <LogIn />
              Sign in
            </button>
            <button
              type="button"
              ref={(el) => {
                this.tabRefs.register = el;
              }}
              className={`pc-tab${onLogin ? "" : " is-active"}`}
              onClick={() => this.selectTab("register")}
            >
              <UserPlus />
              Add admin
            </button>
            <span
              className="pc-tabs__ink"
              style={{ left: this.state.inkLeft, width: this.state.inkWidth }}
            />
          </div>
        ) : null}

        {onLogin ? this.renderLogin() : this.renderRegister()}

        <p className="pc-foot">
          Restricted to Paicart staff accounts.
          <br />
          Need access? Ask an admin to create one for you.
        </p>
      </div>
    );
  }
}

export default withRouter(LoginTabset);
