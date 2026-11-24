import React, { Component } from "react";

/* Type-to-search dropdown for Pathao city / zone / area (admin panel).
 *
 * Typing filters the list (names starting with the text first, then names
 * containing it); ↑ ↓ move, Enter picks, Esc closes. Enter never submits a
 * surrounding form. Styled by the caller through inputClassName /
 * inputStyle so it matches each form's own fields.
 *
 * Props: options [{ id, name }], value (id), onChange(id), placeholder,
 *        disabled, loading, inputClassName, inputStyle, ariaLabel. */

let seq = 0;

export default class SearchableSelect extends Component {
  state = { open: false, query: "", active: 0 };
  wrap = React.createRef();
  list = React.createRef();
  input = React.createRef();
  listId = `ss-list-${++seq}`;

  componentDidMount() {
    document.addEventListener("mousedown", this.onOutside);
  }

  componentWillUnmount() {
    document.removeEventListener("mousedown", this.onOutside);
  }

  componentDidUpdate(prevProps, prevState) {
    if (this.state.open && prevState.active !== this.state.active && this.list.current) {
      const el = this.list.current.children[this.state.active];
      if (el && el.scrollIntoView) el.scrollIntoView({ block: "nearest" });
    }
  }

  onOutside = (e) => {
    if (this.state.open && this.wrap.current && !this.wrap.current.contains(e.target)) this.setState({ open: false, query: "" });
  };

  filtered = () => {
    const { options = [] } = this.props;
    const q = this.state.query.trim().toLowerCase();
    if (!q) return options;
    const starts = [];
    const contains = [];
    options.forEach((o) => {
      const n = String(o.name || "").toLowerCase();
      if (n.startsWith(q)) starts.push(o);
      else if (n.includes(q)) contains.push(o);
    });
    return [...starts, ...contains];
  };

  pick = (o) => {
    this.props.onChange(o ? String(o.id) : "");
    this.setState({ open: false, query: "" });
    if (this.input.current) this.input.current.blur();
  };

  onKeyDown = (e) => {
    const list = this.filtered();
    if (e.key === "ArrowDown") {
      e.preventDefault();
      this.setState((st) => ({ open: true, active: Math.min(st.active + 1, Math.max(list.length - 1, 0)) }));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      this.setState((st) => ({ active: Math.max(st.active - 1, 0) }));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (this.state.open && list[this.state.active]) this.pick(list[this.state.active]);
      else this.setState({ open: true });
    } else if (e.key === "Escape" || e.key === "Tab") {
      this.setState({ open: false, query: "" });
    }
  };

  render() {
    const { options = [], value, placeholder = "Select…", disabled, loading, inputClassName, inputStyle, ariaLabel } = this.props;
    const { open, query, active } = this.state;
    const selected = options.find((o) => String(o.id) === String(value)) || null;
    const off = disabled || loading;
    const list = open && !off ? this.filtered() : [];
    return (
      <div ref={this.wrap} style={{ position: "relative", minWidth: 0 }}>
        <input
          ref={this.input}
          type="text"
          role="combobox"
          aria-label={ariaLabel}
          aria-expanded={open}
          aria-controls={this.listId}
          autoComplete="off"
          disabled={off}
          className={inputClassName}
          style={{ paddingRight: 26, ...(inputStyle || {}) }}
          value={open ? query : selected ? selected.name : ""}
          placeholder={loading ? "Loading…" : open && selected ? selected.name : placeholder}
          onFocus={() =>
            this.setState({ open: true, active: Math.max(0, options.findIndex((o) => String(o.id) === String(value))) })
          }
          onChange={(e) => this.setState({ query: e.target.value, open: true, active: 0 })}
          onKeyDown={this.onKeyDown}
        />
        <span
          aria-hidden="true"
          style={{ position: "absolute", right: 9, top: "50%", transform: `translateY(-50%) rotate(${open ? 180 : 0}deg)`, fontSize: 9, color: "#94a3b8", pointerEvents: "none", transition: "transform .15s" }}
        >
          ▼
        </span>
        {open && !off && (
          <ul
            ref={this.list}
            id={this.listId}
            role="listbox"
            style={{
              position: "absolute", zIndex: 1200, top: "calc(100% + 4px)", left: 0, minWidth: "100%", width: "max-content", maxWidth: 320,
              maxHeight: 240, overflowY: "auto", margin: 0, padding: "4px 0", listStyle: "none",
              background: "#fff", border: "1px solid #e2e8f0", borderRadius: 10, boxShadow: "0 12px 28px rgba(15,23,42,.14)", textAlign: "left",
            }}
          >
            {list.length ? (
              list.map((o, i) => {
                const isSel = String(o.id) === String(value);
                return (
                  <li
                    key={o.id}
                    role="option"
                    aria-selected={isSel}
                    onMouseDown={(e) => {
                      e.preventDefault();
                      this.pick(o);
                    }}
                    onMouseEnter={() => this.setState({ active: i })}
                    style={{
                      padding: "7px 12px", fontSize: 12.5, cursor: "pointer", whiteSpace: "normal",
                      background: i === active ? "#fff4ec" : "transparent",
                      color: i === active ? "#d9580d" : "#3e4c61", fontWeight: isSel ? 600 : 400,
                    }}
                  >
                    {o.name}
                    {isSel ? " ✓" : ""}
                  </li>
                );
              })
            ) : (
              <li style={{ padding: "7px 12px", fontSize: 12.5, color: "#94a3b8" }}>No match</li>
            )}
          </ul>
        )}
      </div>
    );
  }
}
