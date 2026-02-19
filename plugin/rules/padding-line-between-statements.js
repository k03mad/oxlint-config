// oxlint-disable no-shadow
const isNotSemicolonToken = token => token.value !== ';' && token.type === 'Punctuator';
const isClosingBraceToken = token => token.value === '}' && token.type === 'Punctuator';

const isParenthesized = (node, sourceCode) => {
    const previousToken = sourceCode.getTokenBefore(node);
    const nextToken = sourceCode.getTokenAfter(node);
    return (
        Boolean(previousToken && nextToken) &&
        previousToken.value === '(' &&
        previousToken.range[1] <= node.range[0] &&
        nextToken.value === ')' &&
        nextToken.range[0] >= node.range[1]
    );
};

const isSemicolonToken = token => token.value === ';' && token.type === 'Punctuator';

const isFunction = node =>
    node.type === 'FunctionDeclaration' ||
    node.type === 'FunctionExpression' ||
    node.type === 'ArrowFunctionExpression';

const isTokenOnSameLine = (left, right) => left.loc.end.line === right.loc.start.line;
const LINEBREAKS = new Set(['\r\n', '\r', '\n', '\u2028', '\u2029']);

const T = {
    BlockStatement: 'BlockStatement',
    BreakStatement: 'BreakStatement',
    CallExpression: 'CallExpression',
    ClassDeclaration: 'ClassDeclaration',
    ContinueStatement: 'ContinueStatement',
    DebuggerStatement: 'DebuggerStatement',
    DoWhileStatement: 'DoWhileStatement',
    EmptyStatement: 'EmptyStatement',
    ExportAllDeclaration: 'ExportAllDeclaration',
    ExportDefaultDeclaration: 'ExportDefaultDeclaration',
    ExportNamedDeclaration: 'ExportNamedDeclaration',
    ExpressionStatement: 'ExpressionStatement',
    ForInStatement: 'ForInStatement',
    ForOfStatement: 'ForOfStatement',
    ForStatement: 'ForStatement',
    FunctionDeclaration: 'FunctionDeclaration',
    IfStatement: 'IfStatement',
    ImportDeclaration: 'ImportDeclaration',
    LabeledStatement: 'LabeledStatement',
    Literal: 'Literal',
    Program: 'Program',
    ReturnStatement: 'ReturnStatement',
    SequenceExpression: 'SequenceExpression',
    StaticBlock: 'StaticBlock',
    SwitchCase: 'SwitchCase',
    SwitchStatement: 'SwitchStatement',
    TSDeclareFunction: 'TSDeclareFunction',
    TSEnumDeclaration: 'TSEnumDeclaration',
    TSInterfaceBody: 'TSInterfaceBody',
    TSInterfaceDeclaration: 'TSInterfaceDeclaration',
    TSMethodSignature: 'TSMethodSignature',
    TSModuleBlock: 'TSModuleBlock',
    TSTypeAliasDeclaration: 'TSTypeAliasDeclaration',
    TSTypeLiteral: 'TSTypeLiteral',
    ThrowStatement: 'ThrowStatement',
    TryStatement: 'TryStatement',
    UnaryExpression: 'UnaryExpression',
    VariableDeclaration: 'VariableDeclaration',
    WhileStatement: 'WhileStatement',
    WithStatement: 'WithStatement',
};

const skipChainExpression = node =>
    node && node.type === 'ChainExpression' ? node.expression : node;

const isTopLevelExpressionStatement = node =>
    node.type === 'ExpressionStatement' &&
    (node.parent.type === 'Program' ||
        (node.parent.type === 'BlockStatement' && isFunction(node.parent.parent)));

const isSingleLine = node => node.loc.start.line === node.loc.end.line;
const isObjectNotArray = obj => typeof obj === 'object' && obj !== null && !Array.isArray(obj);

const deepMerge = (first = {}, second = {}) => {
    const keys = new Set([...Object.keys(first), ...Object.keys(second)]);
    return [...keys].reduce((acc, key) => {
        const firstHasKey = key in first;
        const secondHasKey = key in second;
        const firstValue = first[key];
        const secondValue = second[key];

        if (firstHasKey && secondHasKey) {
            acc[key] =
                isObjectNotArray(firstValue) && isObjectNotArray(secondValue)
                    ? deepMerge(firstValue, secondValue)
                    : secondValue;
        } else if (firstHasKey) {
            acc[key] = firstValue;
        } else {
            acc[key] = secondValue;
        }

        return acc;
    }, {});
};

