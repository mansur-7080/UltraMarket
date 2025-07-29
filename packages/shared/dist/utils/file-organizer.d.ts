/**
 * File Organization and Naming Conventions Utility
 * Professional file structure management for UltraMarket
 */
/**
 * Naming convention rules for different file types
 */
export declare const namingConventions: {
    component: {
        pattern: RegExp;
        description: string;
        examples: string[];
    };
    hook: {
        pattern: RegExp;
        description: string;
        examples: string[];
    };
    utility: {
        pattern: RegExp;
        description: string;
        examples: string[];
    };
    service: {
        pattern: RegExp;
        description: string;
        examples: string[];
    };
    model: {
        pattern: RegExp;
        description: string;
        examples: string[];
    };
    types: {
        pattern: RegExp;
        description: string;
        examples: string[];
    };
    test: {
        pattern: RegExp;
        description: string;
        examples: string[];
    };
    config: {
        pattern: RegExp;
        description: string;
        examples: string[];
    };
    constants: {
        pattern: RegExp;
        description: string;
        examples: string[];
    };
    middleware: {
        pattern: RegExp;
        description: string;
        examples: string[];
    };
};
/**
 * Directory naming conventions
 */
export declare const directoryConventions: {
    components: {
        pattern: RegExp;
        description: string;
        examples: string[];
    };
    features: {
        pattern: RegExp;
        description: string;
        examples: string[];
    };
    services: {
        pattern: RegExp;
        description: string;
        examples: string[];
    };
    utils: {
        pattern: RegExp;
        description: string;
        examples: string[];
    };
};
/**
 * Recommended file organization structure
 */
export declare const fileOrganization: {
    frontend: {
        'src/': {
            'components/': {
                'common/': string[];
                'layout/': string[];
                'forms/': string[];
            };
            'pages/': {
                'auth/': string[];
                'products/': string[];
                'orders/': string[];
            };
            'hooks/': string[];
            'services/': string[];
            'utils/': string[];
            'types/': string[];
            'constants/': string[];
            'store/': {
                'slices/': string[];
                'index.ts': null;
            };
            'styles/': string[];
        };
    };
    backend: {
        'src/': {
            'controllers/': string[];
            'services/': string[];
            'models/': string[];
            'middleware/': string[];
            'routes/': string[];
            'utils/': string[];
            'types/': string[];
            'config/': string[];
            'constants/': string[];
            '__tests__/': {
                'unit/': string[];
                'integration/': string[];
            };
        };
    };
    shared: {
        'src/': {
            'types/': string[];
            'utils/': string[];
            'constants/': string[];
            'validation/': string[];
            'middleware/': string[];
            'auth/': string[];
        };
    };
};
/**
 * Validate file name against naming conventions
 */
export declare function validateFileName(fileName: string, fileType: keyof typeof namingConventions): {
    isValid: boolean;
    message: string;
    suggestions?: string[];
};
/**
 * Validate directory name against naming conventions
 */
export declare function validateDirectoryName(dirName: string, dirType: keyof typeof directoryConventions): {
    isValid: boolean;
    message: string;
    suggestions?: string[];
};
/**
 * Suggest correct file name based on content and type
 */
export declare function suggestFileName(content: string, fileType: keyof typeof namingConventions): string[];
/**
 * Check if file is in correct directory based on its type and content
 */
export declare function validateFileLocation(filePath: string, content: string): {
    isValid: boolean;
    message: string;
    suggestedPath?: string;
};
/**
 * Analyze entire project structure
 */
export declare function analyzeProjectStructure(rootPath: string): Promise<{
    totalFiles: number;
    violations: Array<{
        file: string;
        issue: string;
        suggestion?: string;
    }>;
    summary: {
        correctlyNamed: number;
        incorrectlyNamed: number;
        correctlyPlaced: number;
        incorrectlyPlaced: number;
    };
}>;
/**
 * Generate project structure report
 */
export declare function generateStructureReport(analysis: Awaited<ReturnType<typeof analyzeProjectStructure>>): string;
declare const _default: {
    namingConventions: {
        component: {
            pattern: RegExp;
            description: string;
            examples: string[];
        };
        hook: {
            pattern: RegExp;
            description: string;
            examples: string[];
        };
        utility: {
            pattern: RegExp;
            description: string;
            examples: string[];
        };
        service: {
            pattern: RegExp;
            description: string;
            examples: string[];
        };
        model: {
            pattern: RegExp;
            description: string;
            examples: string[];
        };
        types: {
            pattern: RegExp;
            description: string;
            examples: string[];
        };
        test: {
            pattern: RegExp;
            description: string;
            examples: string[];
        };
        config: {
            pattern: RegExp;
            description: string;
            examples: string[];
        };
        constants: {
            pattern: RegExp;
            description: string;
            examples: string[];
        };
        middleware: {
            pattern: RegExp;
            description: string;
            examples: string[];
        };
    };
    directoryConventions: {
        components: {
            pattern: RegExp;
            description: string;
            examples: string[];
        };
        features: {
            pattern: RegExp;
            description: string;
            examples: string[];
        };
        services: {
            pattern: RegExp;
            description: string;
            examples: string[];
        };
        utils: {
            pattern: RegExp;
            description: string;
            examples: string[];
        };
    };
    fileOrganization: {
        frontend: {
            'src/': {
                'components/': {
                    'common/': string[];
                    'layout/': string[];
                    'forms/': string[];
                };
                'pages/': {
                    'auth/': string[];
                    'products/': string[];
                    'orders/': string[];
                };
                'hooks/': string[];
                'services/': string[];
                'utils/': string[];
                'types/': string[];
                'constants/': string[];
                'store/': {
                    'slices/': string[];
                    'index.ts': null;
                };
                'styles/': string[];
            };
        };
        backend: {
            'src/': {
                'controllers/': string[];
                'services/': string[];
                'models/': string[];
                'middleware/': string[];
                'routes/': string[];
                'utils/': string[];
                'types/': string[];
                'config/': string[];
                'constants/': string[];
                '__tests__/': {
                    'unit/': string[];
                    'integration/': string[];
                };
            };
        };
        shared: {
            'src/': {
                'types/': string[];
                'utils/': string[];
                'constants/': string[];
                'validation/': string[];
                'middleware/': string[];
                'auth/': string[];
            };
        };
    };
    validateFileName: typeof validateFileName;
    validateDirectoryName: typeof validateDirectoryName;
    suggestFileName: typeof suggestFileName;
    validateFileLocation: typeof validateFileLocation;
    analyzeProjectStructure: typeof analyzeProjectStructure;
    generateStructureReport: typeof generateStructureReport;
};
export default _default;
//# sourceMappingURL=file-organizer.d.ts.map