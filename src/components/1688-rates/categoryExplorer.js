import React, { Component, Fragment } from "react";
import {
  ChevronRight,
  CornerDownRight,
  Edit2,
  Search,
  Tag,
  X,
  AlertCircle,
  Folder,
} from "react-feather";
import "./rates1688.css";

// Air is priced in four tiers, sea in three. Parcel is a flat charge per
// parcel; every other tier is per kilo. Both price each tier twice — once
// for shipments out of China, once for Hong Kong — since the same category
// can carry two different rates depending on which warehouse it ships from.
export const RATE_COLUMNS = {
  air: [
    { key: "parcel", label: "Parcel", unit: "tk/parcel", region: "cn" },
    { key: "ten", label: "Below 5kg", unit: "tk/kg", region: "cn" },
    { key: "eleven", label: "Above 5kg", unit: "tk/kg", region: "cn" },
    { key: "above_100kg", label: "Above 100kg", unit: "tk/kg", region: "cn" },
    {
      key: "parcel_hk",
      label: "Parcel",
      unit: "tk/parcel",
      region: "hk",
      groupStart: true,
    },
    { key: "ten_hk", label: "Below 5kg", unit: "tk/kg", region: "hk" },
    { key: "eleven_hk", label: "Above 5kg", unit: "tk/kg", region: "hk" },
    { key: "above_100kg_hk", label: "Above 100kg", unit: "tk/kg", region: "hk" },
  ],
  sea: [
    { key: "100kg", label: "100kg", unit: "tk/kg", region: "cn" },
    { key: "below_1000kg", label: "Below 1000kg", unit: "tk/kg", region: "cn" },
    { key: "above_1000kg", label: "Above 1000kg", unit: "tk/kg", region: "cn" },
    {
      key: "100kg_hk",
      label: "100kg",
      unit: "tk/kg",
      region: "hk",
      groupStart: true,
    },
    { key: "below_1000kg_hk", label: "Below 1000kg", unit: "tk/kg", region: "hk" },
    { key: "above_1000kg_hk", label: "Above 1000kg", unit: "tk/kg", region: "hk" },
  ],
};

// Which regions a freight type prices separately. Both air and sea now
// split into China / Hong Kong pricing.
export const RATE_REGIONS = {
  air: [
    { key: "cn", label: "China" },
    { key: "hk", label: "Hong Kong" },
  ],
  sea: [
    { key: "cn", label: "China" },
    { key: "hk", label: "Hong Kong" },
  ],
};

// The standard rates every category starts from. Backfilling writes these
// onto every root category, which cascades to any descendant that has no
// price of its own — a category priced individually keeps it.
export const DEFAULT_RATES = {
  air: {
    parcel: "350",
    ten: "900",
    eleven: "880",
    above_100kg: "820",
    parcel_hk: "450",
    ten_hk: "1200",
    eleven_hk: "1150",
    above_100kg_hk: "1100",
  },
  sea: {
    "100kg": "300",
    below_1000kg: "280",
    above_1000kg: "260",
    "100kg_hk": "450",
    below_1000kg_hk: "420",
    above_1000kg_hk: "400",
  },
};

export const rateKeysFor = (freightType) =>
  freightType === "sea"
    ? { own: "ownSeaRates", source: "seaRateSource", from: "seaInheritedFrom" }
    : { own: "ownAirRates", source: "airRateSource", from: "airInheritedFrom" };

const hasRate = (value) =>
  value !== undefined && value !== null && String(value).trim() !== "";

/**
 * Where a category's price comes from.
 *
 * Categories imported before the tree existed carry rates but no source flag —
 * those rates were set by an admin on that category, so they read as its own.
 */
export const effectiveSource = (category, freightType) => {
  const keys = rateKeysFor(freightType);
  if (category[keys.source]) return category[keys.source];
  const columns = RATE_COLUMNS[freightType === "sea" ? "sea" : "air"];
  return columns.some((column) => hasRate(category[column.key])) ? "own" : "none";
};

// A long result list is a sign the search needs refining, not a reason to put
// ten thousand rows in the DOM.
const SEARCH_LIMIT = 200;

export class CategoryExplorer extends Component {
  state = {
    query: "",
    filter: "all",
    expanded: {},
    focusId: null,
  };

  // Derived views of the category list, rebuilt only when the list changes.
  index = { source: null, byId: new Map(), childrenOf: new Map(), roots: [] };

