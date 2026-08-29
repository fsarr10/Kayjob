import { createHash, pbkdf2Sync, randomBytes, randomInt, randomUUID } from "node:crypto";
import { createServer } from "node:http";
import { pathToFileURL } from "node:url";
import { pool } from "./db.mjs";
import { assertTransition, canDeliverFinal } from "./order-state.mjs";
import { redactContactContent } from "./message-safety.mjs";
import { signedDownload, signedUpload, streamObject, storageConfigured } from "./storage.mjs";

const port = Number(process.env.PORT || process.env.API_PORT || 4000);

function corsOrigin(req) {
  const origin = String(req.headers.origin || "");
  const allowed = String(process.env.CORS_ORIGIN || "https://kayjob.vercel.app")
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);
  if (!origin) return allowed[0] || "*";
  let originHost = "";
  try { originHost = new URL(origin).hostname; } catch { originHost = ""; }
  if (allowed.includes("*") || allowed.includes(origin) || /\.vercel\.app$/i.test(originHost)) return origin;
  return allowed[0] || origin;
}

const json = (res, status, body) => {
  res.writeHead(status, {
    "content-type": "application/json; charset=utf-8",
    "access-control-allow-origin": corsOrigin(res.req || {}),
    "access-control-allow-methods": "GET,POST,PUT,PATCH,DELETE,OPTIONS",
    "access-control-allow-headers": "content-type, authorization, x-user-id, x-client, x-provider-signature",
    "access-control-max-age": "600",
    "vary": "Origin"
  });
  res.end(JSON.stringify(body));
};
const readBody = (req) => new Promise((resolve, reject) => {
  let raw = "";
  req.on("data", (chunk) => { raw += chunk; if (raw.length > 1_000_000) reject(Object.assign(new Error("Payload too large"), { statusCode: 413 })); });
  req.on("end", () => { try { resolve(raw ? JSON.parse(raw) : {}); } catch { reject(Object.assign(new Error("Invalid JSON"), { statusCode: 400 })); } });
  req.on("error", reject);
});
const hash = (value) => createHash("sha256").update(value).digest("hex");
const safeFileName = (value) => String(value || "file").replace(/[^a-zA-Z0-9._-]/g, "-").slice(0, 100);
const cleanText = (value, max = 180) => String(value || "").trim().slice(0, max);

function cleanOptionalUrl(value) {
  const input = cleanText(value, 700);
  if (!input) return null;
  try {
    const url = new URL(input);
    if (!["http:", "https:"].includes(url.protocol)) throw new Error("Unsupported URL");
    return url.toString();
  } catch {
    throw Object.assign(new Error("URL invalide"), { statusCode: 422 });
  }
}

function cleanPseudo(value) {
  const pseudo = cleanText(value, 80).toLowerCase().replace(/[^a-z0-9_-]/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, "");
  if (!pseudo) return null;
  if (pseudo.length < 3) throw Object.assign(new Error("Le pseudo doit contenir au moins 3 caractères."), { statusCode: 422 });
  return pseudo;
}

function passwordHash(value) {
  const salt = randomBytes(16).toString("hex");
  const iterations = 120000;
  const derived = pbkdf2Sync(value, salt, iterations, 64, "sha256").toString("hex");
  return `pbkdf2_sha256$${iterations}$${salt}$${derived}`;
}

function verifyPassword(password, storedHash) {
  if (!storedHash) return false;
  const match = /^pbkdf2_sha256\$(\d+)\$([a-f0-9]+)\$([a-f0-9]+)$/.exec(storedHash);
  if (!match) return false;
  const [, iterations, salt, expectedHash] = match;
  const derived = pbkdf2Sync(password, salt, Number(iterations), 64, "sha256").toString("hex");
  return derived === expectedHash;
}

async function createAuthToken(user) {
  const token = randomUUID() + randomUUID();
  await pool.query("INSERT INTO auth_sessions (user_id, token_hash, device_name, expires_at) VALUES ($1, $2, $3, CURRENT_TIMESTAMP + INTERVAL '30 days')", [user.id, hash(token), "KayJob web"]);
  return token;
}

async function findUserByContact(contact) {
  const normalized = String(contact || "").trim();
  if (!normalized) return null;
  const isEmail = normalized.includes("@");
  const value = isEmail ? normalized.toLowerCase() : normalized;
  const column = isEmail ? "email" : "phone";
  const result = await pool.query(`SELECT id, full_name, email, phone, password_hash, role FROM users WHERE ${column} = $1 LIMIT 1`, [value]);
  return result.rowCount ? result.rows[0] : null;
}

async function signUp(body) {
  const contact = String(body.email || body.phone || "").trim();
  const password = String(body.password || "").trim();
  const fullName = String(body.fullName || "Nouveau membre").trim();
  const isEmail = Boolean(body.email);
  const key = isEmail ? String(body.email || "").trim().toLowerCase() : String(body.phone || "").trim();
  if (!contact || !password || password.length < 6) throw Object.assign(new Error("email or phone and password are required"), { statusCode: 422 });
  const existing = await findUserByContact(key);
  if (existing) {
    if (!existing.password_hash) {
      await pool.query(`UPDATE users SET full_name = $1, password_hash = $2 WHERE id = $3`, [fullName || "Nouveau membre", passwordHash(password), existing.id]);
      const refreshed = await findUserByContact(key);
      const token = await createAuthToken(refreshed);
      return { token, user: { id: refreshed.id, full_name: refreshed.full_name, email: refreshed.email, phone: refreshed.phone, role: refreshed.role || "both" } };
    }
    throw Object.assign(new Error("Account already exists. Please log in."), { statusCode: 409 });
  }
  const created = await pool.query(`INSERT INTO users (full_name, ${isEmail ? "email" : "phone"}, password_hash, role) VALUES ($1, $2, $3, 'both') RETURNING id, full_name, email, phone, role`, [fullName || "Nouveau membre", key, passwordHash(password)]);
  await pool.query("INSERT INTO wallets (user_id) VALUES ($1) ON CONFLICT (user_id) DO NOTHING", [created.rows[0].id]);
  const token = await createAuthToken(created.rows[0]);
  return { token, user: { id: created.rows[0].id, full_name: created.rows[0].full_name, email: created.rows[0].email, phone: created.rows[0].phone, role: created.rows[0].role || "both" } };
}

async function login(body) {
  const contact = String(body.email || body.phone || "").trim();
  const password = String(body.password || "").trim();
  if (!contact || !password || password.length < 6) throw Object.assign(new Error("email or phone and password are required"), { statusCode: 422 });
  const user = await findUserByContact(contact);
  if (!user) throw Object.assign(new Error("Account not found. Please sign up first."), { statusCode: 404 });
  if (!user.password_hash || !verifyPassword(password, user.password_hash)) throw Object.assign(new Error("Invalid credentials"), { statusCode: 401 });
  const token = await createAuthToken(user);
  return { token, user: { id: user.id, full_name: user.full_name, email: user.email, phone: user.phone, role: user.role || "both" } };
}

function senePayConfig() {
  const publicKey = process.env.SENE_PAY_PUBLIC_KEY;
  const secretKey = process.env.SENE_PAY_SECRET_KEY;
  if (!publicKey || !secretKey) return null;
  return {
    publicKey,
    secretKey,
    baseUrl: process.env.SENE_PAY_BASE_URL || "https://api.sene-pay.com",
    checkoutUrl: process.env.SENE_PAY_CHECKOUT_URL || "",
    webhookSecret: process.env.SENE_PAY_WEBHOOK_SECRET || secretKey
  };
}

function publicApiUrl(req) {
  return (process.env.PUBLIC_API_URL || `${req.headers["x-forwarded-proto"] || "http"}://${req.headers.host || "localhost"}`).replace(/\/$/, "");
}

async function requestOtp(body) {
  const channel = body.phone ? "phone" : body.email ? "email" : null;
  const destination = String(body.phone || body.email || "").trim().toLowerCase();
  if (!channel || !destination) throw Object.assign(new Error("phone or email is required"), { statusCode: 422 });
  const code = String(randomInt(100000, 1000000));
  await pool.query("INSERT INTO auth_challenges (channel, destination, code_hash, expires_at) VALUES ($1, $2, $3, CURRENT_TIMESTAMP + INTERVAL '10 minutes')", [channel, destination, hash(code)]);
  return process.env.NODE_ENV === "production" ? { channel, destination, expiresIn: 600 } : { channel, destination, expiresIn: 600, devCode: code };
}

