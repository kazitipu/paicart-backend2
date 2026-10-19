import React, { Component } from "react";
import { Home } from "react-feather";
import { Link } from "react-router-dom";
import "./breadcrumb.css";

/* Small inline chevron rather than a font glyph or a "/" character: it keeps
   its optical weight next to 11px text, which the theme's slash did not. */
const Caret = () => (
  <svg
    className="pc-crumb__caret"
    width="12"
    height="12"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.4"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <polyline points="9 18 15 12 9 6" />
  </svg>
);

/* Several pages pass their parent as a slug ("expense-history") or in mixed
   case ("NOtices"). Dashes become spaces here and the casing is normalised in
   CSS, so the trail reads consistently without touching 131 call sites. */
const readable = (value) =>
  typeof value === "string" ? value.replace(/[-_]+/g, " ").trim() : value;

export class Breadcrumb extends Component {
  render() {
    const { title, parent, children } = this.props;

    return (
      <div className="container-fluid">
        <div className="pc-crumb">
          <nav className="pc-crumb__trail" aria-label="Breadcrumb">
            <Link
              to={`${process.env.PUBLIC_URL}/dashboard`}
              className="pc-crumb__home"
              title="Dashboard"
            >
              <Home size={13} />
            </Link>
            {parent ? (
              <>
                <Caret />
                <span className="pc-crumb__parent">{readable(parent)}</span>
              </>
            ) : null}
            {title ? (
              <>
                <Caret />
                <span className="pc-crumb__current">{title}</span>
              </>
            ) : null}
          </nav>

          <div className="pc-crumb__head">
            <h1 className="pc-crumb__title">{title}</h1>
            {children ? (
              <div className="pc-crumb__actions">{children}</div>
            ) : null}
          </div>
        </div>
      </div>
    );
  }
}

export default Breadcrumb;
