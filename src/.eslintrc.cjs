// airbnb ts rules, prettier turns off the formatting ones
module.exports = {
  root: true,
  parser: '@typescript-eslint/parser',
  parserOptions: {
    project: './tsconfig.json',
    tsconfigRootDir: __dirname,
  },
  plugins: ['@typescript-eslint'],
  extends: [
    'airbnb-base',
    'airbnb-typescript/base',
    'plugin:@typescript-eslint/recommended',
    'prettier',
  ],
  env: { node: true, es2022: true },
  settings: {
    // let import plugin follow the tsconfig paths
    'import/resolver': { typescript: { project: `${__dirname}/tsconfig.json` } },
    // workspace packages are ours, not npm deps
    'import/internal-regex': '^@lingolyrics/',
  },
  rules: {
    // named exports only, easier to grep
    'import/prefer-default-export': 'off',
    'import/no-default-export': 'error',
  },
  overrides: [
    {
      // scripts are cli tools, printing is the point
      files: ['scripts/**/*.ts'],
      rules: {
        'no-console': 'off',
        'import/no-extraneous-dependencies': ['error', { devDependencies: true }],
      },
    },
  ],
};