async function verifyOtp(body) {
  const destination = String(body.phone || body.email || "").trim().toLowerCase();
  const code = String(body.code || "");
  if (!destination || !/^\d{6}$/.test(code)) throw Object.assign(new Error("destination and six digit code are required"), { statusCode: 422 });
  const db = await pool.connect();
  try {
    await db.query("BEGIN");
    const challenge = await db.query("SELECT id, channel, code_hash FROM auth_challenges WHERE destination = $1 AND consumed_at IS NULL AND expires_at > CURRENT_TIMESTAMP ORDER BY created_at DESC LIMIT 1 FOR UPDATE", [destination]);
    if (!challenge.rowCount || challenge.rows[0].code_hash !== hash(code)) throw Object.assign(new Error("Invalid or expired OTP"), { statusCode: 401 });
    await db.query("UPDATE auth_challenges SET consumed_at = CURRENT_TIMESTAMP WHERE id = $1", [challenge.rows[0].id]);
    const column = challenge.rows[0].channel === "phone" ? "phone" : "email";
    const existing = await db.query(`SELECT id, full_name, pseudo, verification_status FROM users WHERE ${column} = $1`, [destination]);
    let user;
    if (existing.rowCount) user = existing.rows[0];
    else {
      const created = await db.query(`INSERT INTO users (full_name, ${column}, role) VALUES ($1, $2, 'both') RETURNING id, full_name, pseudo, verification_status`, [body.fullName || "Nouveau membre", destination]);
      user = created.rows[0];
      await db.query("INSERT INTO wallets (user_id) VALUES ($1) ON CONFLICT (user_id) DO NOTHING", [user.id]);
    }
    const token = randomUUID() + randomUUID();
    await db.query("INSERT INTO auth_sessions (user_id, token_hash, device_name, expires_at) VALUES ($1, $2, $3, CURRENT_TIMESTAMP + INTERVAL '30 days')", [user.id, hash(token), body.deviceName || "KayJob mobile"]);
    await db.query("UPDATE users SET last_login_at = CURRENT_TIMESTAMP WHERE id = $1", [user.id]);
    await db.query("COMMIT");
    return { token, user };
  } catch (error) { await db.query("ROLLBACK"); throw error; } finally { db.release(); }
}

async function requestWithdrawal2fa(req, withdrawalId) {
  const userId = await authenticatedUserId(req);
  const code = String(randomInt(100000, 1000000));
  const result = await pool.query("SELECT id FROM withdrawal_requests WHERE id = $1 AND user_id = $2 AND status = 'pending_2fa'", [withdrawalId, userId]);
  if (!result.rowCount) throw Object.assign(new Error("Withdrawal not found"), { statusCode: 404 });
  await pool.query("INSERT INTO withdrawal_2fa_challenges (user_id, withdrawal_id, code_hash, expires_at) VALUES ($1, $2, $3, CURRENT_TIMESTAMP + INTERVAL '10 minutes')", [userId, withdrawalId, hash(code)]);
  return process.env.NODE_ENV === "production" ? { withdrawalId, expiresIn: 600 } : { withdrawalId, expiresIn: 600, devCode: code };
}

async function confirmWithdrawal2fa(req, withdrawalId, body) {
  const userId = await authenticatedUserId(req);
  const code = String(body.code || "");
  if (!/^\d{6}$/.test(code)) throw Object.assign(new Error("A six digit code is required"), { statusCode: 422 });
  const db = await pool.connect();
  try {
    await db.query("BEGIN");
    const challenge = await db.query("SELECT id, code_hash FROM withdrawal_2fa_challenges WHERE withdrawal_id = $1 AND user_id = $2 AND consumed_at IS NULL AND expires_at > CURRENT_TIMESTAMP ORDER BY created_at DESC LIMIT 1 FOR UPDATE", [withdrawalId, userId]);
    if (!challenge.rowCount || challenge.rows[0].code_hash !== hash(code)) throw Object.assign(new Error("Invalid or expired 2FA code"), { statusCode: 401 });
    await db.query("UPDATE withdrawal_2fa_challenges SET consumed_at = CURRENT_TIMESTAMP WHERE id = $1", [challenge.rows[0].id]);
    const withdrawal = await db.query("UPDATE withdrawal_requests SET status = 'pending_review' WHERE id = $1 AND user_id = $2 AND status = 'pending_2fa' RETURNING id, status, amount_xof", [withdrawalId, userId]);
    if (!withdrawal.rowCount) throw Object.assign(new Error("Withdrawal is no longer pending"), { statusCode: 409 });
    await db.query("COMMIT");
    return withdrawal.rows[0];
  } catch (error) { await db.query("ROLLBACK"); throw error; } finally { db.release(); }
}

async function authenticatedUserId(req) {
  const value = req.headers["x-user-id"];
  if (process.env.NODE_ENV !== "production" && value && /^\d+$/.test(value)) {
    const devUser = await pool.query("SELECT id FROM users WHERE id = $1 AND is_active = true", [Number(value)]);
    if (!devUser.rowCount) throw Object.assign(new Error("Invalid or disabled development user"), { statusCode: 401 });
    return Number(value);
  }
  const authorization = String(req.headers.authorization || "");
  const token = authorization.startsWith("Bearer ") ? authorization.slice(7).trim() : "";
  if (!token) throw Object.assign(new Error("Authentication required"), { statusCode: 401 });
  const result = await pool.query("SELECT s.user_id FROM auth_sessions s JOIN users u ON u.id = s.user_id WHERE s.token_hash = $1 AND s.revoked_at IS NULL AND s.expires_at > CURRENT_TIMESTAMP AND u.is_active = true", [hash(token)]);
  if (!result.rowCount) throw Object.assign(new Error("Invalid or expired session"), { statusCode: 401 });
  return result.rows[0].user_id;
}

async function authenticatedUser(req) {
  const userId = await authenticatedUserId(req);
  const result = await pool.query("SELECT id, full_name, email, phone, role, is_active, verification_status FROM users WHERE id = $1", [userId]);
  if (!result.rowCount || result.rows[0].is_active === false) throw Object.assign(new Error("Account disabled"), { statusCode: 403 });
  return result.rows[0];
}

async function resolveCityId(db, cityName) {
  const city = cleanText(cityName, 120);
  if (!city) return null;
  const existing = await db.query("SELECT id FROM cities WHERE lower(name) = lower($1) ORDER BY id LIMIT 1", [city]);
  if (existing.rowCount) return existing.rows[0].id;
  const created = await db.query("INSERT INTO cities (name) VALUES ($1) RETURNING id", [city]);
  return created.rows[0].id;
}

async function getAccount(userId) {
  const result = await pool.query(`SELECT u.id, u.full_name, u.pseudo, u.email, u.phone, u.avatar_url, u.can_sell, u.verification_status, u.role, ci.name AS city,
      sp.id AS profile_id, sp.headline, sp.bio, sp.availability, sp.sama_score
    FROM users u LEFT JOIN cities ci ON ci.id = u.city_id LEFT JOIN student_profiles sp ON sp.user_id = u.id
    WHERE u.id = $1`, [userId]);
  if (!result.rowCount) throw Object.assign(new Error("Account not found"), { statusCode: 404 });
  return result.rows[0];
}

async function updateAccount(req, body) {
  const userId = await authenticatedUserId(req);
  const db = await pool.connect();
  try {
    await db.query("BEGIN");
    const fullName = cleanText(body.fullName, 160);
    const pseudo = cleanPseudo(body.pseudo);
    const avatarUrl = cleanOptionalUrl(body.avatarUrl);
    const cityId = await resolveCityId(db, body.city);
    await db.query(`UPDATE users SET
      full_name = COALESCE(NULLIF($2, ''), full_name),
      pseudo = COALESCE($3, pseudo),
      avatar_url = $4,
      city_id = COALESCE($5, city_id)
      WHERE id = $1`, [userId, fullName, pseudo, avatarUrl, cityId]);

    const headline = cleanText(body.headline, 180);
    const bio = cleanText(body.bio, 2000);
    const availability = cleanText(body.availability, 120);
    if (headline || bio || availability) {
      await db.query(`INSERT INTO student_profiles (user_id, headline, bio, availability)
        VALUES ($1, COALESCE(NULLIF($2, ''), 'Profil KayJob'), COALESCE(NULLIF($3, ''), 'Disponible sur KayJob.'), NULLIF($4, ''))
        ON CONFLICT (user_id) DO UPDATE SET
          headline = COALESCE(NULLIF(EXCLUDED.headline, ''), student_profiles.headline),
          bio = COALESCE(NULLIF(EXCLUDED.bio, ''), student_profiles.bio),
          availability = COALESCE(EXCLUDED.availability, student_profiles.availability)`,
        [userId, headline, bio, availability]);
      await db.query("UPDATE users SET can_sell = true, role = CASE WHEN role = 'client' THEN 'both' ELSE role END WHERE id = $1", [userId]);
    }

    const account = await db.query(`SELECT u.id, u.full_name, u.pseudo, u.email, u.phone, u.avatar_url, u.can_sell, u.verification_status, u.role, ci.name AS city,
        sp.id AS profile_id, sp.headline, sp.bio, sp.availability, sp.sama_score
      FROM users u LEFT JOIN cities ci ON ci.id = u.city_id LEFT JOIN student_profiles sp ON sp.user_id = u.id
      WHERE u.id = $1`, [userId]);
    await db.query("COMMIT");
    return account.rows[0];
  } catch (error) {
    await db.query("ROLLBACK");
    if (error?.code === "23505") throw Object.assign(new Error("Ce pseudo est déjà utilisé."), { statusCode: 409 });
    throw error;
  } finally {
    db.release();
  }
}