  getIndex() {
    const { categories } = this.props;
    if (this.index.source === categories) return this.index;

    const byId = new Map();
    const childrenOf = new Map();

    categories.forEach((category) => {
      byId.set(String(category.categoryId), category);
    });

    categories.forEach((category) => {
      const parent = String(category.parentCateId || 0);
      if (!childrenOf.has(parent)) childrenOf.set(parent, []);
      childrenOf.get(parent).push(category);
    });

    childrenOf.forEach((list) =>
      list.sort((a, b) =>
        String(a.translatedName || "").localeCompare(String(b.translatedName || ""))
      )
    );

    this.index = {
      source: categories,
      byId,
      childrenOf,
      roots: childrenOf.get("0") || [],
    };
    return this.index;
  }

  nameOf = (categoryId) => {
    const category = this.getIndex().byId.get(String(categoryId));
    return category ? category.translatedName : `#${categoryId}`;
  };

  toggle = (categoryId) => {
    const id = String(categoryId);
    this.setState((prev) => ({
      expanded: { ...prev.expanded, [id]: !prev.expanded[id] },
    }));
  };

  /** Jump from a search hit to the category's place in the tree. */
  reveal = (category) => {
    const expanded = { ...this.state.expanded };
    (category.ancestors || []).forEach((id) => {
      expanded[String(id)] = true;
    });
    this.setState(
      { query: "", filter: "all", expanded, focusId: String(category.categoryId) },
      () => {
        const row = document.getElementById(`r1688-row-${category.categoryId}`);
        if (row && row.scrollIntoView) {
          row.scrollIntoView({ block: "center", behavior: "smooth" });
        }
      }
    );
  };

  matchesFilter = (category) => {
    const { filter } = this.state;
    if (filter === "all") return true;
    const source = effectiveSource(category, this.props.freightType);
    if (filter === "own") return source === "own";
    if (filter === "unpriced") return source === "none";
    return true;
  };

  /**
   * Flat, breadcrumbed rows — used for search hits and for the "own price" /
   * "no price" filters, where a tree would hide matches behind unexpanded
   * parents that do not match themselves.
   */
  flatResults() {
    const query = this.state.query.trim().toLowerCase();

    const hits = [];
    for (const category of this.props.categories) {
      if (!this.matchesFilter(category)) continue;
      if (query) {
        const name = String(category.translatedName || "").toLowerCase();
        const chinese = String(category.chineseName || "");
        if (
          name.indexOf(query) === -1 &&
          chinese.indexOf(this.state.query.trim()) === -1 &&
          String(category.categoryId).indexOf(query) === -1
        ) {
          continue;
        }
      }
      hits.push(category);
      // Collect a little past the cap so the "refine" note can be honest.
      if (hits.length > SEARCH_LIMIT * 4) break;
    }

    hits.sort((a, b) => {
      const an = String(a.translatedName || "").toLowerCase();
      const bn = String(b.translatedName || "").toLowerCase();
      if (query) {
        // Prefix matches first — they are what people mean.
        const ap = an.indexOf(query);
        const bp = bn.indexOf(query);
        if (ap !== bp) return ap - bp;
      }
      return an.localeCompare(bn);
    });

    return hits;
  }

  /** Visible rows in tree mode: roots plus the children of expanded nodes. */
  treeRows() {
    const { childrenOf } = this.getIndex();
    const rows = [];

    const walk = (categories, depth) => {
      categories.forEach((category) => {
        const id = String(category.categoryId);
        const children = childrenOf.get(id) || [];
        const isOpen = Boolean(this.state.expanded[id]);
        rows.push({ category, depth, children, isOpen });
        if (isOpen && children.length > 0) walk(children, depth + 1);
      });
    };

    walk(this.getIndex().roots, 0);
    return rows;
  }

  renderRate(category, column) {
    const value = category[column.key];
    const cellClass = `r1688-cell${column.groupStart ? " r1688-cell--group-start" : ""}`;
    if (value === undefined || value === null || String(value).trim() === "") {
      return (
        <div className={cellClass} key={column.key}>
          <span className="r1688-rate r1688-rate--empty">—</span>
        </div>
      );
    }
    return (
      <div className={cellClass} key={column.key}>
        <span className="r1688-rate">
          {value}
          <span className="r1688-rate__unit">{column.unit}</span>
        </span>
      </div>
    );
  }

