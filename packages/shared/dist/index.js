"use strict";
/**
 * 🚀 ULTRAMARKET SHARED LIBRARY
 * Main entry point for shared components, utilities, and types
 * @version 1.0.0
 * @author UltraMarket Team
 */
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
// API Client and Types
tslib_1.__exportStar(require("./api/types"), exports);
tslib_1.__exportStar(require("./api/client"), exports);
// Error Handling
tslib_1.__exportStar(require("./error-handling/ErrorBoundary"), exports);
// Components (will be added later)
// export * from './components';
// Utilities (will be added later)
// export * from './utils';
// Constants (will be added later)
// export * from './constants';
// Hooks (will be added later)
// export * from './hooks';
//# sourceMappingURL=index.js.map