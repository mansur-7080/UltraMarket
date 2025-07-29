"use strict";
/**
 * 🚀 ULTRAMARKET SHARED LIBRARY
 * Main entry point for shared components, utilities, and types
 * @version 1.0.0
 * @author UltraMarket Team
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", { value: true });
// API Client and Types
__exportStar(require("./api/types"), exports);
__exportStar(require("./api/client"), exports);
// Logging
__exportStar(require("./logging/logger"), exports);
// Error Handling
// export * from './error-handling/ErrorBoundary';
// Utils
// export * from './utils/errors';
// Components (will be added later)
// export * from './components';
// Utilities (will be added later)
// export * from './utils';
// Constants (will be added later)
// export * from './constants';
// Hooks (will be added later)
// export * from './hooks';
