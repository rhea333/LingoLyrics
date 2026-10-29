// test/ sits outside src/, so pull in the src config by path
const path = require('path');

module.exports = {
  root: true,
  extends: ['../src/.eslintrc.cjs'],
  env: { jest: true },
  rules: {
    // tests import jest helpers etc from devDependencies
    // no package.json above test/, point at src/
    'import/no-extraneous-dependencies': [
      'error',
      { devDependencies: true, packageDir: path.join(__dirname, '../src') },
    ],
  },
};