async function requireAdmin(req) {
  const user = await authenticatedUser(req);
  if (user.role !== "admin") throw Object.assign(new Error("Admin role required"), { statusCode: 403 });
  return user;
}

async function releaseOrderToProvider(db, order, source, actorId = null) {
  const providerAmount = Number(order.amount_net_provider || order.net_amount || 0);
  const commissionAmount = Number(order.commission_amount || 0);
  if (!providerAmount || providerAmount <= 0) throw Object.assign(new Error("Invalid provider amount"), { statusCode: 409 });
  await db.query("UPDATE orders SET status = 'completed_released', review_deadline_at = CURRENT_TIMESTAMP, released_at = CURRENT_TIMESTAMP WHERE id = $1", [order.id]);
  await db.query("INSERT INTO wallets (user_id, available_xof) VALUES ($1, $2) ON CONFLICT (user_id) DO UPDATE SET available_xof = wallets.available_xof + EXCLUDED.available_xof, updated_at = CURRENT_TIMESTAMP", [order.provider_id, providerAmount]);
  await db.query(`INSERT INTO transactions (order_id, user_id, kind, direction, amount_xof, idempotency_key, metadata)
    VALUES ($1, $2, 'release', 'credit', $3, $4, $5::jsonb), ($1, $2, 'commission', 'debit', $6, $7, $8::jsonb)
    ON CONFLICT (idempotency_key) DO NOTHING`,
    [order.id, order.provider_id, providerAmount, `release:${order.id}`, JSON.stringify({ source, actorId }), commissionAmount, `commission:${order.id}`, JSON.stringify({ source, actorId })]);
}

async function createPaymentIntent(req, orderId) {
  const clientId = await authenticatedUserId(req);
  const provider = senePayConfig();
  if (!provider) throw Object.assign(new Error("SenePay is not configured. Set SENE_PAY_PUBLIC_KEY and SENE_PAY_SECRET_KEY before paying."), { statusCode: 503 });
  const db = await pool.connect();
  try {
    await db.query("BEGIN");
    const result = await db.query("SELECT id, client_id, status, amount_total, gross_amount, payment_reference FROM orders WHERE id = $1 AND client_id = $2 FOR UPDATE", [orderId, clientId]);
    if (!result.rowCount) throw Object.assign(new Error("Order not found"), { statusCode: 404 });
    const order = result.rows[0];
    if (!["awaiting_payment", "escrowed"].includes(order.status)) throw Object.assign(new Error("Order is not awaiting payment"), { statusCode: 409 });
    const amount = Number(order.amount_total || order.gross_amount || 0);
    if (!amount || amount <= 0) throw Object.assign(new Error("Invalid payment amount"), { statusCode: 409 });
    const reference = order.payment_reference || `KJ-${order.id}-${randomUUID().slice(0, 8)}`;
    await db.query("UPDATE orders SET payment_provider = 'senepay', payment_reference = $1 WHERE id = $2", [reference, order.id]);
    await db.query(`INSERT INTO payment_events (provider, provider_event_id, provider_reference, event_type, payload, signature_valid)
      VALUES ('senepay', $1, $2, 'payment.initiated', $3::jsonb, true)
      ON CONFLICT (provider, provider_event_id) DO NOTHING`, [`init:${reference}`, reference, JSON.stringify({ orderId: order.id, amount, currency: "XOF" })]);
    await db.query("COMMIT");

    const payload = {
      amount,
      currency: "XOF",
      reference,
      description: `Commande KayJob ${order.id}`,
      callbackUrl: process.env.PAYMENT_CALLBACK_URL || process.env.PUBLIC_WEB_URL || "",
      webhookUrl: `${publicApiUrl(req)}/api/webhooks/payments/senepay`
    };
    if (provider.checkoutUrl) {
      const response = await fetch(provider.checkoutUrl, {
        method: "POST",
        headers: { "content-type": "application/json", authorization: `Bearer ${provider.secretKey}` },
        body: JSON.stringify(payload)
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw Object.assign(new Error(data.error || data.message || "SenePay checkout failed"), { statusCode: 502 });
      return { provider: "senepay", reference, amountXof: amount, checkoutUrl: data.checkoutUrl || data.paymentUrl || data.url || null };
    }
    return { provider: "senepay", publicKey: provider.publicKey, baseUrl: provider.baseUrl, reference, amountXof: amount, mode: process.env.NODE_ENV === "production" ? "live" : "test", ready: true };
  } catch (error) { await db.query("ROLLBACK").catch(() => {}); throw error; } finally { db.release(); }
}

async function createOrder(req, body) {
  const clientId = await authenticatedUserId(req);
  if (!Number.isInteger(body.serviceId)) throw Object.assign(new Error("serviceId is required"), { statusCode: 422 });
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const service = await client.query("SELECT id, profile_id, starting_price FROM services WHERE id = $1 AND is_active = true", [body.serviceId]);
    if (!service.rowCount) throw Object.assign(new Error("Service not found"), { statusCode: 404 });
    const amount = body.amountTotal ?? service.rows[0].starting_price;
    if (!Number.isInteger(amount) || amount <= 0) throw Object.assign(new Error("Invalid amount"), { statusCode: 422 });
    const settings = await client.query("SELECT value FROM platform_settings WHERE key = 'commission'");
    const commissionSetting = settings.rows[0]?.value || { rate: 0.1, minimum_xof: 250 };
    const commission = Math.max(Number(commissionSetting.minimum_xof || 0), Math.round(amount * Number(commissionSetting.rate || 0)));
    const order = await client.query(`INSERT INTO orders (client_id, profile_id, service_id, status, gross_amount, commission_amount, net_amount, amount_total, amount_net_provider)
      VALUES ($1, $2, $3, 'awaiting_payment', $4, $5, $6, $4, $6) RETURNING id, status, amount_total, commission_amount, amount_net_provider`,
      [clientId, service.rows[0].profile_id, body.serviceId, amount, commission, amount - commission]);
    await client.query("COMMIT");
    return order.rows[0];
  } catch (error) { await client.query("ROLLBACK"); throw error; } finally { client.release(); }
}

async function createService(req, body) {
  const userId = await authenticatedUserId(req);
  const title = String(body.title || "").trim();
  const description = String(body.description || body.title || "").trim();
  const deliveryMode = String(body.deliveryMode || body.delivery_mode || "remote");
  const startingPrice = Number(body.startingPrice ?? body.starting_price ?? body.price);
  const deliveryDays = Number(body.deliveryDays ?? body.delivery_days ?? 3);
  const categoryName = String(body.category || "").trim();
  if (!title || !description || !["remote", "onsite", "both"].includes(deliveryMode) || !Number.isInteger(startingPrice) || startingPrice <= 0 || !Number.isInteger(deliveryDays) || deliveryDays <= 0) {
    throw Object.assign(new Error("title, description, deliveryMode, startingPrice and deliveryDays are required"), { statusCode: 422 });
  }
  const db = await pool.connect();
  try {
    await db.query("BEGIN");
    const profile = await db.query(`INSERT INTO student_profiles (user_id, headline, bio, availability)
      VALUES ($1, $2, $3, $4)
      ON CONFLICT (user_id) DO UPDATE SET headline = COALESCE(student_profiles.headline, EXCLUDED.headline)
      RETURNING id`, [userId, title, description, body.availability || "Disponible"]);
    await db.query("UPDATE users SET can_sell = true, role = CASE WHEN role = 'client' THEN 'both' ELSE role END WHERE id = $1", [userId]);
    let categoryId = body.categoryId || body.category_id || null;
    if (!categoryId && categoryName) {
      const category = await db.query("INSERT INTO categories (name) VALUES ($1) ON CONFLICT (name) DO UPDATE SET name = EXCLUDED.name RETURNING id", [categoryName]);
      categoryId = category.rows[0].id;
    }
    const saved = await db.query(`INSERT INTO services (profile_id, category_id, title, description, delivery_mode, starting_price, delivery_days)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING id, title, description, delivery_mode, starting_price, delivery_days`, [profile.rows[0].id, categoryId, title, description, deliveryMode, startingPrice, deliveryDays]);
    await db.query("COMMIT");
    return saved.rows[0];
  } catch (error) { await db.query("ROLLBACK"); throw error; } finally { db.release(); }
}

async function paymentWebhook(req, provider, body) {
  if (provider !== "senepay") throw Object.assign(new Error("Unsupported payment provider"), { statusCode: 400 });
  const signature = req.headers["x-provider-signature"];
  const envSecret = process.env.SENE_PAY_WEBHOOK_SECRET || process.env.SENE_PAY_SECRET_KEY;
  if (!signature || process.env.NODE_ENV === "production" && signature !== envSecret) {
    throw Object.assign(new Error("Invalid webhook signature"), { statusCode: 401 });
  }
  const eventId = body.eventId || body.id || body.reference;
  const orderId = Number(body.orderId);
  const reference = body.reference || body.transactionId;
  if (!eventId || !Number.isInteger(orderId) || !reference) throw Object.assign(new Error("Invalid payment event"), { statusCode: 422 });
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const inserted = await client.query(`INSERT INTO payment_events (provider, provider_event_id, provider_reference, event_type, payload, signature_valid)
      VALUES ($1, $2, $3, $4, $5, true) ON CONFLICT (provider, provider_event_id) DO NOTHING RETURNING id`,
      [provider, String(eventId), String(reference), body.status || "payment.succeeded", body]);
    if (!inserted.rowCount) { await client.query("ROLLBACK"); return { duplicate: true }; }
    const orderResult = await client.query("SELECT id, status, amount_total, gross_amount FROM orders WHERE id = $1 FOR UPDATE", [orderId]);
    if (!orderResult.rowCount) throw Object.assign(new Error("Order not found"), { statusCode: 404 });
    const order = orderResult.rows[0];
    assertTransition(order.status, "escrowed");
    if (Number(body.amount) !== Number(order.amount_total || order.gross_amount)) throw Object.assign(new Error("Payment amount mismatch"), { statusCode: 409 });
    await client.query(`UPDATE orders SET status = 'escrowed', payment_provider = $1, payment_reference = $2, held_at = CURRENT_TIMESTAMP WHERE id = $3`, [provider, reference, orderId]);
    await client.query(`INSERT INTO transactions (order_id, user_id, kind, direction, amount_xof, provider, provider_reference, idempotency_key, metadata)
      SELECT id, client_id, 'hold', 'credit', COALESCE(amount_total, gross_amount), $1, $2, $3, $4::jsonb FROM orders WHERE id = $5`,
      [provider, reference, `hold:${provider}:${reference}`, JSON.stringify({ eventId }), orderId]);
    await client.query("UPDATE payment_events SET processed_at = CURRENT_TIMESTAMP WHERE id = $1", [inserted.rows[0].id]);
    await client.query("COMMIT");
    return { orderId, status: "escrowed" };
  } catch (error) { await client.query("ROLLBACK"); throw error; } finally { client.release(); }
}

