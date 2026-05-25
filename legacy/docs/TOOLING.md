# TOOLING.md — Gestión del Fin · ESLint, Prettier & CSpell Config

> Load this when: setting up the project from scratch, fixing lint errors, or configuring tooling.

---

## INSTALLATION

```bash
# TanStack Query
npm install @tanstack/react-query @tanstack/react-query-devtools

# ESLint (flat config — compatible with Vite + React 18)
npm install -D eslint @eslint/js \
  eslint-plugin-react-hooks \
  eslint-plugin-react-refresh \
  @typescript-eslint/eslint-plugin \
  @typescript-eslint/parser

# Prettier + ESLint integration
npm install -D prettier eslint-config-prettier eslint-plugin-prettier

# CSpell + Spanish dictionary
npm install -D cspell @cspell/dict-es-es
```

---

## ESLINT — `eslint.config.js`

```javascript
import js from '@eslint/js'
import tsParser from '@typescript-eslint/parser'
import tsPlugin from '@typescript-eslint/eslint-plugin'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import prettier from 'eslint-plugin-prettier'
import prettierConfig from 'eslint-config-prettier'

export default [
  js.configs.recommended,
  prettierConfig,
  {
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        project: './tsconfig.app.json',
        ecmaFeatures: { jsx: true },
      },
    },
    plugins: {
      '@typescript-eslint': tsPlugin,
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
      prettier,
    },
    rules: {
      // TypeScript — strict
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
      '@typescript-eslint/consistent-type-imports': 'error',
      '@typescript-eslint/no-floating-promises': 'error',
      '@typescript-eslint/no-misused-promises': 'error',
      '@typescript-eslint/explicit-function-return-type': ['warn', {
        allowExpressions: true,
        allowTypedFunctionExpressions: true,
      }],

      // React
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'warn',
      'react-refresh/only-export-components': ['warn', { allowConstantExport: true }],

      // General quality
      'no-console': 'error',
      'no-debugger': 'error',
      'prefer-const': 'error',
      'no-var': 'error',

      // Prettier (formatting as lint errors)
      'prettier/prettier': 'error',
    },
  },
  {
    ignores: ['dist/', 'node_modules/', '*.config.js', '*.config.ts'],
  },
]
```

---

## PRETTIER — `.prettierrc`

```json
{
  "semi": false,
  "singleQuote": true,
  "tabWidth": 2,
  "trailingComma": "es5",
  "printWidth": 100,
  "bracketSpacing": true,
  "arrowParens": "always",
  "endOfLine": "lf"
}
```

---

## CSPELL — `cspell.json`

```json
{
  "version": "0.2",
  "language": "en,es",
  "dictionaries": ["es-es", "typescript", "node", "css"],
  "words": [
    "Zustand", "tanstack", "vite", "shadcn", "recharts",
    "tailwindcss", "framer", "phosphor",
    "axiosInstance", "campId", "authStore", "campStore",
    "uiStore", "queryClient", "staleTime",
    "system_admin", "resource_manager", "travel_lead",
    "crtOn", "staggerItem", "staggerContainer", "scanlines",
    "campamento", "bodega", "superviviente",
    "zombi", "municion", "higiene",
    "PipelineFlow", "DeviceFrame", "ScreenSurface",
    "TerminalText", "PhosphorBadge", "TacticalTable",
    "IngressEval", "AIAnalysis", "AIDecision"
  ],
  "ignorePaths": [
    "node_modules",
    "dist",
    "*.lock",
    "*.json",
    "*.md"
  ]
}
```

---

## VSCODE SETTINGS — `.vscode/settings.json`

```json
{
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": "explicit"
  },
  "eslint.validate": ["typescript", "typescriptreact"],
  "typescript.tsdk": "node_modules/typescript/lib",
  "cSpell.enabled": true
}
```

---

## TSCONFIG — `tsconfig.app.json` (strict flags)

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "moduleResolution": "bundler",
    "jsx": "react-jsx",
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true,
    "baseUrl": ".",
    "paths": { "@/*": ["src/*"] }
  },
  "include": ["src"]
}
```

---

## SCRIPTS — `package.json`

```json
{
  "scripts": {
    "dev":      "vite",
    "build":    "tsc -b && vite build",
    "preview":  "vite preview",
    "lint":     "eslint . --max-warnings 0",
    "lint:fix": "eslint . --fix",
    "format":   "prettier --write src/",
    "spell":    "cspell 'src/**/*.{ts,tsx}'",
    "check":    "npm run lint && npm run spell && npm run build",
    "test:e2e": "playwright test"
  }
}
```

**`npm run check`** runs lint → spell → build in sequence. All three must pass before a commit. Use this before every milestone delivery.

---

## ADDING WORDS TO CSPELL

When ESLint/CSpell flags a valid technical term or project-specific word, add it to `cspell.json` under `"words"` — never disable the rule. Common candidates:

- New component names: `SurvivorCard`, `ExplorationTimeline`
- New store or hook names: `useExplorations`, `campStore`
- Domain terms in Spanish: `exploración`, `traslado`
- Third-party library names not already in dictionaries
