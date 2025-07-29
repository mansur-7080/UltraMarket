"use strict";
/**
 * File Organization and Naming Conventions Utility
 * Professional file structure management for UltraMarket
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.fileOrganization = exports.directoryConventions = exports.namingConventions = void 0;
exports.validateFileName = validateFileName;
exports.validateDirectoryName = validateDirectoryName;
exports.suggestFileName = suggestFileName;
exports.validateFileLocation = validateFileLocation;
exports.analyzeProjectStructure = analyzeProjectStructure;
exports.generateStructureReport = generateStructureReport;
const tslib_1 = require("tslib");
const fs_1 = require("fs");
const path_1 = tslib_1.__importDefault(require("path"));
// =================== NAMING CONVENTIONS ===================
/**
 * Naming convention rules for different file types
 */
exports.namingConventions = {
    // Component files (React/Vue)
    component: {
        pattern: /^[A-Z][a-zA-Z0-9]*\.tsx?$/,
        description: 'PascalCase for React components (e.g., UserProfile.tsx)',
        examples: ['UserProfile.tsx', 'ProductCard.tsx', 'ShoppingCart.tsx'],
    },
    // Hook files
    hook: {
        pattern: /^use[A-Z][a-zA-Z0-9]*\.ts$/,
        description: 'Hooks should start with "use" followed by PascalCase (e.g., useAuth.ts)',
        examples: ['useAuth.ts', 'useCart.ts', 'useLocalStorage.ts'],
    },
    // Utility files
    utility: {
        pattern: /^[a-z][a-zA-Z0-9]*\.ts$/,
        description: 'camelCase for utility functions (e.g., formatCurrency.ts)',
        examples: ['formatCurrency.ts', 'validateEmail.ts', 'apiClient.ts'],
    },
    // Service files
    service: {
        pattern: /^[a-z][a-zA-Z0-9]*\.service\.ts$/,
        description: 'camelCase followed by .service.ts (e.g., auth.service.ts)',
        examples: ['auth.service.ts', 'payment.service.ts', 'notification.service.ts'],
    },
    // Model/Type files
    model: {
        pattern: /^[a-z][a-zA-Z0-9]*\.model\.ts$/,
        description: 'camelCase followed by .model.ts (e.g., user.model.ts)',
        examples: ['user.model.ts', 'product.model.ts', 'order.model.ts'],
    },
    // Type definition files
    types: {
        pattern: /^[a-z][a-zA-Z0-9]*\.types\.ts$/,
        description: 'camelCase followed by .types.ts (e.g., api.types.ts)',
        examples: ['api.types.ts', 'auth.types.ts', 'common.types.ts'],
    },
    // Test files
    test: {
        pattern: /^[a-z][a-zA-Z0-9]*\.(test|spec)\.ts$/,
        description: 'camelCase followed by .test.ts or .spec.ts',
        examples: ['auth.test.ts', 'userService.spec.ts', 'utils.test.ts'],
    },
    // Configuration files
    config: {
        pattern: /^[a-z][a-zA-Z0-9]*\.config\.(js|ts|json)$/,
        description: 'camelCase followed by .config.ext',
        examples: ['database.config.ts', 'api.config.js', 'app.config.json'],
    },
    // Constants files
    constants: {
        pattern: /^[a-z][a-zA-Z0-9]*\.constants\.ts$/,
        description: 'camelCase followed by .constants.ts',
        examples: ['api.constants.ts', 'app.constants.ts', 'validation.constants.ts'],
    },
    // Middleware files
    middleware: {
        pattern: /^[a-z][a-zA-Z0-9]*\.middleware\.ts$/,
        description: 'camelCase followed by .middleware.ts',
        examples: ['auth.middleware.ts', 'cors.middleware.ts', 'logging.middleware.ts'],
    },
};
/**
 * Directory naming conventions
 */
exports.directoryConventions = {
    // Component directories
    components: {
        pattern: /^[A-Z][a-zA-Z0-9]*$/,
        description: 'PascalCase for component directories',
        examples: ['UserProfile', 'ProductCard', 'ShoppingCart'],
    },
    // Feature directories
    features: {
        pattern: /^[a-z][a-zA-Z0-9]*$/,
        description: 'camelCase for feature directories',
        examples: ['authentication', 'productCatalog', 'orderManagement'],
    },
    // Service directories
    services: {
        pattern: /^[a-z][a-zA-Z0-9]*$/,
        description: 'camelCase for service directories',
        examples: ['authService', 'paymentService', 'notificationService'],
    },
    // Utility directories
    utils: {
        pattern: /^[a-z][a-zA-Z0-9]*$/,
        description: 'camelCase for utility directories',
        examples: ['dateUtils', 'validationUtils', 'formatUtils'],
    },
};
// =================== FILE ORGANIZATION RULES ===================
/**
 * Recommended file organization structure
 */