export async function route(req, res) {
  const url = new URL(req.url, `http://${req.headers.host || "localhost"}`);
  const path = url.pathname;
  if (req.method === "OPTIONS") return json(res, 204, {});
  if (req.method === "GET" && path === "/health") return json(res, 200, { ok: true, service: "kayjob-api" });
  if (req.method === "GET" && path === "/api/storage/status") { await authenticatedUserId(req); return json(res, 200, { data: { provider: "cloudflare-r2", configured: storageConfigured(), bucketPrivate: true, signedUploads: true, signedDownloads: true } }); }
  if (req.method === "POST" && path === "/api/auth/signup") return json(res, 201, { data: await signUp(await readBody(req)) });
  if (req.method === "POST" && path === "/api/auth/login") return json(res, 200, { data: await login(await readBody(req)) });
  if (req.method === "POST" && path === "/api/auth/request-otp") return json(res, 200, { data: await requestOtp(await readBody(req)) });
  if (req.method === "POST" && path === "/api/auth/verify-otp") return json(res, 200, { data: await verifyOtp(await readBody(req)) });
  if (req.method === "GET" && path === "/api/me/account") return json(res, 200, { data: await getAccount(await authenticatedUserId(req)) });
  if (req.method === "PATCH" && path === "/api/me/account") return json(res, 200, { data: await updateAccount(req, await readBody(req)) });
  if (req.method === "GET" && path === "/api/services") {
    const result = await pool.query(`SELECT s.id, s.title, s.description, s.delivery_mode, s.starting_price, sp.sama_score, u.id AS user_id, u.full_name, u.pseudo, u.avatar_url, u.verification_status, c.name AS category, ci.name AS city, COALESCE(portfolio.items, '[]'::jsonb) AS portfolio
      FROM services s JOIN student_profiles sp ON sp.id = s.profile_id JOIN users u ON u.id = sp.user_id LEFT JOIN categories c ON c.id = s.category_id LEFT JOIN cities ci ON ci.id = u.city_id
      LEFT JOIN LATERAL (
        SELECT jsonb_agg(jsonb_build_object('id', pi.id, 'title', pi.title, 'description', pi.description, 'media_url', pi.media_url, 'external_url', pi.external_url, 'item_type', pi.item_type, 'created_at', pi.created_at) ORDER BY pi.created_at DESC) AS items
        FROM portfolio_items pi WHERE pi.profile_id = sp.id
      ) portfolio ON true
      WHERE s.is_active = true AND u.is_active = true ORDER BY sp.sama_score DESC, s.starting_price ASC`);
    return json(res, 200, { data: result.rows });
  }
  if (req.method === "POST" && path === "/api/uploads/presign") {
    const ownerId = await authenticatedUserId(req); const body = await readBody(req);
    const contentType = String(body.contentType || "application/octet-stream");
    const allowed = /^(image\/(jpeg|png|webp|gif)|video\/(mp4|quicktime)|application\/pdf|text\/plain)$/i.test(contentType);
    if (!allowed || !body.fileName || !["portfolio", "preview", "final", "dispute"].includes(body.purpose)) throw Object.assign(new Error("Unsupported file or purpose"), { statusCode: 422 });
    const key = `${body.purpose}/${ownerId}/${randomUUID()}-${safeFileName(body.fileName)}`;
    return json(res, 200, { data: { key, contentType, expiresIn: 900, uploadUrl: await signedUpload(key, contentType) } });
  }
  const profile = path.match(/^\/api\/profiles\/([a-z0-9_-]+)$/i);
	  if (req.method === "GET" && profile) {
    const result = await pool.query(`SELECT u.id, u.full_name, u.pseudo, u.avatar_url, u.verification_status, ci.name AS city, sp.headline, sp.bio, sp.availability, sp.sama_score
      FROM users u LEFT JOIN cities ci ON ci.id = u.city_id LEFT JOIN student_profiles sp ON sp.user_id = u.id WHERE lower(u.pseudo) = lower($1) AND u.is_active = true`, [profile[1]]);
    if (!result.rowCount) return json(res, 404, { error: "Profile not found" });
    const user = result.rows[0];
    const [services, portfolio, reviews] = await Promise.all([
      pool.query("SELECT id, title, description, delivery_mode, starting_price, delivery_days FROM services WHERE profile_id = (SELECT id FROM student_profiles WHERE user_id = $1) AND is_active = true", [user.id]),
      pool.query("SELECT id, title, description, media_url, external_url, item_type, created_at FROM portfolio_items WHERE profile_id = (SELECT id FROM student_profiles WHERE user_id = $1) ORDER BY created_at DESC", [user.id]),
      pool.query("SELECT r.rating, r.comment, r.created_at, u.full_name AS reviewer FROM reviews r JOIN users u ON u.id = r.reviewer_id WHERE r.reviewee_id = $1 ORDER BY r.created_at DESC", [user.id])
    ]);
	    return json(res, 200, { data: { ...user, services: services.rows, portfolio: portfolio.rows, reviews: reviews.rows } });
	  }
  if (req.method === "GET" && path === "/api/me/portfolio") {
    const currentUser = await authenticatedUserId(req);
    const result = await pool.query(`SELECT u.id, u.full_name, u.pseudo, u.avatar_url, u.verification_status, ci.name AS city, sp.id AS profile_id, sp.headline, sp.bio, sp.availability, sp.sama_score
      FROM users u LEFT JOIN cities ci ON ci.id = u.city_id LEFT JOIN student_profiles sp ON sp.user_id = u.id WHERE u.id = $1`, [currentUser]);
    if (!result.rowCount) return json(res, 404, { error: "Profile not found" });
    const user = result.rows[0];
    const [services, portfolio, reviews] = await Promise.all([
      pool.query("SELECT id, title, description, delivery_mode, starting_price, delivery_days FROM services WHERE profile_id = $1 AND is_active = true ORDER BY id DESC", [user.profile_id]),
      pool.query("SELECT id, title, description, media_url, external_url, item_type, created_at FROM portfolio_items WHERE profile_id = $1 ORDER BY created_at DESC", [user.profile_id]),
      pool.query("SELECT r.rating, r.comment, r.created_at, reviewer.full_name AS reviewer FROM reviews r JOIN users reviewer ON reviewer.id = r.reviewer_id WHERE r.reviewee_id = $1 ORDER BY r.created_at DESC", [currentUser])
    ]);
    return json(res, 200, { data: { ...user, services: services.rows, portfolio: portfolio.rows, reviews: reviews.rows } });
  }
	  if (req.method === "POST" && path === "/api/me/portfolio") {
    const currentUser = await authenticatedUserId(req); const body = await readBody(req);
    if (!body.title || !body.itemType) throw Object.assign(new Error("title and itemType are required"), { statusCode: 422 });
    const saved = await pool.query(`INSERT INTO portfolio_items (profile_id, title, description, media_url, external_url, item_type)
      SELECT id, $2, $3, $4, $5, $6 FROM student_profiles WHERE user_id = $1 RETURNING id, title, description, media_url, external_url, item_type`, [currentUser, body.title, body.description || null, body.mediaUrl || null, body.externalUrl || null, body.itemType]);
    if (!saved.rowCount) return json(res, 409, { error: "Student profile required" });
    return json(res, 201, { data: saved.rows[0] });
  }
  if (req.method === "POST" && path === "/api/me/profile") {
    const currentUser = await authenticatedUserId(req); const body = await readBody(req);
    if (!body.headline || !body.bio) throw Object.assign(new Error("headline and bio are required"), { statusCode: 422 });
    const saved = await pool.query(`INSERT INTO student_profiles (user_id, headline, bio, availability)
      VALUES ($1, $2, $3, $4) ON CONFLICT (user_id) DO UPDATE SET headline = EXCLUDED.headline, bio = EXCLUDED.bio, availability = EXCLUDED.availability
      RETURNING id, user_id, headline, bio, availability, sama_score`, [currentUser, body.headline, body.bio, body.availability || null]);
    await pool.query("UPDATE users SET can_sell = true, role = CASE WHEN role = 'client' THEN 'both' ELSE role END WHERE id = $1", [currentUser]);
    return json(res, 200, { data: saved.rows[0] });
  }
  if (req.method === "POST" && path === "/api/me/services") return json(res, 201, { data: await createService(req, await readBody(req)) });
  if (req.method === "GET" && path === "/api/missions") {
    const result = await pool.query(`SELECT m.id, m.title, m.description, m.delivery_mode, m.budget_max, m.is_open, u.full_name AS client_name, c.name AS category, ci.name AS city, COUNT(o.id)::int AS offers
      FROM missions m JOIN users u ON u.id = m.client_id LEFT JOIN categories c ON c.id = m.category_id LEFT JOIN cities ci ON ci.id = m.city_id LEFT JOIN offers o ON o.mission_id = m.id
      WHERE m.is_open = true AND u.is_active = true GROUP BY m.id, u.full_name, c.name, ci.name ORDER BY m.id DESC`);
    return json(res, 200, { data: result.rows });
  }
  if (req.method === "POST" && path === "/api/missions") {
    const clientId = await authenticatedUserId(req); const body = await readBody(req);
    if (!body.title || !body.description || !Number.isInteger(body.budgetMax) || !body.deliveryMode) throw Object.assign(new Error("title, description, budgetMax and deliveryMode are required"), { statusCode: 422 });
    const created = await pool.query(`INSERT INTO missions (client_id, category_id, city_id, title, description, delivery_mode, budget_max) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id, title, delivery_mode, budget_max, is_open`, [clientId, body.categoryId || null, body.cityId || null, body.title, body.description, body.deliveryMode, body.budgetMax]);
    return json(res, 201, { data: created.rows[0] });
  }
  const offer = path.match(/^\/api\/missions\/(\d+)\/offers$/);
  if (req.method === "POST" && offer) {
    const providerId = await authenticatedUserId(req); const body = await readBody(req);
    if (!Number.isInteger(body.amountXof) || !Number.isInteger(body.deliveryDays) || !body.message) throw Object.assign(new Error("amountXof, deliveryDays and message are required"), { statusCode: 422 });
    const created = await pool.query(`INSERT INTO offers (mission_id, provider_id, amount_xof, delivery_days, message) VALUES ($1, $2, $3, $4, $5) RETURNING id, mission_id, amount_xof, delivery_days, status`, [Number(offer[1]), providerId, body.amountXof, body.deliveryDays, body.message]);
    return json(res, 201, { data: created.rows[0] });
  }
  if (req.method === "GET" && path === "/api/me/orders") {
    const currentUser = await authenticatedUserId(req);
    const result = await pool.query(`SELECT o.id, o.status, o.amount_total, o.commission_amount, o.amount_net_provider, s.title FROM orders o LEFT JOIN services s ON s.id = o.service_id WHERE o.client_id = $1 OR o.profile_id IN (SELECT id FROM student_profiles WHERE user_id = $1) ORDER BY o.id DESC`, [currentUser]);
    return json(res, 200, { data: result.rows });
  }
  if (req.method === "GET" && path === "/api/me/notifications") {
    const currentUser = await authenticatedUserId(req); const result = await pool.query("SELECT id, type, title, body, read_at, created_at FROM notifications WHERE user_id = $1 ORDER BY created_at DESC LIMIT 50", [currentUser]);
    return json(res, 200, { data: result.rows });
  }
  const notification = path.match(/^\/api\/notifications\/(\d+)\/read$/);
  if (req.method === "POST" && notification) {
    const currentUser = await authenticatedUserId(req); const result = await pool.query("UPDATE notifications SET read_at = CURRENT_TIMESTAMP WHERE id = $1 AND user_id = $2 RETURNING id, read_at", [Number(notification[1]), currentUser]);
    if (!result.rowCount) return json(res, 404, { error: "Notification not found" });
    return json(res, 200, { data: result.rows[0] });
  }
  if (req.method === "POST" && path === "/api/orders") return json(res, 201, { data: await createOrder(req, await readBody(req)) });
  const webhook = path.match(/^\/api\/webhooks\/payments\/(senepay)$/);
  if (req.method === "POST" && webhook) return json(res, 200, { data: await paymentWebhook(req, webhook[1], await readBody(req)) });
	  const payment = path.match(/^\/api\/orders\/(\d+)\/pay$/);
	  if (req.method === "POST" && payment) {
	    return json(res, 200, { data: await createPaymentIntent(req, Number(payment[1])) });
	  }
  const finalDelivery = path.match(/^\/api\/orders\/(\d+)\/deliver-final$/);
  if (req.method === "POST" && finalDelivery) {
    const providerId = await authenticatedUserId(req);
    const body = await readBody(req);
    if (!body.storageKey || typeof body.storageKey !== "string") throw Object.assign(new Error("Private storage key is required"), { statusCode: 422 });
    const client = await pool.connect();
    try {
      await client.query("BEGIN");
      const order = await client.query(`SELECT o.id, o.status FROM orders o JOIN student_profiles sp ON sp.id = o.profile_id WHERE o.id = $1 AND sp.user_id = $2 FOR UPDATE`, [Number(finalDelivery[1]), providerId]);
      if (!order.rowCount) return json(res, 404, { error: "Order not found" });
      if (!canDeliverFinal(order.rows[0].status)) return json(res, 409, { error: "Final delivery requires a verified held payment", status: order.rows[0].status });
      await client.query(`INSERT INTO delivery_files (order_id, uploader_id, kind, original_storage_key, mime_type, size_bytes)
        VALUES ($1, $2, 'final', $3, $4, $5)`, [Number(finalDelivery[1]), providerId, body.storageKey, body.mimeType || "application/octet-stream", Number(body.sizeBytes || 1)]);
      await client.query("UPDATE orders SET status = 'final_delivered', delivered_at = CURRENT_TIMESTAMP WHERE id = $1", [Number(finalDelivery[1])]);
      await client.query("COMMIT");
      return json(res, 201, { data: { orderId: Number(finalDelivery[1]), status: "final_delivered" } });
    } catch (error) { await client.query("ROLLBACK"); throw error; } finally { client.release(); }
  }
  const validate = path.match(/^\/api\/orders\/(\d+)\/validate$/);
  if (req.method === "POST" && validate) {
    const clientId = await authenticatedUserId(req); const db = await pool.connect();
    try {
      await db.query("BEGIN");
      const result = await db.query(`SELECT o.*, sp.user_id AS provider_id FROM orders o JOIN student_profiles sp ON sp.id = o.profile_id WHERE o.id = $1 AND o.client_id = $2 FOR UPDATE`, [Number(validate[1]), clientId]);
      if (!result.rowCount) throw Object.assign(new Error("Order not found"), { statusCode: 404 });
      const order = result.rows[0];
      assertTransition(order.status, "client_review");
      assertTransition("client_review", "completed_released");
	      await releaseOrderToProvider(db, order, "client_validation", clientId);
	      await db.query("COMMIT");
      return json(res, 200, { data: { orderId: order.id, status: "completed_released" } });
    } catch (error) { await db.query("ROLLBACK"); throw error; } finally { db.release(); }
  }
  const dispute = path.match(/^\/api\/orders\/(\d+)\/dispute$/);
  if (req.method === "POST" && dispute) {
    const openedBy = await authenticatedUserId(req); const body = await readBody(req);
    if (!String(body.reason || "").trim()) throw Object.assign(new Error("Dispute reason is required"), { statusCode: 422 });
    const db = await pool.connect();
    try {
      await db.query("BEGIN");
      const result = await db.query("SELECT id, status FROM orders WHERE id = $1 AND (client_id = $2 OR profile_id IN (SELECT id FROM student_profiles WHERE user_id = $2)) FOR UPDATE", [Number(dispute[1]), openedBy]);
      if (!result.rowCount) throw Object.assign(new Error("Order not found"), { statusCode: 404 });
      assertTransition(result.rows[0].status, "dispute_opened");
      await db.query("UPDATE orders SET status = 'dispute_opened' WHERE id = $1", [Number(dispute[1])]);
      const saved = await db.query("INSERT INTO disputes (order_id, opened_by, reason) VALUES ($1, $2, $3) RETURNING id, status", [Number(dispute[1]), openedBy, String(body.reason).trim()]);
      await db.query("COMMIT");
      return json(res, 201, { data: saved.rows[0] });
    } catch (error) { await db.query("ROLLBACK"); throw error; } finally { db.release(); }
  }
  const review = path.match(/^\/api\/orders\/(\d+)\/review$/);
  if (req.method === "POST" && review) {
    const reviewerId = await authenticatedUserId(req); const body = await readBody(req);
    if (!Number.isInteger(body.rating) || body.rating < 1 || body.rating > 5) throw Object.assign(new Error("rating must be between 1 and 5"), { statusCode: 422 });
    const saved = await pool.query(`INSERT INTO reviews (order_id, reviewer_id, reviewee_id, rating, comment)
      SELECT o.id, $2, sp.user_id, $3, $4 FROM orders o JOIN student_profiles sp ON sp.id = o.profile_id
      WHERE o.id = $1 AND o.client_id = $2 AND o.status = 'completed_released' RETURNING id, rating, comment`, [Number(review[1]), reviewerId, body.rating, body.comment || null]);
    if (!saved.rowCount) return json(res, 409, { error: "Only the client of a released order can review" });
    return json(res, 201, { data: saved.rows[0] });
  }
	  if (req.method === "GET" && path === "/api/admin/overview") {
	    await requireAdmin(req);
	    const [users, orders, disputes, volume] = await Promise.all([
	      pool.query("SELECT count(*)::int AS count FROM users"),
      pool.query("SELECT status, count(*)::int AS count FROM orders GROUP BY status ORDER BY status"),
      pool.query("SELECT count(*)::int AS count FROM disputes WHERE status = 'open'"),
      pool.query("SELECT COALESCE(sum(amount_xof), 0)::int AS total_xof FROM transactions WHERE kind = 'hold'")
    ]);
	    return json(res, 200, { data: { users: users.rows[0].count, orders: orders.rows, openDisputes: disputes.rows[0].count, heldVolumeXof: volume.rows[0].total_xof } });
	  }
  const adminUserVerify = path.match(/^\/api\/admin\/users\/(\d+)\/(verify|reject)$/);
  if (req.method === "POST" && adminUserVerify) {
    await requireAdmin(req);
    const nextStatus = adminUserVerify[2] === "verify" ? "verified" : "rejected";
    const saved = await pool.query("UPDATE users SET verification_status = $1 WHERE id = $2 RETURNING id, full_name, verification_status", [nextStatus, Number(adminUserVerify[1])]);
    if (!saved.rowCount) return json(res, 404, { error: "User not found" });
    return json(res, 200, { data: saved.rows[0] });
  }
  const adminOrderRelease = path.match(/^\/api\/admin\/orders\/(\d+)\/release$/);
  if (req.method === "POST" && adminOrderRelease) {
    const admin = await requireAdmin(req);
    const db = await pool.connect();
    try {
      await db.query("BEGIN");
      const result = await db.query(`SELECT o.*, sp.user_id AS provider_id FROM orders o JOIN student_profiles sp ON sp.id = o.profile_id WHERE o.id = $1 FOR UPDATE`, [Number(adminOrderRelease[1])]);
      if (!result.rowCount) throw Object.assign(new Error("Order not found"), { statusCode: 404 });
      const order = result.rows[0];
      if (["completed_released", "dispute_resolved_client", "cancelled"].includes(order.status)) throw Object.assign(new Error("Order cannot be released"), { statusCode: 409 });
      await releaseOrderToProvider(db, order, "admin_release", admin.id);
      await db.query("INSERT INTO order_status_history (order_id, from_status, to_status, actor_id, reason) VALUES ($1, $2, 'completed_released', $3, $4)", [order.id, order.status, admin.id, "Admin release"]);
      await db.query("COMMIT");
      return json(res, 200, { data: { orderId: order.id, status: "completed_released" } });
    } catch (error) { await db.query("ROLLBACK"); throw error; } finally { db.release(); }
  }
  const adminOrderDispute = path.match(/^\/api\/admin\/orders\/(\d+)\/dispute$/);
  if (req.method === "POST" && adminOrderDispute) {
    const admin = await requireAdmin(req); const body = await readBody(req);
    const db = await pool.connect();
    try {
      await db.query("BEGIN");
      const order = await db.query("SELECT id, status FROM orders WHERE id = $1 FOR UPDATE", [Number(adminOrderDispute[1])]);
      if (!order.rowCount) throw Object.assign(new Error("Order not found"), { statusCode: 404 });
      if (order.rows[0].status !== "dispute_opened") await db.query("UPDATE orders SET status = 'dispute_opened' WHERE id = $1", [Number(adminOrderDispute[1])]);
      const saved = await db.query("INSERT INTO disputes (order_id, opened_by, reason) VALUES ($1, $2, $3) RETURNING id, status", [Number(adminOrderDispute[1]), admin.id, String(body.reason || "Litige ouvert par l'administration").trim()]);
      await db.query("COMMIT");
      return json(res, 201, { data: saved.rows[0] });
    } catch (error) { await db.query("ROLLBACK"); throw error; } finally { db.release(); }
  }
  if (req.method === "GET" && path === "/api/admin/disputes") {
    await requireAdmin(req);
    const result = await pool.query(`SELECT d.id, d.order_id, d.status, d.reason, d.created_at, o.status AS order_status, o.amount_total, client.full_name AS client_name, provider.full_name AS provider_name
      FROM disputes d JOIN orders o ON o.id = d.order_id JOIN users client ON client.id = o.client_id JOIN student_profiles sp ON sp.id = o.profile_id JOIN users provider ON provider.id = sp.user_id
      WHERE d.status = 'open' ORDER BY d.created_at ASC LIMIT 100`);
    return json(res, 200, { data: result.rows });
  }
  const adminDisputeResolve = path.match(/^\/api\/admin\/disputes\/(\d+)\/resolve$/);
  if (req.method === "POST" && adminDisputeResolve) {
    const admin = await requireAdmin(req); const body = await readBody(req);
    if (!["client", "provider"].includes(body.winner)) throw Object.assign(new Error("winner must be client or provider"), { statusCode: 422 });
    const db = await pool.connect();
    try {
      await db.query("BEGIN");
      const result = await db.query(`SELECT d.id AS dispute_id, d.status AS dispute_status, o.*, sp.user_id AS provider_id
        FROM disputes d JOIN orders o ON o.id = d.order_id JOIN student_profiles sp ON sp.id = o.profile_id WHERE d.id = $1 FOR UPDATE`, [Number(adminDisputeResolve[1])]);
      if (!result.rowCount) throw Object.assign(new Error("Dispute not found"), { statusCode: 404 });
      const order = result.rows[0];
      if (order.dispute_status !== "open") throw Object.assign(new Error("Dispute is already resolved"), { statusCode: 409 });
      if (body.winner === "provider") {
        await releaseOrderToProvider(db, order, "dispute_provider", admin.id);
        await db.query("UPDATE disputes SET status = 'resolved_provider' WHERE id = $1", [order.dispute_id]);
      } else {
        await db.query("UPDATE orders SET status = 'dispute_resolved_client', released_at = CURRENT_TIMESTAMP WHERE id = $1", [order.id]);
        await db.query(`INSERT INTO transactions (order_id, user_id, kind, direction, amount_xof, idempotency_key, metadata)
          VALUES ($1, $2, 'refund', 'credit', $3, $4, $5::jsonb) ON CONFLICT (idempotency_key) DO NOTHING`,
          [order.id, order.client_id, Number(order.amount_total || order.gross_amount), `refund:${order.id}`, JSON.stringify({ source: "dispute_client", actorId: admin.id, reason: body.reason || null })]);
        await db.query("UPDATE disputes SET status = 'resolved_client' WHERE id = $1", [order.dispute_id]);
      }
      await db.query("COMMIT");
      return json(res, 200, { data: { disputeId: order.dispute_id, orderId: order.id, winner: body.winner } });
    } catch (error) { await db.query("ROLLBACK"); throw error; } finally { db.release(); }
  }
	  if (req.method === "POST" && path === "/api/providers/withdraw") {
	    const providerId = await authenticatedUserId(req); const body = await readBody(req);
	    if (!body.provider || !body.phone || !Number.isInteger(body.amountXof) || body.amountXof <= 0) throw Object.assign(new Error("provider, phone and positive amountXof are required"), { statusCode: 422 });
	    const db = await pool.connect();
	    try {
	      await db.query("BEGIN");
	      const wallet = await db.query("SELECT available_xof FROM wallets WHERE user_id = $1 FOR UPDATE", [providerId]);
	      if (!wallet.rowCount || wallet.rows[0].available_xof < body.amountXof) throw Object.assign(new Error("Insufficient available balance"), { statusCode: 409 });
	      await db.query("UPDATE wallets SET available_xof = available_xof - $2, pending_xof = pending_xof + $2, updated_at = CURRENT_TIMESTAMP WHERE user_id = $1", [providerId, body.amountXof]);
	      const saved = await db.query("INSERT INTO withdrawal_requests (user_id, provider, phone, amount_xof) VALUES ($1, $2, $3, $4) RETURNING id, status, amount_xof", [providerId, body.provider, body.phone, body.amountXof]);
	      await db.query("COMMIT");
	      return json(res, 202, { data: saved.rows[0], next: "2FA verification and provider payout review" });
	    } catch (error) { await db.query("ROLLBACK"); throw error; } finally { db.release(); }
	  }
  if (req.method === "GET" && path === "/api/admin/withdrawals") {
    await requireAdmin(req);
    const result = await pool.query(`SELECT wr.id, wr.user_id, u.full_name, wr.provider, wr.phone, wr.amount_xof, wr.status, wr.provider_reference, wr.created_at, wr.processed_at
      FROM withdrawal_requests wr JOIN users u ON u.id = wr.user_id ORDER BY wr.created_at DESC LIMIT 100`);
    return json(res, 200, { data: result.rows });
  }
  const adminWithdrawalAction = path.match(/^\/api\/admin\/withdrawals\/(\d+)\/(pay|reject)$/);
  if (req.method === "POST" && adminWithdrawalAction) {
    const admin = await requireAdmin(req); const body = await readBody(req);
    const db = await pool.connect();
    try {
      await db.query("BEGIN");
      const result = await db.query("SELECT * FROM withdrawal_requests WHERE id = $1 FOR UPDATE", [Number(adminWithdrawalAction[1])]);
      if (!result.rowCount) throw Object.assign(new Error("Withdrawal not found"), { statusCode: 404 });
      const withdrawal = result.rows[0];
      if (["paid", "rejected"].includes(withdrawal.status)) throw Object.assign(new Error("Withdrawal already closed"), { statusCode: 409 });
      const wallet = await db.query("SELECT user_id, pending_xof FROM wallets WHERE user_id = $1 FOR UPDATE", [withdrawal.user_id]);
      if (!wallet.rowCount || wallet.rows[0].pending_xof < withdrawal.amount_xof) throw Object.assign(new Error("Wallet pending balance mismatch"), { statusCode: 409 });
      if (adminWithdrawalAction[2] === "pay") {
        await db.query("UPDATE wallets SET pending_xof = pending_xof - $2, updated_at = CURRENT_TIMESTAMP WHERE user_id = $1", [withdrawal.user_id, withdrawal.amount_xof]);
        await db.query("UPDATE withdrawal_requests SET status = 'paid', provider_reference = COALESCE($2, provider_reference), processed_at = CURRENT_TIMESTAMP WHERE id = $1", [withdrawal.id, body.providerReference || null]);
        await db.query(`INSERT INTO transactions (user_id, kind, direction, amount_xof, provider, provider_reference, idempotency_key, metadata)
          VALUES ($1, 'payout', 'debit', $2, $3, $4, $5, $6::jsonb) ON CONFLICT (idempotency_key) DO NOTHING`,
          [withdrawal.user_id, withdrawal.amount_xof, withdrawal.provider, body.providerReference || withdrawal.provider_reference || null, `payout:${withdrawal.id}`, JSON.stringify({ actorId: admin.id })]);
      } else {
        await db.query("UPDATE wallets SET available_xof = available_xof + $2, pending_xof = pending_xof - $2, updated_at = CURRENT_TIMESTAMP WHERE user_id = $1", [withdrawal.user_id, withdrawal.amount_xof]);
        await db.query("UPDATE withdrawal_requests SET status = 'rejected', processed_at = CURRENT_TIMESTAMP WHERE id = $1", [withdrawal.id]);
      }
      await db.query("COMMIT");
      return json(res, 200, { data: { id: withdrawal.id, status: adminWithdrawalAction[2] === "pay" ? "paid" : "rejected" } });
    } catch (error) { await db.query("ROLLBACK"); throw error; } finally { db.release(); }
  }
  const withdrawal2fa = path.match(/^\/api\/providers\/withdrawals\/(\d+)\/2fa$/);
  if (req.method === "POST" && withdrawal2fa) return json(res, 200, { data: await requestWithdrawal2fa(req, Number(withdrawal2fa[1])) });
  const withdrawalConfirm = path.match(/^\/api\/providers\/withdrawals\/(\d+)\/confirm$/);
  if (req.method === "POST" && withdrawalConfirm) return json(res, 200, { data: await confirmWithdrawal2fa(req, Number(withdrawalConfirm[1]), await readBody(req)) });
  const previewDelivery = path.match(/^\/api\/orders\/(\d+)\/deliver-preview$/);
  if (req.method === "POST" && previewDelivery) {
    const providerId = await authenticatedUserId(req); const body = await readBody(req);
    if (!body.storageKey || !body.mimeType || !Number.isInteger(body.sizeBytes)) throw Object.assign(new Error("storageKey, mimeType and sizeBytes are required"), { statusCode: 422 });
    const db = await pool.connect();
    try {
      await db.query("BEGIN");
      const order = await db.query(`SELECT o.id, o.status FROM orders o JOIN student_profiles sp ON sp.id = o.profile_id WHERE o.id = $1 AND sp.user_id = $2 FOR UPDATE`, [Number(previewDelivery[1]), providerId]);
      if (!order.rowCount) throw Object.assign(new Error("Order not found"), { statusCode: 404 });
      if (!["escrowed", "in_progress", "preview_delivered"].includes(order.rows[0].status)) throw Object.assign(new Error("Preview requires a held payment"), { statusCode: 409 });
      const token = randomUUID() + randomUUID();
      const file = await db.query(`INSERT INTO delivery_files (order_id, uploader_id, kind, original_storage_key, preview_storage_key, mime_type, size_bytes, streaming_only, dynamic_watermark_text)
        VALUES ($1, $2, 'preview', $3, $3, $4, $5, $6, $7) RETURNING id`, [Number(previewDelivery[1]), providerId, body.storageKey, body.mimeType, body.sizeBytes, /^(image|video)\//.test(body.mimeType), body.watermark || `KayJob · commande ${previewDelivery[1]}`]);
      await db.query("INSERT INTO preview_sessions (delivery_file_id, viewer_id, token_hash, expires_at) SELECT $1, client_id, $2, CURRENT_TIMESTAMP + INTERVAL '15 minutes' FROM orders WHERE id = $3", [file.rows[0].id, hash(token), Number(previewDelivery[1])]);
      await db.query("UPDATE orders SET status = 'preview_delivered', delivered_at = CURRENT_TIMESTAMP WHERE id = $1", [Number(previewDelivery[1])]);
      await db.query("COMMIT");
      return json(res, 201, { data: { orderId: Number(previewDelivery[1]), previewToken: token, expiresIn: 900, streaming: true } });
    } catch (error) { await db.query("ROLLBACK"); throw error; } finally { db.release(); }
  }
  const previewStream = path.match(/^\/api\/orders\/(\d+)\/preview-stream$/);
  if (req.method === "GET" && previewStream) {
    const viewerId = await authenticatedUserId(req); const token = url.searchParams.get("token");
    if (!token) throw Object.assign(new Error("preview token is required"), { statusCode: 422 });
    const session = await pool.query(`SELECT ps.id, ps.expires_at, ps.revoked_at, df.original_storage_key, df.mime_type, df.size_bytes
      FROM preview_sessions ps JOIN delivery_files df ON df.id = ps.delivery_file_id JOIN orders o ON o.id = df.order_id
      WHERE ps.token_hash = $1 AND df.order_id = $2 AND ps.viewer_id = $3 AND o.status IN ('preview_delivered', 'final_delivered', 'client_review', 'completed_released')`, [hash(token), Number(previewStream[1]), viewerId]);
    if (!session.rowCount || session.rows[0].revoked_at || new Date(session.rows[0].expires_at) <= new Date()) throw Object.assign(new Error("Preview token expired or invalid"), { statusCode: 403 });
    const object = await streamObject(session.rows[0].original_storage_key, req.headers.range);
    const contentLength = object.ContentLength || session.rows[0].size_bytes;
    res.writeHead(req.headers.range ? 206 : 200, { "content-type": session.rows[0].mime_type, "content-length": contentLength, "accept-ranges": "bytes", "cache-control": "no-store" });
    object.Body.pipe(res);
    await pool.query("UPDATE preview_sessions SET last_chunk_at = CURRENT_TIMESTAMP, chunks_served = chunks_served + 1 WHERE id = $1", [session.rows[0].id]);
    return;
  }
  const finalFile = path.match(/^\/api\/orders\/(\d+)\/files\/(\d+)$/);
  if (req.method === "GET" && finalFile) {
    const viewerId = await authenticatedUserId(req);
    const file = await pool.query(`SELECT df.original_storage_key FROM delivery_files df JOIN orders o ON o.id = df.order_id
      WHERE df.id = $1 AND df.order_id = $2 AND df.kind = 'final' AND o.status IN ('final_delivered', 'client_review', 'completed_released')
      AND (o.client_id = $3 OR o.profile_id IN (SELECT id FROM student_profiles WHERE user_id = $3))`, [Number(finalFile[2]), Number(finalFile[1]), viewerId]);
    if (!file.rowCount) return json(res, 404, { error: "Final file not found or not available" });
    return json(res, 200, { data: { downloadUrl: await signedDownload(file.rows[0].original_storage_key, 300), expiresIn: 300 } });
  }
  const messages = path.match(/^\/api\/orders\/(\d+)\/messages$/);
  if (req.method === "GET" && messages) {
    const viewerId = await authenticatedUserId(req);
    const orderId = Number(messages[1]);
    const order = await pool.query("SELECT id FROM orders WHERE id = $1 AND (client_id = $2 OR profile_id IN (SELECT id FROM student_profiles WHERE user_id = $2))", [orderId, viewerId]);
    if (!order.rowCount) throw Object.assign(new Error("Order not found or access denied"), { statusCode: 404 });
    let conversation = await pool.query("SELECT id FROM conversations WHERE order_id = $1 LIMIT 1", [orderId]);
    if (!conversation.rowCount) conversation = await pool.query("INSERT INTO conversations (order_id) VALUES ($1) ON CONFLICT (order_id) WHERE order_id IS NOT NULL DO UPDATE SET order_id = EXCLUDED.order_id RETURNING id", [orderId]);
    const rows = await pool.query(`SELECT m.id, m.sender_id, u.full_name AS sender_name, m.body, m.attachment_url, m.created_at
      FROM messages m JOIN users u ON u.id = m.sender_id
      WHERE m.conversation_id = $1 ORDER BY m.created_at ASC`, [conversation.rows[0].id]);
    return json(res, 200, { data: rows.rows.map((row) => ({
      id: row.id,
      senderId: row.sender_id,
      senderName: row.sender_name,
      body: row.body,
      attachmentUrl: row.attachment_url,
      createdAt: row.created_at,
      me: Number(row.sender_id) === Number(viewerId)
    })) });
  }
  if (req.method === "POST" && messages) {
    const senderId = await authenticatedUserId(req); const body = await readBody(req); const safe = redactContactContent(String(body.body || "").trim());
    const attachmentUrl = String(body.attachmentUrl || body.attachment_url || "").trim();
    if (!safe.body && !attachmentUrl) throw Object.assign(new Error("Message body or attachment is required"), { statusCode: 422 });
    const orderId = Number(messages[1]);
    const order = await pool.query("SELECT id FROM orders WHERE id = $1 AND (client_id = $2 OR profile_id IN (SELECT id FROM student_profiles WHERE user_id = $2))", [orderId, senderId]);
    if (!order.rowCount) throw Object.assign(new Error("Order not found or access denied"), { statusCode: 404 });
    let conversation = await pool.query("SELECT id FROM conversations WHERE order_id = $1 LIMIT 1", [orderId]);
    if (!conversation.rowCount) conversation = await pool.query("INSERT INTO conversations (order_id) VALUES ($1) ON CONFLICT (order_id) WHERE order_id IS NOT NULL DO UPDATE SET order_id = EXCLUDED.order_id RETURNING id", [orderId]);
    const saved = await pool.query("INSERT INTO messages (conversation_id, sender_id, body, attachment_url) VALUES ($1, $2, $3, $4) RETURNING id, body, attachment_url, created_at", [conversation.rows[0].id, senderId, safe.body || "Pièce jointe", attachmentUrl || null]);
    if (safe.flagged) await pool.query("INSERT INTO risk_events (user_id, order_id, event_type, severity, redacted_value) VALUES ($1, $2, 'contact_attempt', 'medium', $3)", [senderId, orderId, safe.reason]);
    return json(res, 201, { data: {
      id: saved.rows[0].id,
      senderId,
      body: saved.rows[0].body,
      attachmentUrl: saved.rows[0].attachment_url,
      createdAt: saved.rows[0].created_at,
      me: true,
      warning: safe.flagged ? "Contact details were hidden to keep the transaction protected." : undefined
    }, warning: safe.flagged ? "Contact details were hidden to keep the transaction protected." : undefined });
  }
  return json(res, 404, { error: "Route not found" });
}

function serve() {
  return createServer((req, res) => {
    res.req = req;
    return route(req, res).catch((error) => json(res, error.statusCode || 500, { error: error.message }));
  }).listen(port, () => console.log(`KayJob API listening on http://localhost:${port}`));
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  serve();
}

export default function handler(req, res) {
  res.req = req;
  return route(req, res).catch((error) => json(res, error.statusCode || 500, { error: error.message }));
}
