import { db } from '../search';
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

export function createSubscription(email: string, product: string | null, severityThreshold: string) {
  const existing = db.prepare('SELECT id FROM alert_subscriptions WHERE email = ? AND (product = ? OR (product IS NULL AND ? IS NULL))')
    .get(email, product || null, product || null);

  if (existing) {
    throw new Error('Already subscribed to this product alerts.');
  }

  const id = randomUUID();
  const confirmToken = randomUUID();
  const unsubscribeToken = randomUUID();

  db.prepare(`
    INSERT INTO alert_subscriptions (id, email, product, severity_threshold, confirm_token, unsubscribe_token)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(id, email, product || null, severityThreshold, confirmToken, unsubscribeToken);

  return { id, confirmToken, unsubscribeToken };
}

export function confirmSubscription(token: string) {
  const result = db.prepare('UPDATE alert_subscriptions SET confirmed = 1 WHERE confirm_token = ?').run(token);
  return result.changes > 0;
}

export function unsubscribe(token: string) {
  const result = db.prepare('DELETE FROM alert_subscriptions WHERE unsubscribe_token = ?').run(token);
  return result.changes > 0;
}

export function getConfirmedSubscriptions() {
  return db.prepare('SELECT * FROM alert_subscriptions WHERE confirmed = 1').all() as any[];
}
