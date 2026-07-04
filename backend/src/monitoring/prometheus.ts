import client from "prom-client";

client.collectDefaultMetrics({
  prefix: "smarthostel_",
});

export const register = client.register;

export const httpRequestDuration = new client.Histogram({
  name: "smarthostel_http_request_duration_seconds",
  help: "HTTP request duration",
  labelNames: ["method", "route", "status"],
  buckets: [0.05,0.1,0.2,0.5,1,2,5]
});

export const httpRequestsTotal = new client.Counter({
  name: "smarthostel_http_requests_total",
  help: "Total HTTP requests",
  labelNames: ["method","route","status"]
});