  renderSource(category) {
    const keys = rateKeysFor(this.props.freightType);
    const source = effectiveSource(category, this.props.freightType);

    if (source === "own") {
      return (
        <span className="r1688-source r1688-source--own">
          <Tag />
          Set here
        </span>
      );
    }
    if (source === "inherited") {
      const from = category[keys.from];
      return (
        <span
          className="r1688-source r1688-source--inherited"
          title={`Inherited from ${this.nameOf(from)}`}
        >
          <CornerDownRight />
          {this.nameOf(from)}
        </span>
      );
    }
    return (
      <span className="r1688-source r1688-source--none">
        <AlertCircle />
        No price
      </span>
    );
  }

  renderRow(category, { depth = 0, children = [], isOpen = false, breadcrumb = null, flat = false }) {
    const { freightType, onEdit, canEdit } = this.props;
    const columns = RATE_COLUMNS[freightType === "sea" ? "sea" : "air"];
    const id = String(category.categoryId);
    const hasChildren = !flat && children.length > 0;

    return (
      <div
        key={id}
        id={`r1688-row-${id}`}
        className={`r1688-row r1688-row--body${
          this.state.focusId === id ? " r1688-row--focus" : ""
        }`}
        style={{ gridTemplateColumns: this.gridTemplate() }}
      >
        <div className="r1688-name" style={{ paddingLeft: depth * 22 }}>
          {hasChildren ? (
            <button
              type="button"
              className={`r1688-expander${isOpen ? " is-open" : ""}`}
              onClick={() => this.toggle(id)}
              aria-label={isOpen ? "Collapse" : "Expand"}
              aria-expanded={isOpen}
            >
              <ChevronRight />
            </button>
          ) : (
            <span className="r1688-expander r1688-expander--leaf" />
          )}

          <span className="r1688-name__text">
            <span className="r1688-name__title" title={category.translatedName}>
              {category.translatedName}
            </span>
            <span className="r1688-name__meta">
              {breadcrumb ? (
                <button
                  type="button"
                  className="r1688-crumb"
                  onClick={() => this.reveal(category)}
                  title="Show where this sits in the tree"
                >
                  {breadcrumb}
                </button>
              ) : (
                <Fragment>
                  #{id}
                  {hasChildren ? ` · ${children.length} sub-categories` : ""}
                </Fragment>
              )}
            </span>
          </span>
        </div>

        {columns.map((column) => this.renderRate(category, column))}

        <div>{this.renderSource(category)}</div>

        <div>
          {canEdit ? (
            <button type="button" className="r1688-edit" onClick={() => onEdit(category)}>
              <Edit2 />
              Price
            </button>
          ) : null}
        </div>
      </div>
    );
  }

  gridTemplate() {
    const columns = RATE_COLUMNS[this.props.freightType === "sea" ? "sea" : "air"];
    // Air doubles up to 8 rate columns (China + Hong Kong), so each one gets
    // a little less room than sea's 3 do.
    const rateWidth = columns.length > 4 ? "minmax(88px, 108px)" : "minmax(108px, 132px)";
    return `minmax(240px, 1fr) ${columns
      .map(() => rateWidth)
      .join(" ")} minmax(132px, 180px) ${this.props.canEdit ? "92px" : "0px"}`;
  }

  /**
   * A slim row above the tier header naming which region each block of
   * columns belongs to — only shown when a freight type actually splits
   * pricing by region (air does, sea doesn't yet).
   */
  renderGroupHead() {
    const { freightType } = this.props;
    const columns = RATE_COLUMNS[freightType === "sea" ? "sea" : "air"];
    const regions = RATE_REGIONS[freightType === "sea" ? "sea" : "air"] || [];
    if (regions.length < 2) return null;

    return (
      <div
        className="r1688-row r1688-row--group"
        style={{ gridTemplateColumns: this.gridTemplate() }}
      >
        <div />
        {regions.map((region) => {
          const span = columns.filter((c) => c.region === region.key).length;
          return (
            <div
              key={region.key}
              className={`r1688-group r1688-group--${region.key}`}
              style={{ gridColumn: `span ${span}` }}
            >
              {region.label}
            </div>
          );
        })}
        <div />
        <div />
      </div>
    );
  }

  renderHead() {
    const columns = RATE_COLUMNS[this.props.freightType === "sea" ? "sea" : "air"];
    return (
      <div
        className="r1688-row r1688-row--head"
        style={{ gridTemplateColumns: this.gridTemplate() }}
      >
        <div>Category</div>
        {columns.map((column) => (
          <div
            key={column.key}
            className={column.groupStart ? "r1688-cell--group-start" : ""}
            style={{ textAlign: "right" }}
          >
            {column.label}
          </div>
        ))}
        <div style={{ paddingLeft: 10 }}>Price from</div>
        <div />
      </div>
    );
  }

