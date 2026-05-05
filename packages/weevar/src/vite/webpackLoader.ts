import { transformJsxWithWeevarSource } from "./babelAddSource";

type LoaderCallback = (err: Error | null, content?: string, map?: object | string) => void;

type WebpackLoaderThis = {
  resourcePath: string;
  rootContext: string;
  async(): LoaderCallback;
};

/**
 * Webpack 5 loader — inject `data-wv-source` into JSX/TSX (same transform as Vite).
 *
 * ```js
 * module.exports = {
 *   module: {
 *     rules: [
 *       {
 *         test: /\.(tsx|jsx)$/,
 *         exclude: /node_modules/,
 *         enforce: "pre",
 *         loader: "weevar/webpack-loader",
 *       },
 *     ],
 *   },
 * };
 * ```
 */
export default function weevarWebpackLoader(
  this: WebpackLoaderThis,
  source: string,
): void {
  const callback = this.async();
  const p = this.resourcePath;
  if (!/\.(tsx|jsx)$/.test(p)) {
    callback(null, source);
    return;
  }
  const cwd = this.rootContext || process.cwd();
  const out = transformJsxWithWeevarSource(source, p, cwd);
  if (!out?.code) {
    callback(null, source);
    return;
  }
  callback(null, out.code, out.map ?? undefined);
}
