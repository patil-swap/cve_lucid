const map = new Map<string, { count: number, timestamp: number }>();
const WINDOW_MS = parseInt(process.env.RATE_LIMIT_WINDOW_MS || "60000", 10);
const MAX_REQUESTS = parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || "10", 10);

export function rateLimit(ip: string) {
  const now = Date.now();
  const data = map.get(ip);
  if (!data) {
    map.set(ip, { count: 1, timestamp: now });
    return { allowed: true };
  }

  if (now - data.timestamp > WINDOW_MS) {
    map.set(ip, { count: 1, timestamp: now });
    return { allowed: true };
  }

  if (data.count >= MAX_REQUESTS) {
    return { allowed: false };
  }

  data.count += 1;
  map.set(ip, data);
  return { allowed: true };
}
