# Install

```bash
npm i --save-dev --save-exact oxlint oxfmt @k03mad/oxlint-config
```

## Use

`.oxlintrc.json`

```json
{
  "$schema": "./node_modules/oxlint/configuration_schema.json",
  "extends": ["./node_modules/@k03mad/oxlint-config/.oxlintrc.json"]
}
```

`.vscode/settings.json`

```json
{
  "oxc.fmt.configPath": "node_modules/@k03mad/oxlint-config/.oxfmtrc.json",
  "oxc.fixKind": "safe_fix",
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "oxc.oxc-vscode",
  "editor.codeActionsOnSave": {
    "source.fixAll.oxc": "always"
  },
  "[javascript]": {
    "editor.defaultFormatter": "oxc.oxc-vscode"
  },
  "[json]": {
    "editor.defaultFormatter": "oxc.oxc-vscode"
  },
  "[jsonc]": {
    "editor.defaultFormatter": "oxc.oxc-vscode"
  },
  "[yaml]": {
    "editor.defaultFormatter": "oxc.oxc-vscode"
  },
  "[markdown]": {
    "editor.defaultFormatter": "oxc.oxc-vscode"
  },
  "[typescript]": {
    "editor.defaultFormatter": "oxc.oxc-vscode"
  }
}
```

`package.json`

```json
{
  "scripts": {
    "lint": "oxlint && oxfmt -c node_modules/@k03mad/oxlint-config/.oxfmtrc.json --check"
  }
}
```
