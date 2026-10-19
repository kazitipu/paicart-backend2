import React, { Component } from "react";
import { connect } from "react-redux";
import { withRouter } from "react-router-dom";
import { toast } from "react-toastify";
import { CornerDownRight, Info, X } from "react-feather";
import {
  set1688CategoryRatesRedux,
  clear1688CategoryRatesRedux,
} from "../../actions/index";
import {
  RATE_COLUMNS,
  RATE_REGIONS,
  effectiveSource,
  rateKeysFor,
} from "./categoryExplorer";
import "./rates1688.css";

/**
 * Sets one category's price.
 *
 * A price set here belongs to this category and cannot be overwritten from
 * above. It flows down to every sub-category that has no price of its own —
 * and stops at any sub-category that does, which keeps its own price and
 * carries on pricing its own branch.
 */
/**
 * Seeds the form from the category's own price if it has one, otherwise from
 * what it currently inherits — editing starts from what the admin is looking at.
 */
const seedValues = ({ category, freightType }) => {
  if (!category) return {};
  const columns = RATE_COLUMNS[freightType === "sea" ? "sea" : "air"];
  const own = category[rateKeysFor(freightType).own];
  const values = {};
  columns.forEach((column) => {
    const value = own ? own[column.key] : category[column.key];
    values[column.key] = value === undefined || value === null ? "" : String(value);
  });
  return values;
};

export class D2DRatesModal extends Component {
  constructor(props) {
    super(props);
    // The panel is mounted fresh per category, so the constructor is the seed
    // path that actually runs.
    this.state = { values: seedValues(props), busy: false, error: "" };
  }

  componentWillReceiveProps(nextProps) {
    if (nextProps.category === this.props.category) return;
    this.setState({ values: seedValues(nextProps), busy: false, error: "" });
  }

  /**
   * How far this price actually reaches: sub-categories with no price of their
   * own, minus the branches governed by a nearer priced ancestor.
   */
  impact() {
    const { category, categories, freightType } = this.props;
    if (!category) return { follows: 0, keeps: 0 };

    const keys = rateKeysFor(freightType);
    const id = Number(category.categoryId);

    const ownIds = new Set([String(id)]);
    const descendants = categories.filter((c) =>
      (c.ancestors || []).some((a) => Number(a) === id)
    );
    descendants.forEach((c) => {
      if (c[keys.own]) ownIds.add(String(c.categoryId));
    });

    let follows = 0;
    let keeps = 0;

    descendants.forEach((c) => {
      if (c[keys.own]) {
        keeps += 1;
        return;
      }
      const ancestors = c.ancestors || [];
      let nearest = null;
      for (let i = ancestors.length - 1; i >= 0; i--) {
        if (ownIds.has(String(ancestors[i]))) {
          nearest = String(ancestors[i]);
          break;
        }
      }
      if (nearest === String(id)) follows += 1;
      else keeps += 1;
    });

    return { follows, keeps };
  }

  handleChange = (event) => {
    const { name, value } = event.target;
    this.setState((prev) => ({
      values: { ...prev.values, [name]: value },
      error: "",
    }));
  };

  handleSubmit = async (event) => {
    event.preventDefault();
    if (this.state.busy) return;

    const { category, freightType } = this.props;
    const columns = RATE_COLUMNS[freightType === "sea" ? "sea" : "air"];
    const regions = RATE_REGIONS[freightType === "sea" ? "sea" : "air"] || [];
    const regionLabel = (key) =>
      (regions.find((r) => r.key === key) || {}).label;
    const missing = columns.filter(
      (c) => String(this.state.values[c.key] || "").trim() === ""
    );

    if (missing.length > 0) {
      const names = missing.map((c) =>
        regions.length > 1 ? `${regionLabel(c.region)} ${c.label}` : c.label
      );
      this.setState({
        error: `Fill in every tier — ${names.join(", ")} ${
          missing.length === 1 ? "is" : "are"
        } still empty.`,
      });
      return;
    }

    this.setState({ busy: true, error: "" });

    try {
      const result = await this.props.set1688CategoryRatesRedux(
        category.categoryId,
        freightType === "sea" ? "sea" : "air",
        this.state.values
      );
      toast.success(
        result.updated > 0
          ? `${category.translatedName} priced — ${result.updated} sub-categor${
              result.updated === 1 ? "y" : "ies"
            } followed, ${result.kept} kept their own.`
          : `${category.translatedName} priced.`
      );
      this.props.onClose();
    } catch (error) {
      console.error("failed to set category rates", error);
      this.setState({ busy: false, error: "Could not save the price. Try again." });
    }
  };

