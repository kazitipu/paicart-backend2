import axios from "axios";
import jwt from "jsonwebtoken";
// Service account key file is gitignored; keep a local copy in src/firebase/
import serviceAccountKey from "./paicart-firebase-adminsdk-o3ae6-d93c2a1069.json";

export const sendNotifications = async (token, message) => {
  const serviceAccount = {
    client_email: serviceAccountKey.client_email,
    private_key: serviceAccountKey.private_key,
  };

  const now = Math.floor(Date.now() / 1000);
  const payload = {
    iss: serviceAccount.client_email,
    scope: "https://www.googleapis.com/auth/cloud-platform",
    aud: "https://oauth2.googleapis.com/token",
    exp: now + 3600,
    iat: now,
  };
  console.log(payload);

  const signedJwt = jwt.sign(payload, serviceAccount.private_key, {
    algorithm: "RS256",
  });
  console.log(signedJwt);
  // Request the access token
  const response = await axios.post(
    "https://oauth2.googleapis.com/token",
    new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion: signedJwt,
    }),
    {
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
    }
  );
  console.log(response);

  let access_token = response.data.access_token;
  console.log("send notification is called!");

  // var data = JSON.stringify({
  //   data: {},
  //   notification: {
  //     title: message.title,
  //     body: message.body,
  //   },
  //   // token
  //   to: `${token}`,
  // });
  console.log(access_token);
  var data = JSON.stringify({
    message: {
      token: `${token}`,
      notification: {
        title: message.title,
        body: message.body,
      },
    },
  });

  var config = {
    method: "post",
    url: "https://fcm.googleapis.com/v1/projects/paicart/messages:send",
    headers: {
      Authorization: "Bearer " + access_token,
      "Content-Type": "application/json; UTF-8",
    },
    data: data,
  };

  let response2 = await axios(config);
  console.log(response2);
};
