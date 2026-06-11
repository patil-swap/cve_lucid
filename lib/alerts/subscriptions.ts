import { getDb } from '../search';
import { randomUUID } from 'crypto';

export interface AlertSubscription {
  id: string;
  email: string;
  product: string | null;
  severityThreshold: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'ALL';
  confirmed: number;
  confirmToken: string;
  unsubscribeToken: string;
  createdAt: string;
}

export async function createSubscription(email: string, product: string | null, severityThreshold: string) {
  const db = await getDb();
  const existingRes = await db.execute({
    sql: 'SELECT id FROM alert_subscriptions WHERE email = ? AND (product = ? OR (product IS NULL AND ? IS NULL))',
    args: [email, product || null, product || null]
  });

  const existing = existingRes.rows[0];

  if (existing) {
    throw new Error('Already subscribed to this product alerts.');
  }

  const id = randomUUID();
  const confirmToken = randomUUID();
  const unsubscribeToken = randomUUID();

  await db.execute({
    sql: `
      INSERT INTO alert_subscriptions (id, email, product, severity_threshold, confirm_token, unsubscribe_token)
      VALUES (?, ?, ?, ?, ?, ?)
    `,
    args: [id, email, product || null, severityThreshold, confirmToken, unsubscribeToken]
  });

  return { id, confirmToken, unsubscribeToken };
}

export async function confirmSubscription(token: string) {
  const db = await getDb();
  const result = await db.execute({
    sql: 'UPDATE alert_subscriptions SET confirmed = 1 WHERE confirm_token = ?',
    args: [token]
  });
  return result.rowsAffected > 0;
}

export async function unsubscribe(token: string) {
  const db = await getDb();
  const result = await db.execute({
    sql: 'DELETE FROM alert_subscriptions WHERE unsubscribe_token = ?',
    args: [token]
  });
  return result.rowsAffected > 0;
}

export async function getConfirmedSubscriptions() {
  const db = await getDb();
  const res = await db.execute('SELECT * FROM alert_subscriptions WHERE confirmed = 1');
  return res.rows as any[];
}
