import { getSingleUser } from "../../firebase/firebase.utils";
import { sendNotifications } from "../../firebase/fcmRestApi";

/* Push { title, body } to every device the customer is signed in on - the
 * same thing the single-item status modals do after saving. Never throws:
 * a missing user or token must not fail the status change itself. */
export const notifyCustomer = async (userId, message) => {
  if (!userId) return;
  try {
    const user = await getSingleUser(userId);
    const tokens = (user && user.deviceToken) || [];
    tokens.forEach((token) => sendNotifications(token, message));
  } catch (err) {
    console.log("notifyCustomer failed", err);
  }
};
