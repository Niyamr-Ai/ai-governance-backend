import { Request, Response, NextFunction } from 'express';

export function logger(req: Request, res: Response, next: NextFunction) {
  const start = Date.now();
  console.log(`${req.method} ${req.originalUrl}`);

  // Override res.json to log response time
  const originalJson = res.json;
  res.json = function(data) {
    console.log(`📦 ${res.statusCode} - ${Date.now() - start}ms`);
    return originalJson.call(this, data);
  };

  next();
}
