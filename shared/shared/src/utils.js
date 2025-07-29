"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.throttle = exports.debounce = exports.chunk = exports.parseSort = exports.calculatePercentage = exports.isValidPhone = exports.isValidEmail = exports.generateSlug = exports.formatCurrency = exports.deepClone = exports.removeUndefined = exports.filterObject = exports.retry = exports.sleep = exports.generateId = exports.calculateOffset = exports.paginate = void 0;
const constants_1 = require("./constants");
// Pagination helper
const paginate = (data, total, params) => {
    const page = Math.max(1, params.page || constants_1.DEFAULT_PAGE);
    const limit = Math.min(params.limit || constants_1.DEFAULT_LIMIT, constants_1.MAX_LIMIT);
    const totalPages = Math.ceil(total / limit);
    return {
        data,
        pagination: {
            page,
            limit,
            total,
            totalPages,
            hasMore: page < totalPages,
        },
    };
};
exports.paginate = paginate;
// Calculate pagination offset
const calculateOffset = (page, limit) => {
    return (page - 1) * limit;
};
exports.calculateOffset = calculateOffset;
// Generate unique ID
const generateId = (prefix) => {
    const timestamp = Date.now().toString(36);
    const randomStr = Math.random().toString(36).substring(2, 9);
    return prefix ? `${prefix}_${timestamp}${randomStr}` : `${timestamp}${randomStr}`;
};
exports.generateId = generateId;
// Sleep function for delays
const sleep = (ms) => {
    return new Promise((resolve) => setTimeout(resolve, ms));
};
exports.sleep = sleep;
// Retry function for operations
const retry = async (fn, retries = 3, delay = 1000) => {
    try {
        return await fn();
    }
    catch (error) {
        if (retries === 0)
            throw error;
        await (0, exports.sleep)(delay);
        return (0, exports.retry)(fn, retries - 1, delay * 2);
    }
};
exports.retry = retry;
// Object filtering
const filterObject = (obj, predicate) => {
    return Object.keys(obj).reduce((acc, key) => {
        if (predicate(obj[key], key)) {
            acc[key] = obj[key];
        }
        return acc;
    }, {});
};
exports.filterObject = filterObject;
// Remove undefined values from object
const removeUndefined = (obj) => {
    return (0, exports.filterObject)(obj, (value) => value !== undefined);
};
exports.removeUndefined = removeUndefined;
// Deep clone object
const deepClone = (obj) => {
    return JSON.parse(JSON.stringify(obj));
};
exports.deepClone = deepClone;
// Format currency
const formatCurrency = (amount, currency = 'UZS', locale = 'uz-UZ') => {
    if (currency === 'UZS') {
        return (new Intl.NumberFormat('uz-UZ', {
            style: 'decimal',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        }).format(amount) + " so'm");
    }
    return new Intl.NumberFormat(locale, {
        style: 'currency',
        currency,
    }).format(amount);
};
exports.formatCurrency = formatCurrency;
// Generate slug from string
const generateSlug = (str) => {
    return str
        .toLowerCase()
        .trim()
        .replace(/[^\w\s-]/g, '')
        .replace(/[\s_-]+/g, '-')
        .replace(/^-+|-+$/g, '');
};
exports.generateSlug = generateSlug;
// Validate email
const isValidEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
};
exports.isValidEmail = isValidEmail;
// Validate phone number
const isValidPhone = (phone) => {
    const phoneRegex = /^\+?[1-9]\d{1,14}$/;
    return phoneRegex.test(phone);
};
exports.isValidPhone = isValidPhone;
// Calculate percentage
const calculatePercentage = (value, total) => {
    if (total === 0)
        return 0;
    return Math.round((value / total) * 100 * 100) / 100;
};
exports.calculatePercentage = calculatePercentage;
// Parse sort string
const parseSort = (sortString) => {
    if (!sortString)
        return null;
    const [field, order = 'asc'] = sortString.split(':');
    return {
        field,
        order: order.toLowerCase() === 'desc' ? 'desc' : 'asc',
    };
};
exports.parseSort = parseSort;
// Chunk array
const chunk = (array, size) => {
    const chunks = [];
    for (let i = 0; i < array.length; i += size) {
        chunks.push(array.slice(i, i + size));
    }
    return chunks;
};
exports.chunk = chunk;
// Debounce function
const debounce = (func, wait) => {
    let timeout;
    return (...args) => {
        clearTimeout(timeout);
        timeout = setTimeout(() => func(...args), wait);
    };
};
exports.debounce = debounce;
// Throttle function
const throttle = (func, limit) => {
    let inThrottle;
    return (...args) => {
        if (!inThrottle) {
            func(...args);
            inThrottle = true;
            setTimeout(() => (inThrottle = false), limit);
        }
    };
};
exports.throttle = throttle;
//# sourceMappingURL=utils.js.map