import path from "node:path";
import { parseSync, printSync } from "@swc/core";
import { Visitor } from "@swc/core/Visitor";
import type { Identifier, JSXAttribute, JSXOpeningElement, Program, Span, StringLiteral } from "@swc/types";
import { encodeDataWvSource } from "../engine/parseDataWvSource";

function noopSpan(): Span {
  return { start: 0, end: 0, ctxt: 0 };
}

function byteOffsetToLineCol(src: string, pos: number): { line: number; col: number } {
  let line = 1;
  let col = 0;
  const end = Math.min(pos, src.length);
  for (let i = 0; i < end; i++) {
    const c = src[i];
    if (c === "\n") {
      line++;
      col = 0;
    } else {
      col++;
    }
  }
  return { line, col };
}

class WeevarJsxVisitor extends Visitor {
  constructor(
    private readonly src: string,
    private readonly relFile: string,
  ) {
    super();
  }

  visitJSXOpeningElement(n: JSXOpeningElement): JSXOpeningElement {
    const hasDataWv = n.attributes.some(
      (a) =>
        a.type === "JSXAttribute" &&
        a.name.type === "Identifier" &&
        a.name.value === "data-wv-source",
    );
    if (hasDataWv) return super.visitJSXOpeningElement(n);

    const { line, col } = byteOffsetToLineCol(this.src, n.span.start);
    const payload = encodeDataWvSource({
      file: this.relFile,
      line,
      col,
    });

    const name: Identifier = {
      type: "Identifier",
      span: noopSpan(),
      value: "data-wv-source",
      optional: false,
    };
    const value: StringLiteral = {
      type: "StringLiteral",
      span: noopSpan(),
      value: payload,
      raw: JSON.stringify(payload),
    };
    const attr: JSXAttribute = {
      type: "JSXAttribute",
      span: noopSpan(),
      name,
      value,
    };

    const next: JSXOpeningElement = {
      ...n,
      attributes: [...n.attributes, attr],
    };
    return super.visitJSXOpeningElement(next);
  }
}

/**
 * SWC-based JSX `data-wv-source` injection (for Next.js / @swc/core pipelines).
 * Peer: `@swc/core`. Falls back to returning null on parse/print failure.
 */
export function transformJsxWithWeevarSourceSwc(
  code: string,
  absFile: string,
  cwd: string,
): { code: string } | null {
  const rel = path.relative(cwd, absFile).split(path.sep).join("/") || absFile;
  try {
    const ast = parseSync(code, {
      syntax: "typescript",
      tsx: true,
      decorators: false,
    }) as Program;

    const visitor = new WeevarJsxVisitor(code, rel);
    const out = visitor.visitProgram(ast);
    const printed = printSync(out, {
      jsc: {
        parser: { syntax: "typescript", tsx: true },
        target: "es2022",
        transform: {
          react: { runtime: "automatic", development: false },
        },
      },
    });
    return { code: printed.code };
  } catch {
    return null;
  }
}
