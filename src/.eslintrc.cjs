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
    // packages export everything from index, no reaching inside
    'no-restricted-imports': [
      'error',
      { patterns: [{ group: ['@lingolyrics/*/*'], message: 'import from the package root' }] },
    ],
  },
  overrides: [
    {
      // expo app: react rules, its own tsconfig
      files: ['apps/learner/**/*.ts', 'apps/learner/**/*.tsx'],
      parserOptions: {
        project: './apps/learner/tsconfig.json',
        tsconfigRootDir: __dirname,
      },
      extends: ['airbnb', 'airbnb/hooks', 'airbnb-typescript', 'prettier'],
      settings: {
        'import/resolver': {
          typescript: { project: `${__dirname}/apps/learner/tsconfig.json` },
        },
      },
      rules: {
        // new jsx transform, no React import
        'react/react-in-jsx-scope': 'off',
        'react/require-default-props': 'off',
        // expo StatusBar style is a string, not a style object
        'react/style-prop-object': ['error', { allow: ['StatusBar'] }],
        // airbnb turns this back on, we stick to named exports
        'import/prefer-default-export': 'off',
        // rn puts StyleSheet.create at the bottom of the file
        '@typescript-eslint/no-use-before-define': ['error', { variables: false }],
        // fixtures are files, not a package to import through
        'import/no-relative-packages': 'off',
        // poc screens log results to the metro console on purpose
        'no-console': 'off',
        'import/no-extraneous-dependencies': [
          'error',
          { packageDir: [`${__dirname}/apps/learner`, __dirname] },
        ],
      },
    },
    {
      // type declarations for untyped modules
      files: ['**/*.d.ts'],
      rules: { 'max-classes-per-file': 'off' },
    },
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
