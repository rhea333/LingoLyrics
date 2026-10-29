// test/ sits outside src/, so pull in the src config by path
module.exports = {
  root: true,
  extends: ['../src/.eslintrc.cjs'],
  env: { jest: true },
  rules: {
    // tests import jest helpers etc from devDependencies
    'import/no-extraneous-dependencies': ['error', { devDependencies: true }],
  },
};
