/* Orders, product requests and bookings store the customer's account id
 * (userId) — not the short customer number staff use (e.g. 794), nor their
 * phone. This index lets a search match those via the customer's profile. */

/* account id -> the profile fields worth searching */
export const buildCustomerIndex = (users) => {
  const index = {};
  (users || []).forEach((u) => {
    if (!u) return;
    const entry = {
      number: u.userId,
      name: u.displayName,
      phone: u.mobileNo,
      email: u.email,
    };
    if (u.id) index[u.id] = entry;
    if (u.uid) index[u.uid] = entry;
  });
  return index;
};

export const customerSearchFields = (index, userId) => {
  const c = index && userId ? index[userId] : null;
  return c ? [c.number, c.name, c.phone, c.email] : [];
};
