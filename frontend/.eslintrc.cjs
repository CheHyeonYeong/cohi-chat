// .eslintrc.cjs
module.exports = {
  root: true,

  env: {
    browser: true,
    es2021: true,
    node: true,
  },

  parser: '@typescript-eslint/parser',

  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module',
    ecmaFeatures: { jsx: true },
  },

  plugins: ['react', 'react-hooks', 'unused-imports'],

  extends: ['eslint:recommended', 'plugin:react/recommended', 'plugin:react-hooks/recommended', 'prettier'],

  settings: {
    react: {
      version: 'detect',
    },
  },

  rules: {
    camelcase: ['error', { properties: 'never' }],
    'unused-imports/no-unused-imports': 'error',
    'no-unused-vars': ['warn', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
    'react-hooks/rules-of-hooks': 'error',
    'react-hooks/exhaustive-deps': 'warn',
    'react/react-in-jsx-scope': 'off',
    'no-console': 'off',
  },

  overrides: [
    {
      files: ['*.cjs'],
      env: { node: true },
      parserOptions: {
        sourceType: 'script',
      },
    },
  ],
};
