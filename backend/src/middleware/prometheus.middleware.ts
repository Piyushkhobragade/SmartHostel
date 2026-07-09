import { Request, Response, NextFunction } from "express";
import { httpRequestDuration, httpRequestsTotal } from "../monitoring/prometheus";

export function prometheusMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const end = httpRequestDuration.startTimer();

  res.on("finish", () => {
    const labels = {
      method: req.method,
      route: req.route?.path || req.path,
      status: String(res.statusCode),
    };

    httpRequestsTotal.inc(labels);
    end(labels);
  });

  next();
}
