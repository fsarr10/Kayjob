import { createHash, randomUUID } from "node:crypto";
import { createServer } from "node:http";
import { pool } from "./db.mjs";
import { assertTransition, canDeliverFinal } from "./order-state.mjs";
import { redactContactContent } from "./message-safety.mjs";

const port = Number(process.env.API_PORT || 4000);
const json = (res, status, body) => {
  res.writeHead(status, { "content-type": "application/json; charset=utf-8", "access-control-allow-origin": process.env.CORS_ORIGIN || "*" });
  res.end(JSON.stringify(body));
};
const readBody = (req) => new Promise((resolve, reject) => {
  let raw = "";
  req.on("data", (chunk) => { raw += chunk; if (raw.length > 1_000_000) reject(Object.assign(new Error("Payload too large"), { statusCode: 413 })); });
  req.on("end", () => { try { resolve(raw ? JSON.parse(raw) : {}); } catch { reject(Object.assign(new Error("Invalid JSON"), { statusCode: 400 })); } });
  req.on("error", reject);
});
const hash = (value) => createHash("sha256").update(value).digest("hex");

function userId(req) {
  const value = req.headers["x-user-id"];
  if (!value || !/^\d+$/.test(value)) { const error = new Error("Authentication required"); error.statusCode = 401; throw error; }
  return Number(value);
}

async function createOrder(req, body) {
  const clientId = userId(req);
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

async function paymentWebhook(req, provider, body) {
  const signature = req.headers["x-provider-signature"];
  if (!signature || process.env.NODE_ENV === "production" && signature !== process.env[`${provider.toUpperCase()}_WEBHOOK_SECRET`]) {
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

async function route(req, res) {
  const url = new URL(req.url, `http://${req.headers.host || "localhost"}`);
  const path = url.pathname;
  if (req.method === "OPTIONS") return json(res, 204, {});
  if (req.method === "GET" && path === "/health") return json(res, 200, { ok: true, service: "kayjob-api" });
  if (req.method === "GET" && path === "/api/services") {
    const result = await pool.query(`SELECT s.id, s.title, s.description, s.delivery_mode, s.starting_price, sp.sama_score, u.full_name, u.pseudo, c.name AS category, ci.name AS city
      FROM services s JOIN student_profiles sp ON sp.id = s.profile_id JOIN users u ON u.id = sp.user_id LEFT JOIN categories c ON c.id = s.category_id LEFT JOIN cities ci ON ci.id = u.city_id
      WHERE s.is_active = true ORDER BY sp.sama_score DESC, s.starting_price ASC`);
    return json(res, 200, { data: result.rows });
  }
  if (req.method === "POST" && path === "/api/orders") return json(res, 201, { data: await createOrder(req, await readBody(req)) });
  const webhook = path.match(/^\/api\/webhooks\/payments\/(wave|orange_money|yas)$/);
  if (req.method === "POST" && webhook) return json(res, 200, { data: await paymentWebhook(req, webhook[1], await readBody(req)) });
  const payment = path.match(/^\/api\/orders\/(\d+)\/pay$/);
  if (req.method === "POST" && payment) {
    userId(req);
    if (process.env.NODE_ENV === "production") return json(res, 501, { error: "Payment provider credentials are not configured" });
    return json(res, 200, { data: { provider: "mock", checkoutId: randomUUID(), orderId: Number(payment[1]), next: "POST /api/webhooks/payments/mock" } });
  }
  const finalDelivery = path.match(/^\/api\/orders\/(\d+)\/deliver-final$/);
  if (req.method === "POST" && finalDelivery) {
    const providerId = userId(req);
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
    const clientId = userId(req); const db = await pool.connect();
    try {
      await db.query("BEGIN");
      const result = await db.query(`SELECT o.*, sp.user_id AS provider_id FROM orders o JOIN student_profiles sp ON sp.id = o.profile_id WHERE o.id = $1 AND o.client_id = $2 FOR UPDATE`, [Number(validate[1]), clientId]);
      if (!result.rowCount) throw Object.assign(new Error("Order not found"), { statusCode: 404 });
      const order = result.rows[0];
      assertTransition(order.status, "client_review");
      assertTransition("client_review", "completed_released");
      await db.query("UPDATE orders SET status = 'completed_released', review_deadline_at = CURRENT_TIMESTAMP, released_at = CURRENT_TIMESTAMP WHERE id = $1", [order.id]);
      await db.query(`INSERT INTO transactions (order_id, user_id, kind, direction, amount_xof, idempotency_key, metadata)
        VALUES ($1, $2, 'release', 'credit', $3, $4, $5::jsonb), ($1, $2, 'commission', 'debit', $6, $7, $8::jsonb)`,
        [order.id, order.provider_id, order.amount_net_provider || order.net_amount, `release:${order.id}`, JSON.stringify({ source: "client_validation" }), order.commission_amount, `commission:${order.id}`, JSON.stringify({ source: "client_validation" })]);
      await db.query("COMMIT");
      return json(res, 200, { data: { orderId: order.id, status: "completed_released" } });
    } catch (error) { await db.query("ROLLBACK"); throw error; } finally { db.release(); }
  }
  const dispute = path.match(/^\/api\/orders\/(\d+)\/dispute$/);
  if (req.method === "POST" && dispute) {
    const openedBy = userId(req); const body = await readBody(req);
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
  const previewDelivery = path.match(/^\/api\/orders\/(\d+)\/deliver-preview$/);
  if (req.method === "POST" && previewDelivery) {
    userId(req);
    return json(res, 501, { error: "Preview requires the S3 watermarking and streaming worker", next: "Generate delivery_file and preview_session server-side" });
  }
  const previewStream = path.match(/^\/api\/orders\/(\d+)\/preview-stream$/);
  if (req.method === "GET" && previewStream) {
    userId(req);
    return json(res, 501, { error: "Preview streaming requires the private object storage adapter" });
  }
  const messages = path.match(/^\/api\/orders\/(\d+)\/messages$/);
  if (req.method === "POST" && messages) {
    const senderId = userId(req); const body = await readBody(req); const safe = redactContactContent(String(body.body || "").trim());
    if (!safe.body) throw Object.assign(new Error("Message body is required"), { statusCode: 422 });
    const conversation = await pool.query("SELECT id FROM conversations WHERE order_id = $1 LIMIT 1", [Number(messages[1])]);
    if (!conversation.rowCount) throw Object.assign(new Error("Conversation not found"), { statusCode: 404 });
    const saved = await pool.query("INSERT INTO messages (conversation_id, sender_id, body) VALUES ($1, $2, $3) RETURNING id, body, created_at", [conversation.rows[0].id, senderId, safe.body]);
    if (safe.flagged) await pool.query("INSERT INTO risk_events (user_id, order_id, event_type, severity, redacted_value) VALUES ($1, $2, 'contact_attempt', 'medium', $3)", [senderId, Number(messages[1]), safe.reason]);
    return json(res, 201, { data: saved.rows[0], warning: safe.flagged ? "Contact details were hidden to keep the transaction protected." : undefined });
  }
  return json(res, 404, { error: "Route not found" });
}

createServer((req, res) => route(req, res).catch((error) => json(res, error.statusCode || 500, { error: error.message }))).listen(port, () => console.log(`KayJob API listening on http://localhost:${port}`));