exports.fileOrganization = {
    // Frontend structure
    frontend: {
        'src/': {
            'components/': {
                'common/': ['Button.tsx', 'Input.tsx', 'Modal.tsx'],
                'layout/': ['Header.tsx', 'Footer.tsx', 'Sidebar.tsx'],
                'forms/': ['LoginForm.tsx', 'RegisterForm.tsx', 'CheckoutForm.tsx'],
            },
            'pages/': {
                'auth/': ['LoginPage.tsx', 'RegisterPage.tsx', 'ForgotPasswordPage.tsx'],
                'products/': ['ProductListPage.tsx', 'ProductDetailPage.tsx'],
                'orders/': ['OrderHistoryPage.tsx', 'OrderDetailPage.tsx'],
            },
            'hooks/': ['useAuth.ts', 'useCart.ts', 'useLocalStorage.ts'],
            'services/': ['api.service.ts', 'auth.service.ts', 'cart.service.ts'],
            'utils/': ['formatCurrency.ts', 'validateEmail.ts', 'dateUtils.ts'],
            'types/': ['api.types.ts', 'auth.types.ts', 'product.types.ts'],
            'constants/': ['api.constants.ts', 'app.constants.ts'],
            'store/': {
                'slices/': ['authSlice.ts', 'cartSlice.ts', 'productSlice.ts'],
                'index.ts': null,
            },
            'styles/': ['globals.css', 'variables.css', 'components.css'],
        },
    },
    // Backend structure
    backend: {
        'src/': {
            'controllers/': ['auth.controller.ts', 'product.controller.ts', 'order.controller.ts'],
            'services/': ['auth.service.ts', 'product.service.ts', 'order.service.ts'],
            'models/': ['user.model.ts', 'product.model.ts', 'order.model.ts'],
            'middleware/': ['auth.middleware.ts', 'cors.middleware.ts', 'logging.middleware.ts'],
            'routes/': ['auth.routes.ts', 'product.routes.ts', 'order.routes.ts'],
            'utils/': ['database.ts', 'logger.ts', 'validation.ts'],
            'types/': ['api.types.ts', 'database.types.ts'],
            'config/': ['database.config.ts', 'app.config.ts', 'redis.config.ts'],
            'constants/': ['api.constants.ts', 'error.constants.ts'],
            '__tests__/': {
                'unit/': ['auth.service.test.ts', 'product.service.test.ts'],
                'integration/': ['auth.integration.test.ts', 'api.integration.test.ts'],
            },
        },
    },
    // Shared library structure
    shared: {
        'src/': {
            'types/': ['common.types.ts', 'api.types.ts', 'auth.types.ts'],
            'utils/': ['formatters.ts', 'validators.ts', 'helpers.ts'],
            'constants/': ['api.constants.ts', 'app.constants.ts'],
            'validation/': ['schemas.ts', 'rules.ts'],
            'middleware/': ['error-handler.ts', 'security.ts'],
            'auth/': ['jwt-manager.ts', 'permissions.ts'],
        },
    },
};
// =================== VALIDATION FUNCTIONS ===================
/**
 * Validate file name against naming conventions
 */
function validateFileName(fileName, fileType) {
    const convention = exports.namingConventions[fileType];
    if (!convention) {
        return {
            isValid: false,
            message: `Unknown file type: ${fileType}`,
        };
    }
    const isValid = convention.pattern.test(fileName);
    if (isValid) {
        return {
            isValid: true,
            message: 'File name follows naming conventions',
        };
    }
    return {
        isValid: false,
        message: `File name "${fileName}" does not follow ${fileType} naming convention: ${convention.description}`,
        suggestions: convention.examples,
    };
}
/**
 * Validate directory name against naming conventions
 */
