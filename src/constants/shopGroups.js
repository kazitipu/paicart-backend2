/* Which 1688 orders come from the same supplier (shop). One customer can
 * order several times from one shop, and several customers can order from
 * the same shop — both are worth buying together. shopId is the stable key;
 * shopName covers the few orders saved without one. */
export const shopKeyOf = (order) => (order && (order.shopId || order.shopName)) || "";

/* key -> { name, count, customers } over a list of orders */
export const buildShopGroups = (orders) => {
  const groups = {};
  (orders || []).forEach((order) => {
    const key = shopKeyOf(order);
    if (!key) return;
    const g = groups[key] || (groups[key] = { name: order.shopName || key, count: 0, users: {} });
    g.count += 1;
    g.users[order.userId || "guest"] = true;
  });
  Object.keys(groups).forEach((key) => {
    groups[key].customers = Object.keys(groups[key].users).length;
    delete groups[key].users;
  });
  return groups;
};

/* Same-shop orders next to each other, busiest shops first */
export const sortByShop = (orders, groups) =>
  orders.slice().sort((a, b) => {
    const ka = shopKeyOf(a);
    const kb = shopKeyOf(b);
    const ca = (groups[ka] && groups[ka].count) || 0;
    const cb = (groups[kb] && groups[kb].count) || 0;
    if (ca !== cb) return cb - ca;
    if (ka !== kb) return ka.localeCompare(kb);
    return (b.time || 0) - (a.time || 0);
  });
