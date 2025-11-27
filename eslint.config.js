// https://docs.expo.dev/guides/using-eslint/
const { defineConfig } = require('eslint/config');
const expoConfig = require('eslint-config-expo/flat');

module.exports = defineConfig([
  expoConfig,
  {
    ignores: ['dist/*'],
  },
  {
    rules: {
      'no-use-before-define': ['error', { functions: true, classes: true, variables: true }],
      '@typescript-eslint/no-use-before-define': [
        'error',
        { functions: true, classes: true, variables: true, enums: true, typedefs: true }
      ],
    },
  },
]);
