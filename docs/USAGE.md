# Usage Guide

## Activate overlay

- Press `Cmd/Ctrl + Shift + E`, or click the trigger button.

## Core workflow

1. Hover and select an element.
2. Drag to reorder/move.
3. Review prompt output.
4. Copy prompt and paste into your coding assistant.

## Keyboard shortcuts

- `Cmd/Ctrl + Shift + E`: toggle Weevar
- `Esc`: cancel/close current interaction
- `O`: open Overview
- `P`: open Prompt
- `U`: undo
- `R`: redo
- `D`: clear session changes

## Prompt behavior

- Prompt output is based on **final element state vs live state**.
- Repeated moves of the same element collapse into a single effective prompt change.
- Undo/redo/delete update prompt context; trays auto-dismiss on destructive actions.

## Notes

- Changes are runtime-only unless you manually apply prompt output to source code.
- Refresh restores the page to source-defined layout.
