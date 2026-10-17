// Minimal lint setup. The point is to enforce the project's code rules
// (no `any`, no unused code), not to add a second type checker.
import js from '@eslint/js';
import { defineConfig } from 'eslint/config';
import tseslint from 'typescript-eslint';

export default defineConfig(
  {
    ignores: [
      'node_modules/**',
      'dist/**',
      'web/client/dist/**',
      // Fixtures contain intentional syntax errors; ESLint cannot parse them.
      '**/fixtures/**',
    ],
  },
  js.configs.recommended,
  tseslint.configs.recommended,
  {
    rules: {
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
      // TypeScript (checkJs) already reports undefined identifiers, with
      // knowledge of Node and DOM globals that ESLint does not have.
      'no-undef': 'off',
    },
  },
);
