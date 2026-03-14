import { NextFunction, Request, Response } from 'express';

type RateLimitOptions = {
  windowMs: number;
  maxRequests: number;
  skipPaths?: string[];
};

type RateLimitRecord = {
  count: number;
  windowStart: number;
};

const getClientIp = (req: Request): string => {
  const forwardedFor = req.headers['x-forwarded-for'];
  if (typeof forwardedFor === 'string' && forwardedFor.length > 0) {
    return forwardedFor.split(',')[0].trim();
  }
  if (Array.isArray(forwardedFor) && forwardedFor[0]) {
    return forwardedFor[0];
  }

  return req.ip ?? req.socket.remoteAddress ?? 'unknown';
};

export function createRateLimitMiddleware(options: RateLimitOptions) {
  const store = new Map<string, RateLimitRecord>();
  const skipPathSet = new Set(options.skipPaths ?? []);
  const MAX_TRACKED_KEYS = 50_000;
  let requestsSinceCleanup = 0;

  const cleanupExpired = (now: number) => {
    for (const [key, record] of store.entries()) {
      if (now - record.windowStart >= options.windowMs) {
        store.delete(key);
      }
    }
  };

  return (req: Request, res: Response, next: NextFunction) => {
    const path = req.path ?? '';
    if (skipPathSet.has(path)) {
      return next();
    }

    const now = Date.now();
    const ip = getClientIp(req);
    const key = `${ip}:${req.method}:${path}`;
    const existing = store.get(key);

    requestsSinceCleanup += 1;
    if (requestsSinceCleanup >= 1000) {
      cleanupExpired(now);
      requestsSinceCleanup = 0;
    }
    if (store.size > MAX_TRACKED_KEYS) {
      cleanupExpired(now);
      if (store.size > MAX_TRACKED_KEYS) {
        store.clear();
      }
    }

    if (!existing || now - existing.windowStart >= options.windowMs) {
      store.set(key, { count: 1, windowStart: now });
      res.setHeader('X-RateLimit-Limit', options.maxRequests.toString());
      res.setHeader(
        'X-RateLimit-Remaining',
        Math.max(0, options.maxRequests - 1).toString(),
      );
      res.setHeader(
        'X-RateLimit-Reset',
        Math.ceil((now + options.windowMs) / 1000).toString(),
      );
      return next();
    }

    existing.count += 1;
    store.set(key, existing);

    if (existing.count > options.maxRequests) {
      const retryAfterSec = Math.ceil(
        (options.windowMs - (now - existing.windowStart)) / 1000,
      );
      res.setHeader('Retry-After', retryAfterSec.toString());
      res.setHeader('X-RateLimit-Limit', options.maxRequests.toString());
      res.setHeader(
        'X-RateLimit-Remaining',
        Math.max(0, options.maxRequests - existing.count).toString(),
      );
      res.setHeader(
        'X-RateLimit-Reset',
        Math.ceil((existing.windowStart + options.windowMs) / 1000).toString(),
      );
      return res.status(429).json({
        statusCode: 429,
        message: 'Too many requests, please try again later.',
      });
    }

    res.setHeader('X-RateLimit-Limit', options.maxRequests.toString());
    res.setHeader(
      'X-RateLimit-Remaining',
      Math.max(0, options.maxRequests - existing.count).toString(),
    );
    res.setHeader(
      'X-RateLimit-Reset',
      Math.ceil((existing.windowStart + options.windowMs) / 1000).toString(),
    );
    return next();
  };
}
