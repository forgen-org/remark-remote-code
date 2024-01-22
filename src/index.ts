import { visit } from 'unist-util-visit';
import stripIndent from 'strip-indent';
import type { Root, Code, Parent } from 'mdast';
import type { VFile } from 'vfile';

interface CodeImportOptions {
  preserveTrailingNewline?: boolean;
  removeRedundantIndentations?: boolean;
  rootDir?: string;
}

const remoteCode = (options: CodeImportOptions = {}) => {
  const rootDir = options.rootDir || '';

  return async (tree: Root, file: VFile) => {
    const codes: [Code, number | null, Parent][] = [];
    const promises: Promise<void>[] = [];

    visit(tree, 'code', (node, index, parent) => {
      codes.push([node as Code, index, parent as Parent]);
    });

    for (const [node] of codes) {
      const fileMeta = (node.meta || '')
        // Allow escaping spaces
        .split(/(?<!\\) /g)
        .find((meta) => meta.startsWith('url='));

      if (!fileMeta) {
        continue;
      }

      if (!file.dirname) {
        throw new Error('"file" should be an instance of VFile');
      }

      const res =
        /^url=(?<path>.+?)(?:(?:#(?:L(?<from>\d+)(?<dash>-)?)?)(?:L(?<to>\d+))?)?$/.exec(
          fileMeta
        );
      if (!res || !res.groups || !res.groups.path) {
        throw new Error(`Unable to parse file path ${fileMeta}`);
      }
      const filePath = res.groups.path;
      const fromLine = res.groups.from
        ? parseInt(res.groups.from, 10)
        : undefined;
      const hasDash = !!res.groups.dash || fromLine === undefined;
      const toLine = res.groups.to ? parseInt(res.groups.to, 10) : undefined;
      const normalizedFilePath = filePath
        .replace(/^<rootDir>/, rootDir)
        .replace(/\\ /g, ' ');

      const promise = async () => {
        const response = await fetch(normalizedFilePath);

        if (!response.ok) {
          throw new Error(`Unable to fetch file at ${normalizedFilePath}`);
        }

        const fileContent = await response.text();
        node.value = extractLines(
          fileContent,
          fromLine,
          hasDash,
          toLine,
          options.preserveTrailingNewline
        );
        if (options.removeRedundantIndentations) {
          node.value = stripIndent(node.value);
        }
      };
      promises.push(promise());
    }

    await Promise.all(promises);

    return tree;
  };
};

function extractLines(
  content: string,
  fromLine: number | undefined,
  hasDash: boolean,
  toLine: number | undefined,
  preserveTrailingNewline: boolean = false
) {
  const lines = content.split('\n');
  const start = fromLine || 1;
  let end;
  if (!hasDash) {
    end = start;
  } else if (toLine) {
    end = toLine;
  } else if (lines[lines.length - 1] === '' && !preserveTrailingNewline) {
    end = lines.length - 1;
  } else {
    end = lines.length;
  }
  return lines.slice(start - 1, end).join('\n');
}

export { remoteCode };
export default remoteCode;
