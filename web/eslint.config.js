const { fixupConfigRules, fixupPluginRules } = require("@eslint/compat");
const stylistic = require("@stylistic/eslint-plugin");
const typescriptEslint = require("@typescript-eslint/eslint-plugin");
const react = require("eslint-plugin-react");
const tsParser = require("@typescript-eslint/parser");
const js = require("@eslint/js");
const { FlatCompat } = require("@eslint/eslintrc");
const { defineConfig, globalIgnores } = require("eslint/config");

const compat = new FlatCompat({
	baseDirectory: __dirname,
	recommendedConfig: js.configs.recommended,
	allConfig: js.configs.all
});

const rules = {
	// @typescript-eslint rules
	"@typescript-eslint/consistent-type-exports": "error",
	"@typescript-eslint/consistent-type-imports": "error",
	"@typescript-eslint/explicit-function-return-type": 0,
	"@typescript-eslint/naming-convention": [
		"error",
		{
			"selector": "interface",
			"format": [ "PascalCase" ],
			"custom": {
				"regex": "^I[A-Z]",
				"match": true
			}
		},
		{
			"selector": "import",
			"format": [ "camelCase", "PascalCase", "UPPER_CASE" ]
		},
		{
			"selector": "default",
			"format": [ "camelCase" ]
		},
		{
			"selector": "variable",
			"format": [ "camelCase", "UPPER_CASE", "PascalCase" ]
		},
		{
			"selector": "parameter",
			"format": [ "camelCase", "PascalCase" ],
			"leadingUnderscore": "allow"
		},
		{
			"selector": "memberLike",
			"modifiers": [ "private" ],
			"format": [ "camelCase" ],
			"leadingUnderscore": "require"
		},
		{
			"selector": "typeLike",
			"format": [ "PascalCase" ]
		},
		{
			"selector": "typeProperty",
			"format": [ "camelCase", "PascalCase" ]
		},
		{
			"selector": "classProperty",
			"format": [ "camelCase", "UPPER_CASE", "PascalCase" ]
		},
		{
			"selector": "enumMember",
			"format": [ "UPPER_CASE" ]
		},
		{
			"selector": "function",
			"format": [ "camelCase", "PascalCase", "UPPER_CASE" ]
		},
		{
			"selector": "objectLiteralProperty",
			"format": null
		},
		{
			"selector": "variable",
			"modifiers": [ "destructured" ],
			"format": null
		}
	],
	"@typescript-eslint/explicit-module-boundary-types": 0,
	"@typescript-eslint/no-inferrable-types": 0,
	"@typescript-eslint/no-use-before-define": 0,
	"@typescript-eslint/no-non-null-assertion": "error",
	"@typescript-eslint/no-shadow": [
		"error",
		{
			"builtinGlobals": true,
			"hoist": "all"
		}
	],
	"@typescript-eslint/prefer-optional-chain": "error",
	"@typescript-eslint/consistent-type-definitions": [ "error", "type" ],
	// React linter rules
	"react/sort-comp": [ 1, {
		order: [
			"constructor",
			"type-annotations",
			"instance-variables",
			"static-variables",
			"static-methods",
			"everything-else",
			"lifecycle",
			"rendering",
			"instance-methods"
		],
		groups: {
			"rendering": [
				"render",
				"/^render.+$/"
			]
		}
	} ],
	"react/jsx-curly-spacing": [ "error", "always" ],
	"react/jsx-handler-names": [ 1, { "checkLocalVariables": true } ],
	"react/jsx-max-props-per-line": [ 1, { "maximum": 4 } ],
	"react/jsx-pascal-case": [ 1, { "allowNamespace": true } ],
	"react/no-array-index-key": "error",
	// Generic eslint rules
	"no-shadow": "off",
	// Stylistic linter rules
	"@stylistic/eol-last": [ "error", "always" ],
	"@stylistic/quotes": [ "error", "double", { "allowTemplateLiterals": "always" } ],
	"@stylistic/indent": [ "error", "tab", { "SwitchCase": 1 } ],
	"@stylistic/max-len": [ "warn", { "code": 120, "tabWidth": 4 } ],
	"@stylistic/spaced-comment": [ "error", "always" ],
	"@stylistic/array-bracket-spacing": [ "error", "always" ],
	"@stylistic/object-curly-spacing": [ "error", "always" ],
	"@stylistic/template-curly-spacing": [ "error", "always" ],
	"@stylistic/space-before-blocks": [ "error", "always" ],
	"@stylistic/space-before-function-paren": [ "error", { "named": "never" } ],
	"@stylistic/no-multiple-empty-lines": [ "error", { "max": 1 } ],
	"@stylistic/no-multi-spaces": [ "error" ],
	"@stylistic/no-trailing-spaces": [ "error" ],
	"@stylistic/no-tabs": [ "error", { allowIndentationTabs: true } ],
	"@stylistic/comma-dangle": [ "error", "never" ],
	"@stylistic/computed-property-spacing": [ "off" ],
	"@stylistic/member-delimiter-style": [
		"error",
		{ "multiline": { "delimiter": "semi", "requireLast": true } }
	],
	"@stylistic/arrow-parens": [ "off" ],
	"@stylistic/jsx-indent-props": [ "error", "tab" ],
	"@stylistic/jsx-curly-spacing": [ "error", "always" ],
	"@stylistic/quote-props": [ "off" ],
	"@stylistic/indent-binary-ops": [ "error", "tab" ],
	"@stylistic/operator-linebreak": [
		"error",
		"before",
		{ "overrides": { "=": "after", "+": "after", "-": "after", "/": "after", "*": "after" } }
	],
	"@stylistic/brace-style": [ "error", "1tbs", { "allowSingleLine": true } ],
	"@stylistic/no-extra-parens": [ "off" ],
	"@stylistic/no-mixed-operators": [ "off" ],
	"@stylistic/multiline-ternary": [ "error", "always-multiline" ],
	"@stylistic/jsx-curly-brace-presence": [ "error", "ignore" ],
	"@stylistic/jsx-one-expression-per-line": [ "error", { "allow": "single-line" } ],
	"@stylistic/max-statements-per-line": [ "error", { "max": 2 } ],
	"@stylistic/padding-line-between-statements": [
		"error",
		{ "blankLine": "never", "prev": [ "const", "let" ], "next": [ "const", "let" ] },
		{ "blankLine": "always", "prev": [ "const", "let" ], "next": "expression" },
		{ "blankLine": "always", "prev": "expression", "next": [ "const", "let" ] },
		{
			"blankLine": "always",
			"prev": [ "multiline-const", "multiline-let", "block-like", "import", "multiline-expression" ],
			"next": "*"
		},
		{ "blankLine": "never", "prev": "import", "next": "import" },
		{ "blankLine": "always", "prev": "*", "next": [ "break", "return", "throw", "switch", "block-like" ] }
	],
	"@stylistic/semi": [ "error", "always" ]
};

const extendsConfig = fixupConfigRules(compat.extends(
	"eslint:recommended",
	"plugin:@typescript-eslint/eslint-recommended",
	"plugin:@typescript-eslint/recommended",
	"plugin:react-hooks/recommended",
	"plugin:react/recommended",
	"plugin:react/jsx-runtime"
));

module.exports = defineConfig([
	{
		rules,
		extends: extendsConfig,
		plugins: {
			"@stylistic": stylistic,
			"@typescript-eslint": fixupPluginRules(typescriptEslint),
			react: fixupPluginRules(react)
		},
		languageOptions: {
			parser: tsParser,
			parserOptions: {
				ecmaVersion: 2020,
				sourceType: "module",
				project: true
			}
		},
		settings: {
			react: { "version": "detect" }
		},
		ignores: [ "*.config.js" ]
	},
	globalIgnores([
		"*.d.ts",
		"coverage",
		"build",
		"dist",
		"node_modules"
	])
]);
