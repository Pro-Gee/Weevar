import type { LayoutChange, TargetTool, WeevarRuntimeConfig } from "./layoutTypes";
import { generatePrompt, promptBody } from "../prompts/generate";

export { promptBody };

export function generatePrompts(
  change: LayoutChange,
  tool: TargetTool,
  cfg?: WeevarRuntimeConfig,
) {
  return generatePrompt(change, { targetTool: tool, config: cfg });
}
