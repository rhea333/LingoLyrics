// test/ sits outside src/, so pull in the src config by path
const path = require('path');

module.exports = {
  root: true,
  extends: ['../src/.eslintrc.cjs'],
  env: { jest: true },
  // Treat the virtual React Native mock as internal so eslint-plugin-import
  // does not search for a package.json above this sibling test directory.
  overrides: [
    {
      files: ['packages/anki/anki-droid.test.ts'],
      settings: { 'import/internal-regex': '^(@lingolyrics/|react-native$)' },
    },
  ],
  rules: {
    // tests import jest helpers etc from devDependencies
    // no package.json above test/, point at src/
    'import/no-extraneous-dependencies': [
      'error',
      { devDependencies: true, packageDir: path.join(__dirname, '../src') },
    ],
  },
};
