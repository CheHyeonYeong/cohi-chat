import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import tseslint from 'typescript-eslint'
import reactCompiler from 'eslint-plugin-react-compiler'
import preferArrowFunctions from 'eslint-plugin-prefer-arrow-functions'

export default tseslint.config(
  { ignores: ['dist'] },
  {
    extends: [js.configs.recommended, ...tseslint.configs.recommended],
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
    },
    plugins: {
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
      'react-compiler': reactCompiler,
      'prefer-arrow-functions': preferArrowFunctions,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      'react-compiler/react-compiler': 'error',
      'react-refresh/only-export-components': [
        'warn',
        { allowConstantExport: true, extraHOCs: ['createLink'] },
      ],
      'indent': ['error', 4],
      'prefer-arrow-functions/prefer-arrow-functions': ['error', {
        returnStyle: 'implicit',
        classPropertiesAllowed: false,
        disallowPrototype: false,
        singleReturnOnly: false,
      }],
      'no-restricted-syntax': ['error', {
        selector: 'MemberExpression[object.name="React"]',
        message: 'React. namespace 사용 금지. import { X } from "react" 사용',
      }],
    },
  },
)
