import { vi, describe, test, expect } from 'vitest';
import remoteCode from '../src';
import { remark } from 'remark';
import { VFile } from 'vfile';
import path from 'node:path';

const vfile = (value: string) =>
  new VFile({
    value,
    path: path.resolve('./test.md'),
  });

const input = (q: string) => `
\`\`\`js url=https://raw.githubusercontent.com/forgen-org/remark-remote-code/master/__fixtures__/say-%23-hi.js${q}
\`\`\`
`;

test('Basic file import', async () => {
  expect(
    (
      await remark()
        .use(remoteCode, {})
        .process(vfile(input('')))
    ).toString()
  ).toMatchInlineSnapshot(`
    "\`\`\`js url=https://raw.githubusercontent.com/forgen-org/remark-remote-code/master/__fixtures__/say-%23-hi.js
    console.log('Hello remark-remote-code!');
    console.log('This is another line...');
    console.log('This is the last line');
    console.log('Oops, here is another');
    \`\`\`
    "
  `);
});

test('File import using line numbers', async () => {
  expect(
    (
      await remark()
        .use(remoteCode, {})
        .process(vfile(input('#L2-L3')))
    ).toString()
  ).toMatchInlineSnapshot(`
    "\`\`\`js url=https://raw.githubusercontent.com/forgen-org/remark-remote-code/master/__fixtures__/say-%23-hi.js#L2-L3
    console.log('This is another line...');
    console.log('This is the last line');
    \`\`\`
    "
  `);
});

test('File import using single line number', async () => {
  expect(
    (
      await remark()
        .use(remoteCode, {})
        .process(vfile(input('#L1')))
    ).toString()
  ).toMatchInlineSnapshot(`
    "\`\`\`js url=https://raw.githubusercontent.com/forgen-org/remark-remote-code/master/__fixtures__/say-%23-hi.js#L1
    console.log('Hello remark-remote-code!');
    \`\`\`
    "
  `);
});

test('File import using single line number and following lines', async () => {
  expect(
    (
      await remark()
        .use(remoteCode, {})
        .process(vfile(input('#L2-')))
    ).toString()
  ).toMatchInlineSnapshot(`
    "\`\`\`js url=https://raw.githubusercontent.com/forgen-org/remark-remote-code/master/__fixtures__/say-%23-hi.js#L2-
    console.log('This is another line...');
    console.log('This is the last line');
    console.log('Oops, here is another');
    \`\`\`
    "
  `);
});

test('Preserve trailing newline and indentation', async () => {
  expect(
    (
      await remark()
        .use(remoteCode, { preserveTrailingNewline: true })
        .process(vfile(input('')))
    ).toString()
  ).toMatchInlineSnapshot(`
    "\`\`\`js url=https://raw.githubusercontent.com/forgen-org/remark-remote-code/master/__fixtures__/say-%23-hi.js
    console.log('Hello remark-remote-code!');
    console.log('This is another line...');
    console.log('This is the last line');
    console.log('Oops, here is another');

    \`\`\`
    "
  `);

  expect(
    (
      await remark()
        .use(remoteCode, {})
        .process(
          vfile(`
\`\`\`js url=https://raw.githubusercontent.com/forgen-org/remark-remote-code/master/__fixtures__/indentation.js#L2-L3
\`\`\`
`)
        )
    ).toString()
  ).toMatchInlineSnapshot(`
    "\`\`\`js url=https://raw.githubusercontent.com/forgen-org/remark-remote-code/master/__fixtures__/indentation.js#L2-L3
      console.log('indentation');
    	return 'indentation';
    \`\`\`
    "
  `);
});

test('Remove redundant indentations', async () => {
  expect(
    (
      await remark()
        .use(remoteCode, { removeRedundantIndentations: true })
        .process(
          vfile(`
\`\`\`js url=https://raw.githubusercontent.com/forgen-org/remark-remote-code/master/__fixtures__/indentation.js#L7-L10
\`\`\`
`)
        )
    ).toString()
  ).toMatchInlineSnapshot(`
    "\`\`\`js url=https://raw.githubusercontent.com/forgen-org/remark-remote-code/master/__fixtures__/indentation.js#L7-L10
    if (true) {
      while (false)
        console.log('nested');
    }
    \`\`\`
    "
  `);
});

test('Allow escaped spaces in paths', async () => {
  expect(
    (
      await remark()
        .use(remoteCode)
        .process(
          vfile(`
\`\`\`js url=https://raw.githubusercontent.com/forgen-org/remark-remote-code/master/__fixtures__/filename\\ with\\ spaces.js
\`\`\`
`)
        )
    ).toString()
  ).toMatchInlineSnapshot(`
    "\`\`\`js url=https://raw.githubusercontent.com/forgen-org/remark-remote-code/master/__fixtures__/filename\\\\ with\\\\ spaces.js
    console.log('filename with spaces');
    \`\`\`
    "
  `);
});

describe('options.rootDir', async () => {
  test('Passing custom rootDir', async () => {
    expect(
      (
        await remark()
          .use(remoteCode, {
            rootDir:
              'https://raw.githubusercontent.com/forgen-org/remark-remote-code/master/__fixtures__',
          })
          .process(
            vfile(`
\`\`\`js url=<rootDir>/say-%23-hi.js#L1
\`\`\`
  `)
          )
      ).toString()
    ).toMatchInlineSnapshot(`
      "\`\`\`js url=<rootDir>/say-%23-hi.js#L1
      console.log('Hello remark-remote-code!');
      \`\`\`
      "
    `);
  });
});
