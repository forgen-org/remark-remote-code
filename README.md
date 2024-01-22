# `@forgen/remark-remote-code`

🔗 Enhance your Markdown files by dynamically importing code blocks from remote sources.

[![npm version](https://badge.fury.io/js/%40forgen%2Fremark-remote-code.svg)](https://badge.fury.io/js/%40forgen%2Fremark-remote-code)

**Important: As of version 1.0.0, `@forgen/remark-remote-code` is an [ESM-only module](https://gist.github.com/sindresorhus/a39789f98801d908bbc7ff3ecc99d99c). It requires Node.js version 12 or higher and must be used with `import` rather than `require`.**

## Installation

Use npm to install the package:

```sh
npm install -D @forgen/remark-remote-code
```

## Setup

Import the plugin using named export; there is no default export:

```js
import { remoteCode } from '@forgen/remark-remote-code';
```

For detailed instructions on using plugins, refer to the [official documentation](https://github.com/remarkjs/remark/blob/master/doc/plugins.md#using-plugins).

`@forgen/remark-remote-code` is compatible with various libraries like `remark` in [MDX](https://mdxjs.com/advanced/plugins#using-remark-and-rehype-plugins), [Gatsby's `gatsby-plugin-mdx`](https://www.gatsbyjs.org/docs/mdx/plugins/#remark-plugins), and [Storybook docs](https://github.com/storybookjs/storybook/tree/master/addons/docs#manual-configuration).

## Usage

Convert a simple reference in your Markdown:

````md
```js url=https://.../example-script.js
```
````

Into a full code block populated with content:

````md
```js url=https://.../example-script.js
// Content of example-script.js
```
````

The file path is relative to the markdown file. Use `<rootDir>` to refer to a custom root directory defined in the [options](#options):

````md
```js url=<rootDir>/script-in-root.js
```
````

Specify specific lines or ranges to include:

````md
Only line 3:
```js url=https://.../example-script.js#L3
```

From line 3 to line 6:
```js url=https://.../example-script.js#L3-L6
```

From line 3 to the end of the file:
```js url=https://.../example-script.js#L3-
```
````

Escape file paths with spaces:

````md
```js url=https://...//file\ with\ spaces.js
```
````

## Options

- `rootDir: string`: Customize what `<rootDir>` points to.
- `preserveTrailingNewline: boolean`: Keep the trailing newline in imported code. Defaults to `false`.
- `removeRedundantIndentations: boolean`: Trim unnecessary indentations in the imported code.
- `allowImportingFromOutside: boolean`: Allow file imports from outside the specified `rootDir`. Disabled by default for security.

## Integration with Gatsby

Available as a Gatsby remark plugin through the `/gatsby` endpoint:

```js
{
  resolve: '@forgen/remark-remote-code/gatsby',
  options: {/* ... */}
}
```

## Testing

Install dependencies with `npm install`. Run tests using `npm test`.

## License

Forgen

[MIT License](LICENSE)

---

`@forgen/remark-remote-code` is a versatile tool for enhancing documentation and instructional content, ensuring code examples are always up-to-date and relevant.
