import globals from 'globals';
import tseslint from 'typescript-eslint';
import eslintPluginPrettierRecommended from 'eslint-plugin-prettier/recommended';

export default [
  // Global ignores
  {
    ignores: [
      'dist/',
      'docs/',
      'node_modules/',
      '*.config.js',
      '*.config.cjs',
      '*.log',
    ],
  },

  // Base config for all files
  {
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.node,
      },
    },
  },

  // TypeScript files
  ...tseslint.configs.recommended,

  // Prettier config - must be last
  eslintPluginPrettierRecommended,

  // Custom rules
  {
    rules: {
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/no-unused-vars': [
        'warn',
        { argsIgnorePattern: '^_' },
      ],
    },
  },
];
