# Install

```bash
npm i --save-dev --save-exact oxlint oxfmt @k03mad/oxlint-config
```

## Use

`.oxlintrc.json`

```json
{
    "$schema": "./node_modules/oxlint/configuration_schema.json",
    "extends": ["./node_modules/@k03mad/oxlint-config/.oxlintrc.json"],
    "env": {
        "node": true
    }
}
```

`.oxfmtrc.json`

```json
{
    "$schema": "./node_modules/oxfmt/configuration_schema.json",
    "ignorePatterns": ["node_modules/**"],
    "singleQuote": true,
    "arrowParens": "avoid",
    "bracketSpacing": false,
    "quoteProps": "consistent",
    "experimentalSortImports": {
        "groups": [
            ["builtin"],
            ["external", "type-external"],
            ["internal", "type-internal"],
            ["parent", "type-parent"],
            ["sibling", "type-sibling"],
            ["index", "type-index"]
        ]
    }
}
```

`.vscode/settings.json`

```json
{
    "editor.defaultFormatter": "oxc.oxc-vscode",
    "oxc.fmt.configPath": ".oxfmtrc.json",
    "editor.formatOnSave": true,
    "editor.codeActionsOnSave": {
        "source.fixAll.oxc": "always"
    }
}
```

`package.json`

```json
{
    "scripts": {
        "lint": "oxlint --report-unused-disable-directives && oxfmt --check"
    }
}
```
