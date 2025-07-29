"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.metricsRoutes = void 0;
const express_1 = require("express");
const prometheus_metrics_1 = require("../monitoring/prometheus.metrics");
const router = (0, express_1.Router)();
exports.metricsRoutes = router;
router.get('/', async (req, res) => {
    try {
        const metrics = await prometheus_metrics_1.prometheusMetrics.getMetrics();
        res.set('Content-Type', 'text/plain');
        res.send(metrics);
    }
    catch (error) {
        res.status(500).json({
            success: false,
            error: {
                message: 'Failed to get metrics',
                code: 'METRICS_ERROR'
            }
        });
    }
});
router.get('/json', async (req, res) => {
    try {
        const metrics = await prometheus_metrics_1.prometheusMetrics.getMetricsJSON();
        res.json({
            success: true,
            data: metrics
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            error: {
                message: 'Failed to get metrics',
                code: 'METRICS_ERROR'
            }
        });
    }
});
//# sourceMappingURL=metrics.routes.js.map