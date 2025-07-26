// backend/jest.config.js
module.exports = {
  // Tells Jest to run this file before the test environment is set up for each test file.
  // The path is relative to the root of your Jest configuration (which is usually your project root).
  setupFilesAfterEnv: [
    '<rootDir>/jest.setup.js', // Assuming jest.setup.js is directly in the backend root
  ],

  // This is often needed for modern Node.js modules or packages that use ES Modules syntax
  // especially with Redis client or other libraries in node_modules.
  // It tells Jest not to ignore these specific node_modules for transformation.
  transformIgnorePatterns: [
    '/node_modules/(?!@redis)',
  ],

  // Optional: If you want to explicitly set the test environment for Node.js backend tests
  testEnvironment: 'node',

  // Other configurations can go here as needed, e.g., to collect code coverage
  // collectCoverage: true,
  // coverageDirectory: 'coverage',
  // testMatch: ['**/tests/**/*.test.js'],
};