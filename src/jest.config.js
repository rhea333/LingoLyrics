// tests live in ../test, mirror packages/
/** @type {import('jest').Config} */
module.exports = {
  rootDir: '.',
  // packages in roots too, else untested files drop out of coverage
  roots: ['<rootDir>/../test', '<rootDir>/packages'],
  testMatch: ['<rootDir>/../test/**/*.test.ts'],
  testEnvironment: 'node',
  transform: {
    '^.+\\.tsx?$': ['ts-jest', { tsconfig: '<rootDir>/tsconfig.json' }],
  },
  // test/ has no node_modules, point it back here
  modulePaths: ['<rootDir>/node_modules'],
  moduleNameMapper: {
    // same as tsconfig paths, deep imports are banned by eslint
    '^@lingolyrics/([^/]+)$': '<rootDir>/packages/$1/src',
  },
  collectCoverageFrom: ['<rootDir>/packages/*/src/**/*.ts'],
  coverageReporters: ['text-summary', 'lcov'],
  passWithNoTests: true,
};
