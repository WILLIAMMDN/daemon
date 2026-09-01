module.exports = {
  preset: 'jest-preset-angular',
  setupFilesAfterEnv: ['<rootDir>/setup-jest.ts'],
  testEnvironment: 'jsdom',
  testMatch: ['<rootDir>/src/**/*.spec.ts', '**/src/**/*.spec.ts'],
  testPathIgnorePatterns: ['/node_modules/', '/e2e/', '/playwright/', '/tests/firestore/', '\\\\e2e\\\\', '\\\\playwright\\\\'],
  moduleNameMapper: {
    '\\.(css)$': '<rootDir>/test-style-mock.js',
    '^deep-chat$': '<rootDir>/test-deep-chat-mock.js',
    '^@core/(.*)$': '<rootDir>/src/app/core/$1',
    '^@shared/(.*)$': '<rootDir>/src/app/shared/$1',
    '^@features/(.*)$': '<rootDir>/src/app/features/$1',
    '^@env/(.*)$': '<rootDir>/src/environments/$1',
  },
  coverageThreshold: {
    global: {
      branches: 30,
      functions: 35,
      lines: 55,
      statements: 55,
    },
  },
};
