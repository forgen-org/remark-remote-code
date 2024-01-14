import { vi, describe, test, expect } from 'vitest';
import remoteCode from '../src';
import { remark } from 'remark';
import { VFile } from 'vfile';
import path from 'node:path';
import fs from 'node:fs';

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

test("Only following lines (e.g. #-L10) doesn't work", async () => {
  expect(async () => {
    (
      await remark()
        .use(remoteCode, {})
        .process(vfile(input('#-L2')))
    ).toString();
  }).toThrow();
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
\`\`\`js file=./__fixtures__/indentation.js#L2-L3
\`\`\`
`)
        )
    ).toString()
  ).toMatchInlineSnapshot(`
    "\`\`\`js file=./__fixtures__/indentation.js#L2-L3
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
\`\`\`js file=./__fixtures__/indentation.js#L7-L10
\`\`\`
`)
        )
    ).toString()
  ).toMatchInlineSnapshot(`
    "\`\`\`js file=./__fixtures__/indentation.js#L7-L10
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
\`\`\`js file=./__fixtures__/filename\\ with\\ spaces.js
\`\`\`
`)
        )
    ).toString()
  ).toMatchInlineSnapshot(`
    "\`\`\`js file=./__fixtures__/filename\\\\ with\\\\ spaces.js
    console.log('filename with spaces');
    \`\`\`
    "
  `);
});

describe('options.rootDir', async () => {
  test('Defaults to process.cwd()', async () => {
    expect(
      (
        await remark()
          .use(remoteCode)
          .process(
            vfile(`
\`\`\`js file=<rootDir>/__fixtures__/say-#-hi.js#L1
\`\`\`
  `)
          )
      ).toString()
    ).toMatchInlineSnapshot(`
      "\`\`\`js file=<rootDir>/__fixtures__/say-#-hi.js#L1
      console.log('Hello remark-remote-code!');
      \`\`\`
      "
    `);
  });

  test('Passing custom rootDir', async () => {
    expect(
      (
        await remark()
          .use(remoteCode, { rootDir: path.resolve('__fixtures__') })
          .process(
            vfile(`
\`\`\`js file=<rootDir>/say-#-hi.js#L1
\`\`\`
  `)
          )
      ).toString()
    ).toMatchInlineSnapshot(`
      "\`\`\`js file=<rootDir>/say-#-hi.js#L1
      console.log('Hello remark-remote-code!');
      \`\`\`
      "
    `);
  });

  test('Throw when passing non-absolute path', async () => {
    expect(async () => {
      (
        await remark()
          .use(remoteCode, { rootDir: '__fixtures__' })
          .process(
            vfile(`
\`\`\`js file=<rootDir>/say-#-hi.js#L1
\`\`\`
  `)
          )
      ).toString();
    }).toThrow();
  });
});

describe('options.allowImportingFromOutside', async () => {
  test('defaults to throw when importing from outside', async () => {
    expect(async () => {
      (
        await remark()
          .use(remoteCode)
          .process(
            vfile(`
\`\`\`js file=../some-file
\`\`\`
  `)
          )
      ).toString();
    }).toThrow();
  });

  test('Allow if the option is specified', async () => {
    const mocked = vi
      .spyOn(fs, 'readFileSync')
      .mockImplementationOnce(() => `Some file`);

    expect(
      (
        await remark()
          .use(remoteCode, { allowImportingFromOutside: true })
          .process(
            vfile(`
\`\`\`js file=../some-file
\`\`\`
  `)
          )
      ).toString()
    ).toMatchInlineSnapshot(`
      "\`\`\`js file=../some-file
      Some file
      \`\`\`
      "
    `);

    mocked.mockRestore();
  });
});