  render() {
    const { categories, loading, freightType } = this.props;
    const { query, filter } = this.state;
    const searching = query.trim().length > 0;
    const isWide = RATE_COLUMNS[freightType === "sea" ? "sea" : "air"].length > 4;

    const ownCount = categories.filter(
      (c) => effectiveSource(c, freightType) === "own"
    ).length;
    const unpricedCount = categories.filter(
      (c) => effectiveSource(c, freightType) === "none"
    ).length;

    // Filters flatten the list too — a matching sub-category must not be
    // hidden behind a parent that does not match.
    const isFlat = searching || filter !== "all";
    const hits = isFlat ? this.flatResults() : [];
    const rows = isFlat ? [] : this.treeRows();

    return (
      <div className="r1688">
        <div className="r1688-toolbar">
          <div className="r1688-search">
            <Search className="r1688-search__icon" />
            <input
              type="text"
              className="r1688-search__input"
              placeholder={`Search ${categories.length.toLocaleString()} categories by name or id\u2026`}
              value={query}
              onChange={(e) => this.setState({ query: e.target.value, focusId: null })}
            />
            {searching ? (
              <button
                type="button"
                className="r1688-search__clear"
                onClick={() => this.setState({ query: "" })}
                aria-label="Clear search"
              >
                <X />
              </button>
            ) : null}
          </div>

          <div className="r1688-filters">
            <button
              type="button"
              className={`r1688-chip${filter === "all" ? " is-active" : ""}`}
              onClick={() => this.setState({ filter: "all" })}
            >
              All
              <span className="r1688-chip__count">
                {categories.length.toLocaleString()}
              </span>
            </button>
            <button
              type="button"
              className={`r1688-chip${filter === "own" ? " is-active" : ""}`}
              onClick={() => this.setState({ filter: "own" })}
            >
              Own price
              <span className="r1688-chip__count">{ownCount.toLocaleString()}</span>
            </button>
            <button
              type="button"
              className={`r1688-chip${filter === "unpriced" ? " is-active" : ""}`}
              onClick={() => this.setState({ filter: "unpriced" })}
            >
              No price
              <span className="r1688-chip__count">
                {unpricedCount.toLocaleString()}
              </span>
            </button>
          </div>
        </div>

        <div className={`r1688-table${isWide ? " r1688-table--wide" : ""}`}>
          {this.renderGroupHead()}
          {this.renderHead()}

          {loading ? (
            <div className="r1688-state">
              <span className="r1688-spinner" />
              <span className="r1688-state__title">Loading categories</span>
              <p className="r1688-state__note">
                Reading the whole category tree so search stays instant.
              </p>
            </div>
          ) : null}

          {!loading && categories.length === 0 ? (
            <div className="r1688-state">
              <Folder />
              <span className="r1688-state__title">No categories yet</span>
              <p className="r1688-state__note">
                Run <code>scripts/import1688CategoryTree.js</code> to pull the
                category tree from 1688. Until then there is nothing to price.
              </p>
            </div>
          ) : null}

          {!loading && isFlat
            ? hits.slice(0, SEARCH_LIMIT).map((category) =>
                this.renderRow(category, {
                  flat: true,
                  breadcrumb:
                    (category.pathNames || []).length > 0
                      ? (category.pathNames || []).join("  \u203a  ")
                      : "Root category",
                })
              )
            : null}

          {!loading && isFlat && hits.length === 0 ? (
            <div className="r1688-state">
              <Search />
              <span className="r1688-state__title">
                {searching
                  ? `No category matches \u201c${query}\u201d`
                  : "Nothing in this filter"}
              </span>
              <p className="r1688-state__note">
                {searching
                  ? "Try a shorter word, or the category id. Search covers the English name, the Chinese name, and the id."
                  : "Every category in this view is priced through a parent. Switch back to All to browse the tree."}
              </p>
            </div>
          ) : null}

          {!loading && isFlat && hits.length > SEARCH_LIMIT ? (
            <div className="r1688-more">
              Showing the first {SEARCH_LIMIT} of {hits.length}
              {hits.length > SEARCH_LIMIT * 4 ? "+" : ""} matches — narrow it down
              to see the rest.
            </div>
          ) : null}

          {!loading && !isFlat
            ? rows.map((row) =>
                this.renderRow(row.category, {
                  depth: row.depth,
                  children: row.children,
                  isOpen: row.isOpen,
                })
              )
            : null}

        </div>
      </div>
    );
  }
}

export default CategoryExplorer;
