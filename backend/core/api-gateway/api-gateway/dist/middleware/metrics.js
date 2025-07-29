"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getMetrics = exports.metricsMiddleware = void 0;
const prom_client_1 = __importDefault(require("prom-client"));
const httpRequestsTotal = new prom_client_1.default.Counter({
    name: 'http_requests_total',
    help: 'Total number of HTTP requests',
    labelNames: ['method', 'route', 'status_code'],
});
const httpRequestDuration = new prom_client_1.default.Histogram({
    name: 'http_request_duration_seconds',
    help: 'Duration of HTTP requests in seconds',
    labelNames: ['method', 'route', 'status_code'],
    buckets: [0.1, 0.5, 1, 2, 5, 10],
});
const activeConnections = new prom_client_1.default.Gauge({
    name: 'active_connections',
    help: 'Number of active connections',
});
prom_client_1.default.register.setDefaultLabels({
    service: 'api-gateway',
});
prom_client_1.default.collectDefaultMetrics();
const metricsMiddleware = (req, res, next) => {
    const startTime = Date.now();
    activeConnections.inc();
    const originalEnd = res.end;
    res.end = function (chunk, encoding) {
        const duration = (Date.now() - startTime) / 1000;
        const route = req.route?.path || req.path;
        httpRequestsTotal.inc({
            method: req.method,
            route,
            status_code: res.statusCode,
        });
        httpRequestDuration.observe({
            method: req.method,
            route,
            status_code: res.statusCode,
        }, duration);
        activeConnections.dec();
        originalEnd.call(this, chunk, encoding);
    };
    next();
};
exports.metricsMiddleware = metricsMiddleware;
const getMetrics = async (req, res) => {
    try {
        const metrics = await prom_client_1.default.register.metrics();
        res.set('Content-Type', prom_client_1.default.register.contentType);
        res.end(metrics);
    }
    catch (error) {
        res.status(500).end('Error collecting metrics');
    }
};
exports.getMetrics = getMetrics;
//# sourceMappingURL=metrics.js.map