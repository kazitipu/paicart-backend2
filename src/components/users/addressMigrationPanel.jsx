import React, { useState } from "react";
import { useSelector } from "react-redux";
import { MapPin, RotateCcw } from "react-feather";
import { showDialog } from "../common/appDialog.jsx";
import {
  migrateAddressBooksToPathao,
  previewAddressMigration,
  restoreLegacyAddresses,
} from "../../firebase/firebase.utils";

/* Admin-only: move every customer's pre-Pathao addresses (RedX-era, no
 * Pathao city / zone ids) out of their address book, so they must add a new
 * one with the Pathao picker. Old entries are kept as a backup in
 * `legacyAddressBook` on the same user and can be restored.
 * Run it only after the Pathao address picker is live on the website and
 * app — otherwise customers on the old form just add RedX addresses again. */
const AddressMigrationPanel = () => {
  const admin = useSelector((s) => s.admins && s.admins.currentAdmin);
  const [busy, setBusy] = useState("");
  if (!admin || admin.status !== "Admin") return null;

  const run = async () => {
    setBusy("preview");
    try {
      const p = await previewAddressMigration();
      setBusy("");
      if (!p.addresses) {
        showDialog({ tone: "success", title: "Nothing to move", message: `All ${p.kept} saved addresses already use Pathao locations.` });
        return;
      }
      const ok = window.confirm(
        `Move ${p.addresses} old address${p.addresses === 1 ? "" : "es"} out of ${p.usersAffected} customer${p.usersAffected === 1 ? "" : "s"}' address books?\n\n` +
          `They are kept as a backup on each customer (legacyAddressBook) and can be restored. ` +
          `${p.kept} address${p.kept === 1 ? "" : "es"} already using Pathao stay.\n\n` +
          "Only do this once the Pathao address picker is live on the website and app.",
      );
      if (!ok) return;
      setBusy("run");
      const r = await migrateAddressBooksToPathao();
      showDialog({
        tone: "success",
        title: "Old addresses removed",
        message: `${r.addresses} address${r.addresses === 1 ? "" : "es"} moved to backup for ${r.users} customer${r.users === 1 ? "" : "s"}. They'll be asked to add a new address with a Pathao delivery area.`,
      });
    } catch (e) {
      alert(e);
    } finally {
      setBusy("");
    }
  };

  const restore = async () => {
    if (!window.confirm("Put every backed-up (pre-Pathao) address back into customers' address books?")) return;
    setBusy("restore");
    try {
      const r = await restoreLegacyAddresses();
      showDialog({ tone: "success", title: "Addresses restored", message: `${r.addresses} address${r.addresses === 1 ? "" : "es"} restored for ${r.users} customer${r.users === 1 ? "" : "s"}.` });
    } catch (e) {
      alert(e);
    } finally {
      setBusy("");
    }
  };

  const btn = { display: "inline-flex", alignItems: "center", gap: 6, borderRadius: 9, padding: "7px 12px", fontSize: 12, fontWeight: 700, cursor: "pointer" };
  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 12, alignItems: "center", justifyContent: "space-between", background: "#fff7ed", border: "1px solid #fed7aa", borderRadius: 12, padding: "12px 16px", margin: "0 15px 16px" }}>
      <div style={{ display: "flex", gap: 10, alignItems: "flex-start", maxWidth: 720 }}>
        <MapPin size={18} color="#ea580c" style={{ flexShrink: 0, marginTop: 2 }} />
        <div>
          <div style={{ fontWeight: 800, color: "#9a3412", fontSize: 13 }}>Pathao delivery addresses</div>
          <div style={{ fontSize: 12, color: "#7c2d12" }}>
            Remove every customer's old (pre-Pathao) addresses so they must add one with a Pathao city / zone / area. Shows a dry run first; old
            addresses are kept as a backup and can be restored. Run only after the new address picker is live.
          </div>
        </div>
      </div>
      <div style={{ display: "flex", gap: 8 }}>
        <button type="button" onClick={restore} disabled={!!busy} style={{ ...btn, background: "#fff", color: "#334155", border: "1px solid #e2e8f0" }}>
          <RotateCcw size={13} /> {busy === "restore" ? "Restoring…" : "Restore"}
        </button>
        <button type="button" onClick={run} disabled={!!busy} style={{ ...btn, background: "#ea580c", color: "#fff", border: "1px solid #ea580c" }}>
          {busy === "preview" ? "Checking…" : busy === "run" ? "Moving…" : "Remove old addresses"}
        </button>
      </div>
    </div>
  );
};

export default AddressMigrationPanel;
