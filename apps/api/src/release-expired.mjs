import { pool } from "./db.mjs";

const db = await pool.connect();
try {
  await db.query("BEGIN");
  const orders = await db.query(`SELECT o.id, o.amount_net_provider, o.net_amount, o.commission_amount, sp.user_id AS provider_id
    FROM orders o JOIN student_profiles sp ON sp.id = o.profile_id
    WHERE o.status = 'client_review' AND o.review_deadline_at <= CURRENT_TIMESTAMP FOR UPDATE`);
  for (const order of orders.rows) {
    await db.query("UPDATE orders SET status = 'completed_released', released_at = CURRENT_TIMESTAMP WHERE id = $1", [order.id]);
    await db.query("INSERT INTO wallets (user_id, available_xof) VALUES ($1, $2) ON CONFLICT (user_id) DO UPDATE SET available_xof = wallets.available_xof + EXCLUDED.available_xof, updated_at = CURRENT_TIMESTAMP", [order.provider_id, order.amount_net_provider || order.net_amount]);
    await db.query(`INSERT INTO transactions (order_id, user_id, kind, direction, amount_xof, idempotency_key, metadata)
      VALUES ($1, $2, 'release', 'credit', $3, $4, $5::jsonb), ($1, $2, 'commission', 'debit', $6, $7, $8::jsonb)`,
      [order.id, order.provider_id, order.amount_net_provider || order.net_amount, `release:${order.id}`, JSON.stringify({ source: "review_deadline" }), order.commission_amount, `commission:${order.id}`, JSON.stringify({ source: "review_deadline" })]);
  }
  await db.query("COMMIT");
  console.log(`Released ${orders.rowCount} expired order(s).`);
} catch (error) {
  await db.query("ROLLBACK");
  console.error(error.message);
  process.exitCode = 1;
} finally {
  db.release();
  await pool.end();
}
