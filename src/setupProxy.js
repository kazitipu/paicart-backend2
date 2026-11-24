/* Dev-server bridge to the Pathao Courier merchant API.
 *
 * Pathao's API sends no Access-Control-Allow-Origin header, so the browser
 * cannot call it directly. create-react-app loads this file into the
 * `npm start` dev server automatically: the page calls /pathao-api/... on
 * localhost:3000 and this forwards the call to Pathao.
 *
 * The merchant credentials live in .env.local WITHOUT the REACT_APP_ prefix,
 * so they stay in this Node process and are never bundled into the page.
 * This file also issues and caches the access token.
 *
 * Only runs under `npm start`. The deployed site (Firebase Hosting) needs the
 * same three steps on the Node REST server before Pathao works there.
 */
const axios = require("axios");

const BASE_URL = (
  process.env.PATHAO_BASE_URL || "https://courier-api-sandbox.pathao.com"
).replace(/\/+$/, "");

/* Only the endpoints the admin screens use are forwarded. */
const ALLOWED = [
  { method: "GET", path: /^\/aladdin\/api\/v1\/stores$/ },
  { method: "GET", path: /^\/aladdin\/api\/v1\/city-list$/ },
  { method: "GET", path: /^\/aladdin\/api\/v1\/cities\/\d+\/zone-list$/ },
  { method: "GET", path: /^\/aladdin\/api\/v1\/zones\/\d+\/area-list$/ },
  { method: "POST", path: /^\/aladdin\/api\/v1\/orders$/ },
  { method: "POST", path: /^\/aladdin\/api\/v1\/merchant\/price-plan$/ },
  { method: "GET", path: /^\/aladdin\/api\/v1\/orders\/[\w-]+\/info$/ },
];

let cachedToken = null; // { value, expiresAt }

const missingCredentials = () =>
  [
    "PATHAO_CLIENT_ID",
    "PATHAO_CLIENT_SECRET",
    "PATHAO_USERNAME",
    "PATHAO_PASSWORD",
  ].filter((key) => !process.env[key]);

const getToken = async (forceRefresh) => {
  if (!forceRefresh && cachedToken && cachedToken.expiresAt > Date.now()) {
    return cachedToken.value;
  }
  const { data } = await axios.post(
    `${BASE_URL}/aladdin/api/v1/issue-token`,
    {
      client_id: process.env.PATHAO_CLIENT_ID,
      client_secret: process.env.PATHAO_CLIENT_SECRET,
      username: process.env.PATHAO_USERNAME,
      password: process.env.PATHAO_PASSWORD,
      grant_type: "password",
    },
    { headers: { "Content-Type": "application/json" }, timeout: 45000 },
  );
  if (!data || !data.access_token) {
    throw new Error("Pathao did not return an access token");
  }
  /* Renew a minute early so a request never goes out with a dying token. */
  const lifetimeMs = (Number(data.expires_in) || 3600) * 1000;
  cachedToken = {
    value: data.access_token,
    expiresAt: Date.now() + Math.max(lifetimeMs - 60000, 30000),
  };
  return cachedToken.value;
};

const readJsonBody = (req) =>
  new Promise((resolve, reject) => {
    let raw = "";
    req.on("data", (chunk) => {
      raw += chunk;
      if (raw.length > 1e6) reject(new Error("Request body too large"));
    });
    req.on("end", () => {
      if (!raw) return resolve(undefined);
      try {
        resolve(JSON.parse(raw));
      } catch (err) {
        reject(new Error("Request body is not valid JSON"));
      }
    });
    req.on("error", reject);
  });

const send = (res, status, body) => {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json");
  res.end(JSON.stringify(body));
};

/* Fraud check via the merchant-panel API (merchant.pathao.com).
 *
 * Pathao does not enable /aladdin/api/v1/user/success-rate for this merchant
 * account, so customer history comes from the same endpoint the merchant
 * website uses. It is unofficial: Pathao can change it without notice. It
 * logs in with PATHAO_USERNAME / PATHAO_PASSWORD (no client id/secret).
 */
const MERCHANT_PANEL = "https://merchant.pathao.com/api/v1";
let panelToken = null; // { value, expiresAt }

const getPanelToken = async (forceRefresh) => {
  if (!forceRefresh && panelToken && panelToken.expiresAt > Date.now()) {
    return panelToken.value;
  }
  const { data } = await axios.post(
    `${MERCHANT_PANEL}/login`,
    {
      username: process.env.PATHAO_USERNAME,
      password: process.env.PATHAO_PASSWORD,
    },
    {
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      timeout: 45000,
    },
  );
  const token = data && String(data.access_token || "").trim();
  if (!token) throw new Error("Pathao merchant login returned no token");
  const lifetimeMs = (Number(data.expires_in) || 3600) * 1000;
  panelToken = {
    value: token,
    expiresAt: Date.now() + Math.max(lifetimeMs - 60000, 30000),
  };
  return token;
};

