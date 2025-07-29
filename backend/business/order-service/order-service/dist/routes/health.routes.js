"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var express_1 = require("express");
var router = (0, express_1.Router)();
// Placeholder routes - will be implemented fully
router.get('/', function (req, res) {
    res.json({
        status: 'ok',
        service: 'order-service',
        timestamp: new Date().toISOString(),
        version: '1.0.0',
    });
});
exports.default = router;
