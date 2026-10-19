import React, { Component, Fragment } from "react";
import { connect } from "react-redux";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { Layers, RotateCcw } from "react-feather";
import Breadcrumb from "../common/breadcrumb";
import CategoryExplorer, { DEFAULT_RATES, effectiveSource } from "./categoryExplorer";
import D2DRatesModal from "./d2dRatesModal";
import {
  getAll1688CategoriesRedux,
  set1688CategoryRatesRedux,
} from "../../actions/index";
import "./rates1688.css";

/**
 * 1688 rates, priced across the whole category tree.
 *
 * The page loads every category once so search and the tree both work without
 * further round trips. A price set on any category flows down to the
 * sub-categories that have none of their own; the ones that do keep theirs.
 */
export class D2DRates extends Component {
  state = { loading: true, editing: null, backfilling: false, backfillProgress: null };

  componentDidMount = async () => {
    if (this.props.categories.length === 0) {
      await this.props.getAll1688CategoriesRedux();
    }
    this.setState({ loading: false });
  };

  freightType() {
    const [freightType] = this.props.match.params.country.split("-");
    return freightType === "sea" ? "sea" : "air";
  }

  nameOf = (categoryId) => {
    const found = this.props.categories.find(
      (c) => String(c.categoryId) === String(categoryId)
    );
    return found ? found.translatedName : `#${categoryId}`;
  };

  handleEdit = (category) => this.setState({ editing: category });

  handleClose = () => this.setState({ editing: null });

  /**
   * Prices every root category with the standard rates in one pass. Each
   * root cascades to its own descendants exactly like a manual edit would —
   * anything already priced individually (root or descendant) is left
   * alone. Roots run one at a time so the progress readout stays honest.
   */
  handleBackfill = async () => {
    if (this.state.backfilling) return;

    const freightType = this.freightType();
    const defaults = DEFAULT_RATES[freightType];
    if (!defaults) return;

    const roots = this.props.categories.filter((c) => !c.parentCateId);
    if (roots.length === 0) {
      toast.error("No root categories to backfill yet.");
      return;
    }

    const summary = Object.entries(defaults)
      .map(([field, value]) => `${field}: ${value}`)
      .join(", ");
    if (
      !window.confirm(
        `Backfill all ${roots.length} root categories with the standard ${freightType} rates (${summary})?\n\n` +
          "This cascades to every sub-category that has no price of its own. Anything priced individually — root or sub-category — keeps its own price."
      )
    ) {
      return;
    }

    this.setState({
      backfilling: true,
      backfillProgress: { done: 0, total: roots.length },
    });

    let updated = 0;
    let kept = 0;
    let failed = 0;

    for (let i = 0; i < roots.length; i++) {
      const root = roots[i];
      try {
        const result = await this.props.set1688CategoryRatesRedux(
          root.categoryId,
          freightType,
          defaults
        );
        updated += result.updated;
        kept += result.kept;
      } catch (error) {
        failed += 1;
        console.error(`failed to backfill root category ${root.categoryId}`, error);
      }
      this.setState({ backfillProgress: { done: i + 1, total: roots.length } });
    }

    this.setState({ backfilling: false, backfillProgress: null });

    if (failed > 0) {
      toast.error(
        `Backfilled ${roots.length - failed} of ${roots.length} root categories — ${failed} failed. Check the console and retry.`
      );
    } else {
      toast.success(
        `Backfilled ${roots.length} root categories — ${updated.toLocaleString()} sub-categories now follow the default, ${kept.toLocaleString()} kept their own price.`
      );
    }
  };

  render() {
    const { categories, currentAdmin } = this.props;
    const { loading, editing, backfilling, backfillProgress } = this.state;
    const freightType = this.freightType();
    const canEdit = !(currentAdmin && currentAdmin.status === "Partner");
    const canBackfill = canEdit && Boolean(DEFAULT_RATES[freightType]);

    const priced = categories.filter(
      (c) => effectiveSource(c, freightType) === "own"
    ).length;
    // The editing target has to come from the store, not the click, so the row
    // reflects a cascade the moment it lands.
    const editingCategory = editing
      ? categories.find(
          (c) => String(c.categoryId) === String(editing.categoryId)
        ) || editing
      : null;

    return (
      <Fragment>
        <Breadcrumb title={freightType} parent="d2d-rates" />

        <div className="container-fluid r1688">
          <div className="row">
            <div className="col-sm-12">
              <div className="card">
                <div
                  className="card-header"
                  style={{
                    display: "flex",
                    flexDirection: "row",
                    justifyContent: "space-between",
                    alignItems: "center",
                    flexWrap: "wrap",
                    gap: "10px",
                  }}
                >
                  <h5 style={{ margin: 0, display: "flex", alignItems: "center" }}>
                    <Layers
                      style={{
                        width: 18,
                        height: 18,
                        marginRight: 8,
                        color: "#18768f",
                      }}
                    />
                    1688 rates
                    <span
                      style={{
                        color: "#f48110",
                        fontWeight: "bold",
                        marginLeft: 8,
                        textTransform: "uppercase",
                      }}
                    >
                      {freightType}
                    </span>
                  </h5>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "14px",
                      flexWrap: "wrap",
                    }}
                  >
                    <span
                      style={{
                        fontSize: "0.82rem",
                        color: "#6b8290",
                        fontFamily:
                          '"IBM Plex Mono", ui-monospace, SFMono-Regular, monospace',
                      }}
                    >
                      {categories.length.toLocaleString()} categories ·{" "}
                      {priced.toLocaleString()} priced directly
                    </span>

                    {canBackfill ? (
                      <button
                        type="button"
                        className="r1688-btn r1688-btn--backfill"
                        onClick={this.handleBackfill}
                        disabled={backfilling || loading}
                      >
                        {backfilling ? (
                          <span className="r1688-spinner" />
                        ) : (
                          <RotateCcw />
                        )}
                        {backfilling
                          ? `Backfilling ${backfillProgress.done}/${backfillProgress.total}…`
                          : "Backfill default rates"}
                      </button>
                    ) : null}
                  </div>
                </div>

                <div className="card-body">
                  <CategoryExplorer
                    categories={categories}
                    freightType={freightType}
                    loading={loading}
                    canEdit={canEdit}
                    onEdit={this.handleEdit}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {editingCategory ? (
          <D2DRatesModal
            category={editingCategory}
            categories={categories}
            freightType={freightType}
            nameOf={this.nameOf}
            onClose={this.handleClose}
          />
        ) : null}

        <ToastContainer />
      </Fragment>
    );
  }
}

const mapStateToProps = (state) => {
  return {
    categories: state.d2dRates.categories1688,
    currentAdmin: state.admins.currentAdmin,
  };
};

export default connect(mapStateToProps, {
  getAll1688CategoriesRedux,
  set1688CategoryRatesRedux,
})(D2DRates);