const fraudCheck = async (req, res) => {
  if (!process.env.PATHAO_USERNAME || !process.env.PATHAO_PASSWORD) {
    return send(res, 500, {
      code: "PATHAO_NOT_CONFIGURED",
      message:
        "Add PATHAO_USERNAME and PATHAO_PASSWORD to .env.local and restart npm start.",
    });
  }
  let body;
  try {
    body = await readJsonBody(req);
  } catch (err) {
    return send(res, 400, { message: err.message });
  }
  const phone = body && String(body.phone || "");
  if (!/^01[3-9]\d{8}$/.test(phone)) {
    return send(res, 400, { message: "phone must be an 11-digit BD mobile" });
  }

  const lookup = async (forceRefresh) =>
    axios.post(
      `${MERCHANT_PANEL}/user/success`,
      { phone },
      {
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          Authorization: `Bearer ${await getPanelToken(forceRefresh)}`,
        },
        timeout: 45000,
        validateStatus: () => true,
      },
    );

  try {
    let response = await lookup(false);
    if (
      response.status === 401 ||
      (response.data && response.data.message === "Unauthorized!")
    ) {
      panelToken = null;
      response = await lookup(true);
    }
    send(res, response.status, response.data);
  } catch (err) {
    const status = (err.response && err.response.status) || 502;
    const message =
      (err.response && err.response.data && err.response.data.message) ||
      err.message ||
      "Could not reach Pathao";
    send(res, status, { code: "PATHAO_UNREACHABLE", message });
  }
};

/* Invoices (Pathao Payment tab) via the merchant-panel API — the same
 * endpoints merchant.pathao.com/courier/invoices uses, read-only:
 *   GET /pathao-api/merchant/invoices?page=&limit=   invoice list
 *   GET /pathao-api/merchant/invoices/:id/breakdown  parcels in an invoice
 *   GET /pathao-api/merchant/invoice-summary         lifetime / pending totals
 * Unofficial like the fraud check; logs in with PATHAO_USERNAME/PASSWORD. */
const MERCHANT_ROUTES = [
  { re: /^\/merchant\/invoices$/, to: () => "/monetary/invoices/receivable", query: ["page", "limit"] },
  { re: /^\/merchant\/invoices\/([A-Za-z0-9_-]+)\/breakdown$/, to: (m) => `/monetary/invoices/${m[1]}/breakdown`, query: ["page", "limit"] },
  { re: /^\/merchant\/invoice-summary$/, to: () => "/monetary/merchant/invoice-summary", query: [] },
];

const merchantPanelGet = async (req, res) => {
  if (!process.env.PATHAO_USERNAME || !process.env.PATHAO_PASSWORD) {
    return send(res, 500, {
      code: "PATHAO_NOT_CONFIGURED",
      message: "Add PATHAO_USERNAME and PATHAO_PASSWORD to .env.local and restart npm start.",
    });
  }
  const [pathOnly, qs] = req.url.split("?");
  let target = null;
  let allowed = [];
  for (const r of MERCHANT_ROUTES) {
    const m = pathOnly.match(r.re);
    if (m) {
      target = r.to(m);
      allowed = r.query;
      break;
    }
  }
  if (!target) return send(res, 404, { message: `Not allowed: ${pathOnly}` });
  const incoming = new URLSearchParams(qs || "");
  const params = {};
  allowed.forEach((k) => {
    const v = incoming.get(k);
    if (v !== null && /^\d{1,4}$/.test(v)) params[k] = v;
  });
  const call = async (forceRefresh) =>
    axios.get(`${MERCHANT_PANEL}${target}`, {
      params,
      headers: { Accept: "application/json", Authorization: `Bearer ${await getPanelToken(forceRefresh)}` },
      timeout: 45000,
      validateStatus: () => true,
    });
  try {
    let response = await call(false);
    if (response.status === 401 || (response.data && response.data.message === "Unauthorized!")) {
      panelToken = null;
      response = await call(true);
    }
    send(res, response.status, response.data);
  } catch (err) {
    send(res, (err.response && err.response.status) || 502, {
      code: "PATHAO_UNREACHABLE",
      message: (err.response && err.response.data && err.response.data.message) || err.message || "Could not reach Pathao",
    });
  }
};

module.exports = function setupProxy(app) {
  app.use("/pathao-api", async (req, res, next) => {
    if (req.method === "POST" && req.url.split("?")[0] === "/fraud-check") {
      return fraudCheck(req, res);
    }
    if (req.method === "GET" && req.url.startsWith("/merchant/")) {
      return merchantPanelGet(req, res);
    }
    return next();
  });

  app.use("/pathao-api", async (req, res) => {
    const path = req.url.split("?")[0];
    const rule = ALLOWED.find(
      (r) => r.method === req.method && r.path.test(path),
    );
    if (!rule) {
      return send(res, 404, { message: `Not allowed: ${req.method} ${path}` });
    }

    const missing = missingCredentials();
    if (missing.length > 0) {
      return send(res, 500, {
        code: "PATHAO_NOT_CONFIGURED",
        message: `Pathao is not configured. Add ${missing.join(", ")} to .env.local and restart npm start.`,
      });
    }

    let body;
    try {
      body = req.method === "GET" ? undefined : await readJsonBody(req);
    } catch (err) {
      return send(res, 400, { message: err.message });
    }

    const forward = async (forceRefresh) =>
      axios({
        method: req.method,
        url: `${BASE_URL}${req.url}`,
        data: body,
        timeout: 45000,
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          Authorization: `Bearer ${await getToken(forceRefresh)}`,
        },
        validateStatus: () => true,
      });

    try {
      let response = await forward(false);
      /* A token revoked early on Pathao's side: get a fresh one, retry once. */
      if (response.status === 401) {
        cachedToken = null;
        response = await forward(true);
      }
      send(res, response.status, response.data);
    } catch (err) {
      const status = (err.response && err.response.status) || 502;
      const message =
        (err.response && err.response.data && err.response.data.message) ||
        err.message ||
        "Could not reach Pathao";
      send(res, status, { code: "PATHAO_UNREACHABLE", message });
    }
  });
};