const createRule = ({name, create, meta}) => ({
    create: context => {
        const {defaultOptions = []} = meta;
        const optionsCount = Math.max(context.options.length, defaultOptions.length);
        return create(
            context,
            Array.from({length: optionsCount}, (_, i) =>
                isObjectNotArray(context.options[i]) && isObjectNotArray(defaultOptions[i])
                    ? deepMerge(defaultOptions[i], context.options[i])
                    : (context.options[i] ?? defaultOptions[i]),
            ),
        );
    },
    meta: {...meta, docs: {...meta.docs, url: `https://eslint.style/rules/${name}`}},
});

const LT = `[${[...LINEBREAKS].join('')}]`;
const PADDING_LINE_SEQUENCE = new RegExp(String.raw`^(\s*?${LT})\s*${LT}(\s*;?)$`, 'u');

const newKeywordTester = (type, keyword) => ({
    test(node, sourceCode) {
        const isSameKeyword = sourceCode.getFirstToken(node)?.value === keyword;
        const isSameType = Array.isArray(type) ? type.includes(node.type) : type === node.type;
        return isSameKeyword && isSameType;
    },
});

const isIIFEStatement = node => {
    if (node.type === T.ExpressionStatement) {
        let expression = skipChainExpression(node.expression);

        if (expression.type === T.UnaryExpression) {
            expression = skipChainExpression(expression.argument);
        }

        if (expression.type === T.CallExpression) {
            let node = expression.callee;

            while (node.type === T.SequenceExpression) {
                node = node.expressions.at(-1);
            }

            return isFunction(node);
        }
    }

    return false;
};

const isBlockLikeStatement = (node, sourceCode) => {
    if (node.type === T.DoWhileStatement && node.body.type === T.BlockStatement) {
        return true;
    }

    if (isIIFEStatement(node)) {
        return true;
    }

    const lastToken = sourceCode.getLastToken(node, isNotSemicolonToken);

    const belongingNode =
        lastToken && isClosingBraceToken(lastToken)
            ? sourceCode.getNodeByRangeIndex(lastToken.range[0])
            : null;

    return (
        Boolean(belongingNode) &&
        (belongingNode.type === T.BlockStatement || belongingNode.type === T.SwitchStatement)
    );
};

const isDirective = (node, sourceCode) =>
    isTopLevelExpressionStatement(node) &&
    node.expression.type === T.Literal &&
    typeof node.expression.value === 'string' &&
    !isParenthesized(node.expression, sourceCode);

const isDirectivePrologue = (node, sourceCode) => {
    if (
        isDirective(node, sourceCode) &&
        node.parent &&
        'body' in node.parent &&
        Array.isArray(node.parent.body)
    ) {
        for (const sibling of node.parent.body) {
            if (sibling === node) {
                break;
            }

            if (!isDirective(sibling, sourceCode)) {
                return false;
            }
        }

        return true;
    }

    return false;
};

const isExpression = (node, sourceCode) =>
    node.type === T.ExpressionStatement && !isDirectivePrologue(node, sourceCode);

const getActualLastToken = (node, sourceCode) => {
    const semiToken = sourceCode.getLastToken(node);
    const prevToken = sourceCode.getTokenBefore(semiToken);
    const nextToken = sourceCode.getTokenAfter(semiToken);
    return prevToken &&
        nextToken &&
        prevToken.range[0] >= node.range[0] &&
        isSemicolonToken(semiToken) &&
        !isTokenOnSameLine(prevToken, semiToken) &&
        isTokenOnSameLine(semiToken, nextToken)
        ? prevToken
        : semiToken;
};

const getReportLoc = (node, sourceCode) => {
    if (isSingleLine(node)) {
        return node.loc;
    }

    const {line} = node.loc.start;
    return {start: node.loc.start, end: {line, column: sourceCode.lines[line - 1].length}};
};

// oxlint-disable-next-line no-empty-function
const verifyForAny = () => {};

const verifyForNever = (context, _, nextNode, paddingLines) => {
    if (paddingLines.length === 0) {
        return;
    }

    context.report({
        node: nextNode,
        messageId: 'unexpectedBlankLine',
        loc: getReportLoc(nextNode, context.sourceCode),
        fix(fixer) {
            if (paddingLines.length >= 2) {
                return null;
            }

            const prevToken = paddingLines[0][0];
            const nextToken = paddingLines[0][1];
            const start = prevToken.range[1];
            const end = nextToken.range[0];

            const text = context.sourceCode.text
                .slice(start, end)
                .replace(
                    PADDING_LINE_SEQUENCE,
                    (_, trailingSpaces, indentSpaces) => trailingSpaces + indentSpaces,
                );

            return fixer.replaceTextRange([start, end], text);
        },
    });
};

