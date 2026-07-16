module.exports = {
  preset: 'jest-preset-angular',
  setupFilesAfterEnv: ['<rootDir>/setup-jest.ts'],
  testEnvironment: 'jsdom',
  testPathIgnorePatterns: ['<rootDir>/e2e/', '<rootDir>/playwright/'],
  moduleNameMapper: {
    '\\.(css)$': '<rootDir>/test-style-mock.js',
    '^@core/(.*)$': '<rootDir>/src/app/core/$1',
    '^@shared/(.*)$': '<rootDir>/src/app/shared/$1',
    '^@features/(.*)$': '<rootDir>/src/app/features/$1',
    '^@env/(.*)$': '<rootDir>/src/environments/$1'
  },
  coverageThreshold: {
    global: {
      branches: 30,
      functions: 35,
      lines: 55,
      statements: 55
    }
  }
};
