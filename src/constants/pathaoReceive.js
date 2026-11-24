/* Receiving a paid Pathao invoice into Paicart (Delivery → Pathao Payment).
 *
 * Each consignment in the invoice is matched to Paicart records:
 *   1. our own Pathao booking (pathaoDeliveries/{consignment}.items → the
 *      website orders / product requests / Ship For Me it carried), else
 *   2. Pathao's merchant_order_id, if it holds a Paicart order / booking id.
 * Its payout is spread over those records' dues in order; what is left once
 * they are fully paid is kept as an "extra" payment line (and cash-in) on the
 * first record. A consignment with no Paicart record goes to cash-in only.
 *
 * allocate() is pure — the same function runs for the preview and again
 * inside the Firestore transaction on fresh data (firebase.utils
 * receivePathaoInvoice), so what is written is what the rules say even if a
 * payment landed in between. */
import { getOrderPaid, getOrderPayable, getShipmentPayable } from "./paymentMath";

export const KIND_LABEL = { order: "Website Order", request: "Product Request", ship: "Ship For Me" };
export const CASH_IN_CATEGORY = { order: "1688 Order", request: "Product Request", ship: "Ship For Me", none: "Pathao" };
export const PATHAO_METHOD = "Pathao";

const num = (v) => {
  const n = parseFloat(v);
  return Number.isFinite(n) ? n : 0;
};
export const round2 = (v) => Math.round(num(v) * 100) / 100;

export const payableOf = (kind, record) => (kind === "ship" ? getShipmentPayable(record) : getOrderPayable(record));
export const recordIdOf = (kind, record) => (kind === "order" ? record.orderId : record.bookingId);

/* ids that look like Paicart order / booking ids inside a merchant_order_id
   ("MP-138855719035-394680-lq3x", "138855719035-C1-lq3x", "394680") */
export const idsInMerchantOrderId = (mid) =>
  Array.from(new Set(String(mid || "").split(/[^0-9]+/).filter((t) => t.length >= 6)));

/* consignments: [{ consignment_id, payout, … }] (Pathao breakdown)
   targetsOf(consignmentId) → [{ kind, record }]  (already loaded records)
   → [{ consignmentId, payout, merchantOrderId, lines: [{ kind, id, payable,
        paidBefore, apply, extra, stateAfter }], unmatched }] */
export const allocate = (consignments, targetsOf) => {
  /* the same record can appear in two consignments (split cartons) — keep
     a running "paid" per record */
  const paidSoFar = {};
  const keyOf = (kind, id) => `${kind}:${id}`;
  return consignments.map((c) => {
    const payout = round2(c.payout);
    const targets = targetsOf(String(c.consignment_id)) || [];
    /* a negative payout (return / delivery fee Pathao kept) is a cost to
       Paicart — an expense, never a payment on an order */
    if (payout < 0) {
      return {
        consignmentId: String(c.consignment_id),
        merchantOrderId: c.merchant_order_id || "",
        payout,
        lines: [],
        charge: true,
        unmatched: false,
        chargeFor: targets.map(({ kind, record }) => ({ kind, id: String(recordIdOf(kind, record)) })),
      };
    }
    if (!targets.length) {
      return { consignmentId: String(c.consignment_id), merchantOrderId: c.merchant_order_id || "", payout, lines: [], unmatched: true };
    }
    let remaining = payout;
    const lines = targets.map(({ kind, record }) => {
      const id = String(recordIdOf(kind, record));
      const k = keyOf(kind, id);
      const payable = round2(payableOf(kind, record));
      const paidBefore = paidSoFar[k] !== undefined ? paidSoFar[k] : round2(getOrderPaid(record));
      const due = Math.max(round2(payable - paidBefore), 0);
      const apply = round2(Math.min(due, remaining));
      remaining = round2(remaining - apply);
      paidSoFar[k] = round2(paidBefore + apply);
      return {
        kind,
        id,
        payable,
        paidBefore,
        apply,
        extra: 0,
        /* for the preview */
        customer: record.displayName || (record.deliveryAddress && record.deliveryAddress.name) || "",
        userCode: record.userId && String(record.userId).length < 10 ? record.userId : "",
      };
    });
    /* whatever is left after every due is covered stays on the first record */
    if (remaining > 0) {
      lines[0].extra = remaining;
      const k0 = keyOf(lines[0].kind, lines[0].id);
      paidSoFar[k0] = round2(paidSoFar[k0] + remaining);
    }
    lines.forEach((l) => {
      const after = paidSoFar[keyOf(l.kind, l.id)];
      l.stateAfter = after >= l.payable && l.payable > 0 ? "Paid" : after > 0 ? "Partially Paid" : "Not Paid";
    });
    return { consignmentId: String(c.consignment_id), merchantOrderId: c.merchant_order_id || "", payout, lines, unmatched: false };
  });
};