function validateDirectoryName(dirName, dirType) {
    const convention = exports.directoryConventions[dirType];
    if (!convention) {
        return {
            isValid: false,
            message: `Unknown directory type: ${dirType}`,
        };
    }
    const isValid = convention.pattern.test(dirName);
    if (isValid) {
        return {
            isValid: true,
            message: 'Directory name follows naming conventions',
        };
    }
    return {
        isValid: false,
        message: `Directory name "${dirName}" does not follow ${dirType} naming convention: ${convention.description}`,
        suggestions: convention.examples,
    };
}
/**
 * Suggest correct file name based on content and type
 */
function suggestFileName(content, fileType) {
    const suggestions = [];
    // Extract potential names from content
    const extractors = {
        component: () => {
            const matches = content.match(/export\s+(?:default\s+)?(?:function|const|class)\s+([A-Z][a-zA-Z0-9]*)/g);
            return (matches
                ?.map((match) => {
                const name = match.split(/\s+/).pop();
                return name ? `${name}.tsx` : null;
            })
                .filter(Boolean) || []);
        },
        hook: () => {
            const matches = content.match(/export\s+(?:default\s+)?(?:function|const)\s+(use[A-Z][a-zA-Z0-9]*)/g);
            return (matches
                ?.map((match) => {
                const name = match.split(/\s+/).pop();
                return name ? `${name}.ts` : null;
            })
                .filter(Boolean) || []);
        },
        service: () => {
            const matches = content.match(/class\s+([A-Z][a-zA-Z0-9]*Service)/g);
            return (matches
                ?.map((match) => {
                const name = match.split(/\s+/).pop();
                if (name) {
                    const serviceName = name.replace('Service', '').toLowerCase();
                    return `${serviceName}.service.ts`;
                }
                return null;
            })
                .filter(Boolean) || []);
        },
        model: () => {
            const matches = content.match(/(?:interface|type|class)\s+([A-Z][a-zA-Z0-9]*)/g);
            return (matches
                ?.map((match) => {
                const name = match.split(/\s+/).pop();
                return name ? `${name.toLowerCase()}.model.ts` : null;
            })
                .filter(Boolean) || []);
        },
        utility: () => {
            const matches = content.match(/export\s+(?:default\s+)?(?:function|const)\s+([a-z][a-zA-Z0-9]*)/g);
            return (matches
                ?.map((match) => {
                const name = match.split(/\s+/).pop();
                return name ? `${name}.ts` : null;
            })
                .filter(Boolean) || []);
        },
    };
    const extractor = extractors[fileType];
    if (extractor) {
        const extracted = extractor();
        if (extracted && Array.isArray(extracted)) {
            suggestions.push(...extracted);
        }
    }
    // Add generic suggestions based on file type
    suggestions.push(...exports.namingConventions[fileType].examples);
    return [...new Set(suggestions)]; // Remove duplicates
}
// =================== FILE ORGANIZATION CHECKER ===================
/**
 * Check if file is in correct directory based on its type and content
 */
function validateFileLocation(filePath, content) {
    const fileName = path_1.default.basename(filePath);
    const dirPath = path_1.default.dirname(filePath);
    // Determine file type based on content and name
    const fileType = determineFileType(fileName, content);
    if (!fileType) {
        return {
            isValid: false,
            message: 'Could not determine file type',
        };
    }
    // Check if file is in appropriate directory
    const expectedDirs = getExpectedDirectories(fileType);
    const isInCorrectDir = expectedDirs.some((dir) => dirPath.includes(dir));
    if (isInCorrectDir) {
        return {
            isValid: true,
            message: 'File is in correct directory',
        };
    }
    return {
        isValid: false,
        message: `File "${fileName}" should be in one of these directories: ${expectedDirs.join(', ')}`,
        suggestedPath: path_1.default.join(expectedDirs[0], fileName),
    };
}
/**
 * Determine file type based on name and content
 */
function determineFileType(fileName, content) {
    // Check by file name patterns
    for (const [type, convention] of Object.entries(exports.namingConventions)) {
        if (convention.pattern.test(fileName)) {
            return type;
        }
    }
    // Check by content patterns
    if (content.includes('export default function') && content.includes('return (')) {
        return 'component';
    }
    if (content.includes('export function use') || content.includes('export const use')) {
        return 'hook';
    }
    if (content.includes('class') && content.includes('Service')) {
        return 'service';
    }
    if (content.includes('interface') || content.includes('type')) {
        return 'types';
    }
    if (content.includes('export const') && content.includes('=')) {
        return 'constants';
    }
    return null;
}
/**
 * Get expected directories for file type
 */
