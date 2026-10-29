// tests live in ../test, mirror packages/
/** @type {import('jest').Config} */
module.exports = {
  rootDir: '.',
  roots: ['<rootDir>/../test'],
  testEnvironment: 'node',
  transform: {
    '^.+\\.tsx?$': ['ts-jest', { tsconfig: '<rootDir>/tsconfig.json' }],
  },
  // test/ has no node_modules, point it back here
  modulePaths: ['<rootDir>/node_modules'],
  moduleNameMapper: {
    '^@lingolyrics/(.*)$': '<rootDir>/packages/$1/src',
  },
  collectCoverageFrom: ['<rootDir>/packages/*/src/**/*.ts'],
  coverageReporters: ['text-summary', 'lcov'],
  passWithNoTests: true,
};
