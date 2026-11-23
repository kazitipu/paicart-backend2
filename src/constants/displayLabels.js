/* Website orders used to be called "1688 Order(s)" in the admin. Older data
 * still stores that name (cash-in `category`, refund `subCategory`), and the
 * expense reports filter on the stored value — so the stored value stays and
 * only what admins read is renamed. */
const RENAMED = {
  "1688 Order": "Website Order",
  "1688 Orders": "Website Orders",
};

export const showLabel = (value) => RENAMED[value] || value;
