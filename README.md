# Install

```bash
npm i --save-dev --save-exact oxlint oxfmt @k03mad/oxlint-config
```

## Use

```js
// eslint.config.js

export {default} from '@k03mad/eslint-config';
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
