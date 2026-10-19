// FullPageLoader.jsx
import React from "react";
import "./fullPageLoader.css";

const FullPageLoader = ({ label = "Loading" }) => {
  return (
    <div className="fpl-overlay" role="status" aria-live="polite" aria-label={label}>
      <div className="fpl-scan">
        <div className="fpl-scan__glow" />
        <div className="fpl-scan__ring fpl-scan__ring--track" />
        <div className="fpl-scan__ring" />
        <div className="fpl-scan__core" />
      </div>
      <div className="fpl-label">
        <span>{label}</span>
        <span className="fpl-label__dot">.</span>
        <span className="fpl-label__dot">.</span>
        <span className="fpl-label__dot">.</span>
      </div>
    </div>
  );
};

export default FullPageLoader;
