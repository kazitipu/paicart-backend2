import React from "react";
import "./empty-state.css";

/**
 * Friendly placeholder for a list/table that has nothing to show.
 *
 *  icon        react-feather icon component drawn inside the badge
 *  accent      hex colour the whole illustration is tinted with
 *  title       one line headline
 *  message     one or two lines explaining why it is empty
 *  hint        optional smaller line under the action
 *  actionLabel + onAction render the pill button (both required to show it)
 */
const EmptyState = ({
  icon: Icon,
  accent = "#4466f2",
  title = "Nothing here yet",
  message = "",
  hint = "",
  actionLabel,
  onAction,
}) => (
  <div className="pc-empty" style={{ "--pc-empty-accent": accent }}>
    {/* ghost rows: a faded hint of the table that would have been here */}
    <div className="pc-empty-ghost" aria-hidden="true">
      <span className="pc-empty-ghost-row" />
      <span className="pc-empty-ghost-row" />
      <span className="pc-empty-ghost-row" />
    </div>

    <div className="pc-empty-art" aria-hidden="true">
      <span className="pc-empty-pulse" />
      <span className="pc-empty-badge">{Icon ? <Icon /> : null}</span>
      <span className="pc-empty-dot pc-empty-dot-a" />
      <span className="pc-empty-dot pc-empty-dot-b" />
      <span className="pc-empty-dot pc-empty-dot-c" />
    </div>

    <h5 className="pc-empty-title">{title}</h5>
    {message ? <p className="pc-empty-message">{message}</p> : null}

    {actionLabel && onAction ? (
      <button type="button" className="pc-empty-action" onClick={onAction}>
        {actionLabel}
      </button>
    ) : null}

    {hint ? <p className="pc-empty-hint">{hint}</p> : null}
  </div>
);

export default EmptyState;
