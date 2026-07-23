---
name: re-creator
description: Recreate UI from user-provided images into production-ready React code using Mantine, @tabler/icons-react, and Motion. Use when the user asks to clone, match, convert, or rebuild a screenshot/mockup/image into responsive UI with close visual fidelity and meaningful interactions.
---

# Recreate UI From Image

Follow this workflow to convert an input image into maintainable frontend code.

## Capture Inputs

- Confirm the reference image path or attachment and the target file(s) to edit.
- Confirm the target stack if provided; otherwise assume React + TypeScript.
- Confirm whether strict pixel-match or "close match + maintainable code" is preferred.
- Confirm user current mantine version by checking the existing `package.json`.

## Analyze The Reference

- Identify layout structure: sections, containers, grid/flex behavior, and spacing rhythm.
- Extract visual system: typography scale, color palette, radius, borders, shadows, and depth.
- Detect reusable primitives: cards, buttons, chips, nav, lists, forms, and banners.
- Identify icon intent and map each icon to `@tabler/icons-react`.
- Infer interaction cues (hover/focus/expand/entry transitions) from the visual style.

## Implement With Required Stack

- Use Mantine v8 components first; prefer composition over raw HTML/CSS.
- Define shared styling through Mantine theme values or CSS variables before local overrides.
- Use `@tabler/icons-react` for UI icons; keep icon size/stroke consistent within each region.
- Use Motion (`motion/react`) for purposeful animation.
- Use short entry transitions for primary blocks.
- Use subtle hover/tap feedback for interactive elements.
- Avoid decorative motion that reduces readability.
- Keep responsive behavior explicit for both mobile and desktop breakpoints.

## Quality Bar

- Match hierarchy and spacing from the image before polishing micro-details.
- Preserve accessibility: semantic elements, keyboard reachability, visible focus, and label text.
- Keep code modular; extract repeated UI into small reusable components.
- Avoid adding new dependencies unless the user explicitly requests them.
- Try to convert those original text to props input.

## Validation

- Run available checks (Build with: `yarn build`, Lint with: `yarn lint`, Format with `yarn fmt`) after edits.
- Compare the rendered result against the image and adjust high-visibility mismatches first.
- Prioritize structure, typography, spacing, colors, and motion timing.

## Response Checklist

- List files changed.
- State assumptions made from missing image details.
- Report validation commands executed and outcomes.