  handleClear = async () => {
    const { category, freightType } = this.props;
    if (this.state.busy) return;

    if (
      !window.confirm(
        `Remove ${category.translatedName}'s own price? It will go back to inheriting from the nearest parent that has one.`
      )
    ) {
      return;
    }

    this.setState({ busy: true, error: "" });

    try {
      const result = await this.props.clear1688CategoryRatesRedux(
        category.categoryId,
        freightType === "sea" ? "sea" : "air"
      );
      toast.success(
        result.inheritedFrom
          ? `${category.translatedName} follows its parent again.`
          : `${category.translatedName} has no price now — nothing above it sets one.`
      );
      this.props.onClose();
    } catch (error) {
      console.error("failed to clear category rates", error);
      this.setState({ busy: false, error: "Could not clear the price. Try again." });
    }
  };

  render() {
    const { category, freightType, onClose, nameOf } = this.props;
    if (!category) return null;

    const columns = RATE_COLUMNS[freightType === "sea" ? "sea" : "air"];
    const regions = RATE_REGIONS[freightType === "sea" ? "sea" : "air"] || [
      { key: "cn", label: "China" },
    ];
    const keys = rateKeysFor(freightType);
    const hasOwn = effectiveSource(category, freightType) === "own";
    const inheritedFrom = category[keys.from];
    const { follows, keeps } = this.impact();
    const path = (category.pathNames || []).join("  ›  ");
    const { busy, error } = this.state;

    return (
      <div className="r1688">
        <div
          className="r1688-backdrop"
          onClick={(e) => {
            if (e.target === e.currentTarget && !busy) onClose();
          }}
        >
          <div className="r1688-panel" role="dialog" aria-modal="true">
            <div className="r1688-panel__head">
              <div>
                <span className="r1688-panel__path">{path || "Root category"}</span>
                <h3 className="r1688-panel__title">{category.translatedName}</h3>
                <p className="r1688-panel__id">
                  #{category.categoryId} · level {category.level}
                  {hasOwn
                    ? " · priced here"
                    : inheritedFrom
                    ? ` · follows ${nameOf(inheritedFrom)}`
                    : " · no price yet"}
                </p>
              </div>
              <button
                type="button"
                className="r1688-panel__close"
                onClick={onClose}
                aria-label="Close"
              >
                <X />
              </button>
            </div>

            <form onSubmit={this.handleSubmit}>
              {regions.length > 1 ? (
                <p className="r1688-form-hint">
                  Every tier needs a price for each region — a China-shipped
                  parcel and a Hong Kong-shipped parcel in the same weight
                  tier can cost different amounts.
                </p>
              ) : null}

              {regions.map((region) => {
                const regionColumns = columns.filter(
                  (column) => column.region === region.key
                );
                return (
                  <div className="r1688-field-group" key={region.key}>
                    {regions.length > 1 ? (
                      <div
                        className={`r1688-field-group__head r1688-field-group__head--${region.key}`}
                      >
                        {region.label} shipment
                      </div>
                    ) : null}
                    <div className="r1688-fields">
                      {regionColumns.map((column) => (
                        <div key={column.key}>
                          <label
                            className="r1688-field__label"
                            htmlFor={`r1688-input-${column.key}`}
                          >
                            {column.label} · {column.unit}
                          </label>
                          <input
                            id={`r1688-input-${column.key}`}
                            className="r1688-field__input"
                            type="number"
                            min="0"
                            name={column.key}
                            value={this.state.values[column.key] || ""}
                            onChange={this.handleChange}
                            placeholder="0"
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}

              <div className="r1688-impact">
                <Info />
                <span>
                  {follows > 0 ? (
                    <React.Fragment>
                      This price also applies to <b>{follows.toLocaleString()}</b>{" "}
                      sub-categor{follows === 1 ? "y" : "ies"} that have no price
                      of their own.
                    </React.Fragment>
                  ) : (
                    <React.Fragment>
                      No sub-category is waiting on a price from here.
                    </React.Fragment>
                  )}
                  {keeps > 0 ? (
                    <React.Fragment>
                      {" "}
                      <b>{keeps.toLocaleString()}</b> keep their own price and are
                      left alone.
                    </React.Fragment>
                  ) : null}
                </span>
              </div>

              {error ? <p className="r1688-panel__error">{error}</p> : null}

              <div className="r1688-panel__actions">
                {hasOwn ? (
                  <button
                    type="button"
                    className="r1688-btn r1688-btn--ghost"
                    onClick={this.handleClear}
                    disabled={busy}
                  >
                    <CornerDownRight />
                    Clear own price
                  </button>
                ) : null}
                <button
                  type="submit"
                  className="r1688-btn r1688-btn--primary"
                  disabled={busy}
                >
                  {busy ? <span className="r1688-spinner" /> : null}
                  {busy ? "Saving…" : "Save price"}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    );
  }
}

export default withRouter(
  connect(null, {
    set1688CategoryRatesRedux,
    clear1688CategoryRatesRedux,
  })(D2DRatesModal)
);