const verifyForAlways = (context, prevNode, nextNode, paddingLines) => {
    if (paddingLines.length > 0) {
        return;
    }

    context.report({
        node: nextNode,
        messageId: 'expectedBlankLine',
        loc: getReportLoc(nextNode, context.sourceCode),
        fix(fixer) {
            const {sourceCode} = context;
            let prevToken = getActualLastToken(prevNode, sourceCode);

            const nextToken =
                sourceCode.getFirstTokenBetween(prevToken, nextNode, {
                    includeComments: true,
                    filter(token) {
                        if (isTokenOnSameLine(prevToken, token)) {
                            prevToken = token;
                            return false;
                        }

                        return true;
                    },
                }) || nextNode;

            const insertText = isTokenOnSameLine(prevToken, nextToken) ? '\n\n' : '\n';
            return fixer.insertTextAfter(prevToken, insertText);
        },
    });
};

const PaddingTypes = {
    any: {verify: verifyForAny},
    never: {verify: verifyForNever},
    always: {verify: verifyForAlways},
};

const MaybeMultilineStatementType = {
    'block-like': {test: isBlockLikeStatement},
    'expression': {test: isExpression},
    'return': newKeywordTester(T.ReturnStatement, 'return'),
    'export': newKeywordTester(
        [T.ExportAllDeclaration, T.ExportDefaultDeclaration, T.ExportNamedDeclaration],
        'export',
    ),
    'var': newKeywordTester(T.VariableDeclaration, 'var'),
    'let': newKeywordTester(T.VariableDeclaration, 'let'),
    'const': newKeywordTester(T.VariableDeclaration, 'const'),
    'using': {
        test: node =>
            node.type === 'VariableDeclaration' &&
            (node.kind === 'using' || node.kind === 'await using'),
    },
    'type': newKeywordTester(T.TSTypeAliasDeclaration, 'type'),
};

const StatementTypes = {
    '*': {test: () => true},
    'directive': {test: isDirectivePrologue},
    'iife': {test: isIIFEStatement},
    'block': {test: node => node.type === T.BlockStatement},
    'empty': {test: node => node.type === T.EmptyStatement},
    'function': {test: node => node.type === T.FunctionDeclaration},
    'ts-method': {test: node => node.type === T.TSMethodSignature},
    'break': newKeywordTester(T.BreakStatement, 'break'),
    'case': newKeywordTester(T.SwitchCase, 'case'),
    'class': newKeywordTester(T.ClassDeclaration, 'class'),
    'continue': newKeywordTester(T.ContinueStatement, 'continue'),
    'debugger': newKeywordTester(T.DebuggerStatement, 'debugger'),
    'default': newKeywordTester([T.SwitchCase, T.ExportDefaultDeclaration], 'default'),
    'do': newKeywordTester(T.DoWhileStatement, 'do'),
    'for': newKeywordTester([T.ForStatement, T.ForInStatement, T.ForOfStatement], 'for'),
    'if': newKeywordTester(T.IfStatement, 'if'),
    'import': newKeywordTester(T.ImportDeclaration, 'import'),
    'switch': newKeywordTester(T.SwitchStatement, 'switch'),
    'throw': newKeywordTester(T.ThrowStatement, 'throw'),
    'try': newKeywordTester(T.TryStatement, 'try'),
    'while': newKeywordTester([T.WhileStatement, T.DoWhileStatement], 'while'),
    'with': newKeywordTester(T.WithStatement, 'with'),
    'enum': newKeywordTester(T.TSEnumDeclaration, 'enum'),
    'interface': newKeywordTester(T.TSInterfaceDeclaration, 'interface'),
    'function-overload': {test: node => node.type === T.TSDeclareFunction},
    ...Object.fromEntries(
        Object.entries(MaybeMultilineStatementType).flatMap(([key, value]) => [
            [key, value],
            [
                `singleline-${key}`,
                {
                    ...value,
                    test: (node, sourceCode) => value.test(node, sourceCode) && isSingleLine(node),
                },
            ],
            [
                `multiline-${key}`,
                {
                    ...value,
                    test: (node, sourceCode) => value.test(node, sourceCode) && !isSingleLine(node),
                },
            ],
        ]),
    ),
};

