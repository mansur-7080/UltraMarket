module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src'],
  testMatch: [
    '**/__tests__/**/*.test.ts',
    '**/__tests__/**/*.test.js',
    '**/?(*.)+(spec|test).ts',
    '**/?(*.)+(spec|test).js'
  ],
  collectCoverageFrom: [
    'src/**/*.{ts,js}',
    '!src/**/*.d.ts',
    '!src/__tests__/**',
    '!src/**/*.test.{ts,js}',
    '!src/**/*.spec.{ts,js}'
  ],
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 70,
      lines: 70,
      statements: 70
    }
  },
  setupFilesAfterEnv: ['<rootDir>/src/__tests__/setup.js'],
  testTimeout: 60000,
  verbose: true,
  forceExit: true,
  clearMocks: true,
  resetMocks: true,
  restoreMocks: true,
            transform: {
            '^.+\\.ts$': ['ts-jest', {
              tsconfig: {
                strict: false,
                noImplicitAny: false,
                noImplicitReturns: false,
                noImplicitThis: false,
                noUnusedLocals: false,
                noUnusedParameters: false,
                exactOptionalPropertyTypes: false,
                noImplicitOverride: false,
                noPropertyAccessFromIndexSignature: false,
                noUncheckedIndexedAccess: false,
                allowUnusedLabels: true,
                allowUnreachableCode: true
              }
            }]
          }
}; 