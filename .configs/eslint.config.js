import prettier from 'eslint-config-prettier';
import jsdoc from 'eslint-plugin-jsdoc';
import unusedImports from 'eslint-plugin-unused-imports';
import globals from 'globals';

export default [
  {
    files: ['**/*.js'],
    plugins: { jsdoc, 'unused-imports': unusedImports },
    languageOptions: {
      ecmaVersion: 2024,
      sourceType: 'module',
      globals: {
        ...globals.browser,
        ...globals.es2021,
        ...globals.node,
      },
    },
    rules: {
      semi: ['error', 'always'],
      indent: ['error', 2, { SwitchCase: 1 }],
      'no-var': 'error',
      'prefer-const': 'error',
      eqeqeq: ['error', 'always'],
      'no-undef': 'error',
      'no-unused-vars': 'off',
      'unused-imports/no-unused-imports': 'error',
      'unused-imports/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
      'no-console': 'off',
      'no-empty': ['error', { allowEmptyCatch: false }],

      // JSDoc enforcement
      'jsdoc/require-jsdoc': [
        'warn',
        {
          require: { FunctionDeclaration: true },
          checkConstructors: false,
        },
      ],
      'jsdoc/require-param-type': 'warn',
      'jsdoc/require-returns-type': 'warn',
      'jsdoc/valid-types': 'warn',
    },
  },
  {
    files: ['**/*.test.js', 'tests/**/*.js'],
    languageOptions: {
      globals: {
        ...globals.mocha,
      },
    },
    rules: {
      'jsdoc/require-jsdoc': 'off',
      'no-undef': 'off',
      'no-unused-vars': 'off',
      'unused-imports/no-unused-vars': 'off',
    },
  },
  {
    ignores: ['node_modules/', 'src/vendor/', 'templates/'],
  },
  prettier,
];
