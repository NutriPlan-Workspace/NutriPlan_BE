import eslint from '@eslint/js';
import prettierConfig from 'eslint-config-prettier';
import importPlugin from 'eslint-plugin-import';
import prettierPlugin from 'eslint-plugin-prettier';
import simpleImportSort from 'eslint-plugin-simple-import-sort';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  eslint.configs.recommended,
  tseslint.configs.recommended,
  prettierConfig,
  {
    plugins: {
      prettier: prettierPlugin,
      '@typescript-eslint': tseslint.plugin,
      import: importPlugin,
      'simple-import-sort': simpleImportSort,
    },
    rules: {
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_' },
      ],
      '@typescript-eslint/no-inferrable-types': 'warn',
      '@typescript-eslint/no-non-null-assertion': 'warn',
      '@typescript-eslint/no-var-requires': 'error',
      '@typescript-eslint/ban-ts-comment': 'warn',
      '@typescript-eslint/no-empty-function': 'warn',
      '@typescript-eslint/prefer-as-const': 'warn',
      eqeqeq: 'error',
      'no-console': 'warn',
      'prettier/prettier': 'error',
      'arrow-body-style': [2, 'as-needed'],
      'class-methods-use-this': 0,
      'import/imports-first': 0,
      'import/newline-after-import': 1,
      'import/no-dynamic-require': 0,
      'import/no-extraneous-dependencies': 0,
      'import/no-named-as-default': 0,
      'import/prefer-default-export': 0,
      'max-len': 0,
      'newline-per-chained-call': 0,
      'no-confusing-arrow': 0,
      'no-use-before-define': 0,
      'prefer-template': 2,
      'require-yield': 0,
      camelcase: [2, { ignoreDestructuring: true, properties: 'never' }],
      'no-underscore-dangle': ['error', { allow: ['_id'] }],
      'simple-import-sort/imports': [
        'error',
        {
          groups: [
            [
              '^(assert|buffer|child_process|cluster|console|constants|crypto|dgram|dns|domain|events|fs|http|https|module|net|os|path|punycode|querystring|readline|repl|stream|string_decoder|sys|timers|tls|tty|url|util|vm|zlib|freelist|v8|process|async_hooks|http2|perf_hooks)(/.*|$)',
            ],
            // Packages. related packages come first.
            ['^@?\\w'],
            // Internal packages.
            ['^(@)(/.*|$)'],
            // Side effect imports.
            ['^\\u0000'],
            // Parent imports. Put `..` last.
            ['^\\.\\.(?!/?$)', '^\\.\\./?$'],
            // Other relative imports. Put same-folder imports and `.` last.
            ['^\\./(?=.*/)(?!/?$)', '^\\.(?!/?$)', '^\\./?$'],
            // Style imports.
            ['^.+\\.s?css$'],
          ],
        },
      ],
      'simple-import-sort/exports': 'error',
    },
  },
);
