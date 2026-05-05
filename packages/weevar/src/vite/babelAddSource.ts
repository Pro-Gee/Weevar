import * as babel from "@babel/core";
import * as t from "@babel/types";
import path from "node:path";
import type { PluginObj } from "@babel/core";
import { encodeDataWvSource } from "../engine/parseDataWvSource";

function weevarJsxSourcePlugin(absFile: string, cwd: string): PluginObj {
  const rel = path.relative(cwd, absFile).split(path.sep).join("/") || absFile;
  return {
    name: "weevar-jsx-source-attr",
    visitor: {
      JSXOpeningElement(p) {
        const loc = p.node.loc;
        if (!loc) return;
        const attrs = p.node.attributes;
        if (
          attrs.some(
            (a) =>
              a.type === "JSXAttribute" &&
              "name" in a &&
              a.name.type === "JSXIdentifier" &&
              a.name.name === "data-wv-source",
          )
        )
          return;
        const payload = encodeDataWvSource({
          file: rel,
          line: loc.start.line,
          col: loc.start.column,
        });
        attrs.push(
          t.jsxAttribute(t.jsxIdentifier("data-wv-source"), t.stringLiteral(payload)),
        );
      },
    },
  };
}

export function transformJsxWithWeevarSource(
  code: string,
  absFile: string,
  cwd: string,
): { code: string; map: babel.BabelFileResult["map"] } | null {
  try {
    const result = babel.transformSync(code, {
      filename: absFile,
      cwd,
      ast: false,
      babelrc: false,
      configFile: false,
      sourceMaps: true,
      presets: [
        ["@babel/preset-typescript", { isTSX: true, allExtensions: true }],
        ["@babel/preset-react", { runtime: "automatic" }],
      ],
      plugins: [weevarJsxSourcePlugin(absFile, cwd)],
    });
    if (!result?.code) return null;
    return { code: result.code, map: result.map ?? null };
  } catch {
    return null;
  }
}
