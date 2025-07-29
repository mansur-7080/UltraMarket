"use strict";
// This is a simple shim to work around the missing swagger dependencies
// In a real environment, you would install the actual dependencies
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.swaggerUi = exports.swaggerJsdoc = void 0;
exports.swaggerJsdoc = {
    definition: function (config) { return (__assign({}, config)); },
    setup: function (options) { return options; },
};
exports.swaggerUi = {
    serve: function () { return function (req, res, next) { return next(); }; },
    setup: function (spec) { return function (req, res) { return res.json(spec); }; },
};
exports.default = {
    swaggerJsdoc: exports.swaggerJsdoc,
    swaggerUi: exports.swaggerUi,
};