export default createRule({
    name: 'padding-line-between-statements',
    meta: {
        type: 'layout',
        docs: {description: 'Require or disallow padding lines between statements'},
        fixable: 'whitespace',
        hasSuggestions: false,
        schema: {
            $defs: {
                paddingType: {type: 'string', enum: Object.keys(PaddingTypes)},
                statementType: {type: 'string', enum: Object.keys(StatementTypes)},
                statementOption: {
                    anyOf: [
                        {$ref: '#/$defs/statementType'},
                        {
                            type: 'array',
                            items: {$ref: '#/$defs/statementType'},
                            minItems: 1,
                            uniqueItems: true,
                            additionalItems: false,
                        },
                    ],
                },
            },
            type: 'array',
            additionalItems: false,
            items: {
                type: 'object',
                properties: {
                    blankLine: {$ref: '#/$defs/paddingType'},
                    prev: {$ref: '#/$defs/statementOption'},
                    next: {$ref: '#/$defs/statementOption'},
                },
                additionalProperties: false,
                required: ['blankLine', 'prev', 'next'],
            },
        },
        defaultOptions: [],
        messages: {
            unexpectedBlankLine: 'Unexpected blank line before this statement.',
            expectedBlankLine: 'Expected blank line before this statement.',
        },
    },
    create(context, options) {
        const {sourceCode} = context;
        const configureList = options;
        let scopeInfo = null;

        const enterScope = () => {
            scopeInfo = {upper: scopeInfo, prevNode: null};
        };

        const exitScope = () => {
            if (scopeInfo) {
                scopeInfo = scopeInfo.upper;
            }
        };

        const match = (node, type) => {
            let innerStatementNode = node;

            while (innerStatementNode.type === T.LabeledStatement) {
                innerStatementNode = innerStatementNode.body;
            }

            if (Array.isArray(type)) {
                return type.some(match.bind(null, innerStatementNode));
            }

            return StatementTypes[type].test(innerStatementNode, sourceCode);
        };

        const getPaddingType = (prevNode, nextNode) => {
            for (let i = configureList.length - 1; i >= 0; --i) {
                const configure = configureList[i];

                if (match(prevNode, configure.prev) && match(nextNode, configure.next)) {
                    return PaddingTypes[configure.blankLine];
                }
            }

            return PaddingTypes.any;
        };

        const getPaddingLineSequences = (prevNode, nextNode) => {
            const pairs = [];
            let prevToken = getActualLastToken(prevNode, sourceCode);

            if (nextNode.loc.start.line - prevToken.loc.end.line >= 2) {
                do {
                    const token = sourceCode.getTokenAfter(prevToken, {includeComments: true});

                    if (token.loc.start.line - prevToken.loc.end.line >= 2) {
                        pairs.push([prevToken, token]);
                    }

                    prevToken = token;
                } while (prevToken.range[0] < nextNode.range[0]);
            }

            return pairs;
        };

        const verify = node => {
            if (
                !node.parent ||
                ![
                    T.BlockStatement,
                    T.Program,
                    T.StaticBlock,
                    T.SwitchCase,
                    T.SwitchStatement,
                    T.TSInterfaceBody,
                    T.TSModuleBlock,
                    T.TSTypeLiteral,
                ].includes(node.parent.type)
            ) {
                return;
            }

            const {prevNode} = scopeInfo;

            if (prevNode) {
                const type = getPaddingType(prevNode, node);
                const paddingLines = getPaddingLineSequences(prevNode, node);
                type.verify(context, prevNode, node, paddingLines);
            }

            scopeInfo.prevNode = node;
        };

        return {
            'Program': enterScope,
            'Program:exit': exitScope,
            'BlockStatement': enterScope,
            'BlockStatement:exit': exitScope,
            'SwitchStatement': enterScope,
            'SwitchStatement:exit': exitScope,
            'SwitchCase': node => {
                verify(node);
                enterScope();
            },
            'SwitchCase:exit': exitScope,
            'StaticBlock': enterScope,
            'StaticBlock:exit': exitScope,
            'TSInterfaceBody': enterScope,
            'TSInterfaceBody:exit': exitScope,
            'TSModuleBlock': enterScope,
            'TSModuleBlock:exit': exitScope,
            'TSTypeLiteral': enterScope,
            'TSTypeLiteral:exit': exitScope,
            'TSDeclareFunction': node => {
                verify(node);
                enterScope();
            },
            'TSDeclareFunction:exit': exitScope,
            'TSMethodSignature': node => {
                verify(node);
                enterScope();
            },
            'TSMethodSignature:exit': exitScope,
            ':statement': verify,
        };
    },
});
