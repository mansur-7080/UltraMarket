"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateDeviceFingerprint = generateDeviceFingerprint;
exports.extractDeviceInfo = extractDeviceInfo;
exports.detectSuspiciousLogin = detectSuspiciousLogin;
const ua_parser_js_1 = __importDefault(require("ua-parser-js"));
const logger_1 = require("../utils/logger");
function generateDeviceFingerprint(req) {
    const ua = req.headers['user-agent'] || '';
    const ip = getClientIp(req);
    const acceptLanguage = req.headers['accept-language'] || '';
    const acceptEncoding = req.headers['accept-encoding'] || '';
    const fingerprint = `${ua}|${acceptLanguage}|${acceptEncoding}`;
    const crypto = require('crypto');
    return crypto.createHash('sha256').update(fingerprint).digest('hex');
}
function extractDeviceInfo(req) {
    const parser = new ua_parser_js_1.default(req.headers['user-agent']);
    const uaResult = parser.getResult();
    const ip = getClientIp(req);
    const deviceId = generateDeviceFingerprint(req);
    return {
        deviceId,
        userAgent: req.headers['user-agent'] || 'unknown',
        browser: {
            name: uaResult.browser.name || 'unknown',
            version: uaResult.browser.version || 'unknown',
        },
        os: {
            name: uaResult.os.name || 'unknown',
            version: uaResult.os.version || 'unknown',
        },
        device: {
            vendor: uaResult.device.vendor || 'unknown',
            model: uaResult.device.model || 'unknown',
            type: uaResult.device.type || 'unknown',
        },
        ip,
        lastAccessed: new Date(),
    };
}
function getClientIp(req) {
    const ipSources = [
        req.headers['x-forwarded-for'],
        req.headers['x-real-ip'],
        req.headers['x-client-ip'],
        req.socket?.remoteAddress,
    ];
    const rawIp = ipSources.find((src) => typeof src === 'string' && src.length > 0) || '0.0.0.0';
    if (typeof rawIp === 'string' && rawIp.includes(',')) {
        return rawIp?.split(',')[0]?.trim() || 'unknown';
    }
    return typeof rawIp === 'string' ? rawIp : '0.0.0.0';
}
function detectSuspiciousLogin(currentDevice, knownDevices) {
    if (!knownDevices.length) {
        return { suspicious: false };
    }
    const knownDevice = knownDevices.find((d) => d.deviceId === currentDevice.deviceId);
    if (knownDevice) {
        if (knownDevice.ip !== currentDevice.ip) {
            logger_1.logger.info('User logged in from new IP address', {
                userId: 'user-context',
                previousIp: knownDevice.ip,
                newIp: currentDevice.ip,
            });
        }
        return { suspicious: false };
    }
    const recentLogins = knownDevices.filter((d) => {
        const timeDiff = Date.now() - d.lastAccessed.getTime();
        return timeDiff < 60 * 60 * 1000;
    });
    if (recentLogins.length > 0) {
        return {
            suspicious: true,
            reason: 'New device login shortly after login from another device',
        };
    }
    return { suspicious: false };
}
//# sourceMappingURL=device-tracking.js.map