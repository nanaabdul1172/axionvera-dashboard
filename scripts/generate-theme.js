const fs = require('fs');
const path = require('path');

const tokensPath = path.join(__dirname, '../src/tokens.json');
const outputPath = path.join(__dirname, '../src/styles/theme.css');
const tokens = JSON.parse(fs.readFileSync(tokensPath, 'utf8'));

const flatten = (obj, prefix = []) => Object.entries(obj).flatMap(([key, value]) => {
  const next = [...prefix, key];
  return value && typeof value === 'object' && !Array.isArray(value)
    ? flatten(value, next)
    : [[next.join('-'), value]];
});

const emitVars = (obj, prefix = 'token') => flatten(obj).map(([key, value]) => `  --${prefix}-${key}: ${value};`).join('\n');
const semanticAliases = `
  --color-bg-primary: var(--token-color-background-primary);
  --color-bg-secondary: var(--token-color-background-secondary);
  --color-bg-tertiary: var(--token-color-background-tertiary);
  --color-text-primary: var(--token-color-text-primary);
  --color-text-secondary: var(--token-color-text-secondary);
  --color-text-muted: var(--token-color-text-muted);
  --color-text-tertiary: var(--token-color-text-tertiary);
  --color-border-primary: var(--token-color-border-primary);
  --color-border-secondary: var(--token-color-border-secondary);
  --color-border-tertiary: var(--token-color-border-tertiary);
  --color-border-focus: var(--token-color-border-focus);
  --color-accent: var(--token-color-brand-primary);
  --background-primary: var(--token-color-background-primary);
  --background-secondary: var(--token-color-background-secondary);
  --text-primary: var(--token-color-text-primary);
  --text-secondary: var(--token-color-text-secondary);
  --text-muted: var(--token-color-text-muted);
  --text-tertiary: var(--token-color-text-tertiary);
  --border-primary: var(--token-color-border-primary);
  --border-focus: var(--token-color-border-focus);
`;

let css = `/* Auto-generated from tokens.json. Do not edit directly. */\n\n`;
css += `:root {\n  color-scheme: light;\n${emitVars(tokens.base)}\n${emitVars(tokens.themes.light)}${semanticAliases}}\n\n`;
css += `[data-theme="dark"] {\n  color-scheme: dark;\n${emitVars(tokens.themes.dark)}${semanticAliases}}\n`;
fs.writeFileSync(outputPath, `${css}\n`);
console.log('Theme CSS generated at src/styles/theme.css');