function getExpectedDirectories(fileType) {
    const dirMap = {
        component: ['components', 'pages'],
        hook: ['hooks'],
        utility: ['utils'],
        service: ['services'],
        model: ['models'],
        types: ['types'],
        test: ['__tests__', 'tests'],
        config: ['config'],
        constants: ['constants'],
        middleware: ['middleware'],
    };
    return dirMap[fileType] || [];
}
// =================== BULK OPERATIONS ===================
/**
 * Analyze entire project structure
 */
async function analyzeProjectStructure(rootPath) {
    const violations = [];
    let totalFiles = 0;
    let correctlyNamed = 0;
    let incorrectlyNamed = 0;
    let correctlyPlaced = 0;
    let incorrectlyPlaced = 0;
    async function analyzeDirectory(dirPath) {
        const entries = await fs_1.promises.readdir(dirPath, { withFileTypes: true });
        for (const entry of entries) {
            const fullPath = path_1.default.join(dirPath, entry.name);
            if (entry.isDirectory()) {
                // Skip node_modules and other ignored directories
                if (!['node_modules', '.git', 'dist', 'build'].includes(entry.name)) {
                    await analyzeDirectory(fullPath);
                }
            }
            else if (entry.isFile()) {
                totalFiles++;
                // Analyze file
                try {
                    const content = await fs_1.promises.readFile(fullPath, 'utf-8');
                    const relativePath = path_1.default.relative(rootPath, fullPath);
                    // Check naming convention
                    const fileType = determineFileType(entry.name, content);
                    if (fileType) {
                        const nameValidation = validateFileName(entry.name, fileType);
                        if (nameValidation.isValid) {
                            correctlyNamed++;
                        }
                        else {
                            incorrectlyNamed++;
                            violations.push({
                                file: relativePath,
                                issue: nameValidation.message,
                                suggestion: nameValidation.suggestions?.[0],
                            });
                        }
                        // Check file location
                        const locationValidation = validateFileLocation(relativePath, content);
                        if (locationValidation.isValid) {
                            correctlyPlaced++;
                        }
                        else {
                            incorrectlyPlaced++;
                            violations.push({
                                file: relativePath,
                                issue: locationValidation.message,
                                suggestion: locationValidation.suggestedPath,
                            });
                        }
                    }
                }
                catch (error) {
                    violations.push({
                        file: path_1.default.relative(rootPath, fullPath),
                        issue: `Could not analyze file: ${error}`,
                    });
                }
            }
        }
    }
    await analyzeDirectory(rootPath);
    return {
        totalFiles,
        violations,
        summary: {
            correctlyNamed,
            incorrectlyNamed,
            correctlyPlaced,
            incorrectlyPlaced,
        },
    };
}
/**
 * Generate project structure report
 */
function generateStructureReport(analysis) {
    const { totalFiles, violations, summary } = analysis;
    let report = '# Project Structure Analysis Report\n\n';
    report += '## Summary\n';
    report += `- Total files analyzed: ${totalFiles}\n`;
    report += `- Correctly named files: ${summary.correctlyNamed}\n`;
    report += `- Incorrectly named files: ${summary.incorrectlyNamed}\n`;
    report += `- Correctly placed files: ${summary.correctlyPlaced}\n`;
    report += `- Incorrectly placed files: ${summary.incorrectlyPlaced}\n\n`;
    if (violations.length > 0) {
        report += '## Issues Found\n\n';
        violations.forEach((violation, index) => {
            report += `### ${index + 1}. ${violation.file}\n`;
            report += `**Issue:** ${violation.issue}\n`;
            if (violation.suggestion) {
                report += `**Suggestion:** ${violation.suggestion}\n`;
            }
            report += '\n';
        });
    }
    else {
        report += '## ✅ No issues found! Project structure follows all conventions.\n';
    }
    return report;
}
// =================== EXPORT ===================
exports.default = {
    namingConventions: exports.namingConventions,
    directoryConventions: exports.directoryConventions,
    fileOrganization: exports.fileOrganization,
    validateFileName,
    validateDirectoryName,
    suggestFileName,
    validateFileLocation,
    analyzeProjectStructure,
    generateStructureReport,
};
//# sourceMappingURL=file-organizer.js.map