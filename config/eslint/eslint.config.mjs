import js from '@eslint/js'
import globals from 'globals'
import tseslint from 'typescript-eslint'
import pluginReact from 'eslint-plugin-react'
import pluginReactHooks from 'eslint-plugin-react-hooks'
import jest from 'eslint-plugin-jest'

import { defineConfig } from 'eslint/config'
import prettier from 'eslint-plugin-prettier'
import importPlugin from 'eslint-plugin-import'

export default defineConfig([
  tseslint.configs.recommended,
  pluginReact.configs.flat.recommended,
  pluginReactHooks.configs.flat.recommended,
  {
    files: ['**/*.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],
    plugins: {
      js,
      prettier,
      import: importPlugin,
      jest,
    },
    extends: ['js/recommended'],
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.node,
        ...globals.jest,
      },
    },
    rules: {
      '@typescript-eslint/no-empty-object-type': 'off',
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-unused-vars': 'error',
      'arrow-body-style': ['error', 'as-needed'],
      'no-console': 'warn',
      'no-redeclare': 'off',
      'no-unused-vars': 'off',
      'prettier/prettier': 'error',
      'react/function-component-definition': [
        'error',
        {
          namedComponents: 'arrow-function',
          unamedComponents: 'function-expression',
        },
      ],
      'react/react-in-jsx-scope': 'off',
    },
    ignores: ['/**/*.js', '/**/*.mjs'],
  },
])