export const planTotals = (plan) =>
  plan.reduce(
    (a, p) => {
      a.payout = round2(a.payout + p.payout);
      if (p.unmatched) a.cashInOnly = round2(a.cashInOnly + p.payout);
      if (p.charge) a.charges = round2(a.charges + Math.abs(p.payout));
      p.lines.forEach((l) => {
        a.applied = round2(a.applied + l.apply);
        a.extra = round2(a.extra + l.extra);
      });
      return a;
    },
    { payout: 0, applied: 0, extra: 0, cashInOnly: 0, charges: 0 }
  );

/* one row per Paicart record across the whole invoice (a record can be in
   several consignments): before → after */
export const recordEffects = (plan) => {
  const map = {};
  plan.forEach((p) =>
    (p.lines || []).forEach((l) => {
      const k = `${l.kind}:${l.id}`;
      if (!map[k]) {
        map[k] = {
          kind: l.kind,
          id: l.id,
          customer: l.customer,
          userCode: l.userCode,
          payable: l.payable,
          paidBefore: l.paidBefore,
          apply: 0,
          extra: 0,
          consignments: [],
        };
      }
      map[k].apply = round2(map[k].apply + l.apply);
      map[k].extra = round2(map[k].extra + l.extra);
      map[k].stateAfter = l.stateAfter;
      if (!map[k].consignments.includes(p.consignmentId)) map[k].consignments.push(p.consignmentId);
    })
  );
  return Object.values(map).map((r) => {
    const paidAfter = round2(r.paidBefore + r.apply + r.extra);
    const stateOf = (paid) => (paid >= r.payable && r.payable > 0 ? "Paid" : paid > 0 ? "Partially Paid" : "Not Paid");
    return {
      ...r,
      dueBefore: Math.max(round2(r.payable - r.paidBefore), 0),
      paidAfter,
      dueAfter: Math.max(round2(r.payable - paidAfter), 0),
      stateBefore: stateOf(r.paidBefore),
      stateAfter: stateOf(paidAfter),
    };
  });
};

/* the cash-in / expense entries Receive will write (mirrors receivePathaoInvoice) */
export const ledgerEntries = (plan) => {
  const out = [];
  plan.forEach((p) => {
    if (p.charge) {
      out.push({ type: "Expense", category: "Pathao", amount: Math.abs(p.payout), what: `Pathao charge · ${p.consignmentId}` });
      return;
    }
    if (p.unmatched) {
      if (p.payout > 0) out.push({ type: "Cash in", category: CASH_IN_CATEGORY.none, amount: p.payout, what: `No Paicart order · ${p.consignmentId}` });
      return;
    }
    p.lines.forEach((l) => {
      if (l.apply > 0) out.push({ type: "Cash in", category: CASH_IN_CATEGORY[l.kind], amount: l.apply, what: `${KIND_LABEL[l.kind]} #${l.id} · ${p.consignmentId}` });
      if (l.extra > 0) out.push({ type: "Cash in", category: CASH_IN_CATEGORY[l.kind], amount: l.extra, what: `Extra over due · ${KIND_LABEL[l.kind]} #${l.id} · ${p.consignmentId}` });
    });
  });
  return out;
};
