import eslintPluginAstro from 'eslint-plugin-astro'
import eslintPluginPrettier from 'eslint-plugin-prettier/recommended'
import unusedImports from 'eslint-plugin-unused-imports'
import simpleImportSort from 'eslint-plugin-simple-import-sort'
import tsParser from '@typescript-eslint/parser'
import prettierConfig from './prettier.config.mjs'

export default [
  {
    ignores: [
      'dist/**',
      'node_modules/**',
      '.astro/**',
      'build/**',
      'public/**',
      '.cache/**',
      'studio/dist/**',
      'studio/.sanity/**',
      'src/lib/sanity/sanity.types.ts',
    ],
  },

  ...eslintPluginAstro.configs['flat/recommended'],

  {
    files: ['**/*.ts'],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
      },
    },
  },

  {
    files: ['**/*.{js,ts,astro}'],
    plugins: {
      'unused-imports': unusedImports,
      'simple-import-sort': simpleImportSort,
    },
    rules: {
      'no-console': process.env.NODE_ENV === 'production' ? 'warn' : 'off',
      // 'no-unused-vars': 'off',

      'simple-import-sort/imports': [
        'error',
        {
          groups: [
            ['^\\u0000'],
            ['^@?\\w'],
            ['^@lib', '^@components', '^@layouts', '^@'],
            ['^\\.'],
            ['^.+\\.(module.css|module.scss)$'],
            ['^.+\\.(gif|png|svg|jpg|jpeg)$'],
          ],
        },
      ],

      'simple-import-sort/exports': 'error',

      'unused-imports/no-unused-imports': 'warn',
      'unused-imports/no-unused-vars': [
        'error',
        {
          vars: 'all',
          varsIgnorePattern: '^_',
          args: 'after-used',
          argsIgnorePattern: '^_',
        },
      ],
    },
  },

  {
    ...eslintPluginPrettier,
    files: ['**/*.{js,ts}'],
    // <script> blocks in .astro files reach ESLint as virtual files (Component.astro/1_1.js) and
    // would be formatted out of context; `prettier --check` already formats the whole .astro file.
    ignores: ['**/*.astro/**'],
    rules: {
      ...eslintPluginPrettier.rules,
      'prettier/prettier': ['error', prettierConfig],
    },
  },
]
