---
name: mantine-ui-design
description: Design, build, refactor, or review React interfaces using Mantine components and theme-aware styling. Use when creating or improving Mantine pages, components, forms, dashboards, layouts, responsive behavior, visual hierarchy, light and dark themes, or delete and archive flows.
---

# Mantine UI Design

Create clean, modern, accessible interfaces that fit the target project's existing Mantine system.

## Workflow

1. Inspect the target project's Mantine version, theme, shared components, utilities, and nearby UI patterns before designing.
2. Reuse installed packages and existing project resources. Do not add a dependency when the current stack can meet the requirement.
3. Define a clear content hierarchy and remove copy that does not help the user decide or act.
4. Build with Mantine components and responsive props. Handle loading, empty, error, disabled, and success states where relevant.
5. Check mobile and desktop layouts, light and dark themes, keyboard behavior, focus visibility, labels, and contrast.
6. Run the project's available format, lint, typecheck, test, and build commands after implementation.

## Styling Rules

- Prefer Mantine components, style props, responsive props, `style`, and the Styles API. Avoid creating CSS files when these APIs are sufficient.
- Use a minimal CSS module only for behavior that Mantine cannot reasonably express, such as an unsupported selector, keyframe, or third-party override. Avoid global CSS.
- Keep every font weight at `600` or below. Set `fw` or theme heading values explicitly when a Mantine component defaults to a heavier weight.
- Use `Card` to wrap a visually grouped section or content panel. Do not use `Paper` as a section wrapper.
- Use `Stack`, `Group`, `Flex`, `Grid`, `SimpleGrid`, `Container`, and Mantine spacing tokens to create generous, consistent whitespace.
- Use borders sparingly. Prefer spacing, surface contrast, typography, and restrained shadows for hierarchy; enable `withBorder` only when it improves comprehension.
- Never hardcode hex, RGB, or HSL colors in component or CSS styling. Prefer semantic Mantine variables such as `var(--mantine-color-body)` and `var(--mantine-color-text)`.
- When light and dark themes need different palette shades, compose Mantine variables with `light-dark(...)`, for example `light-dark(var(--mantine-color-gray-0), var(--mantine-color-dark-7))`.
- Use theme color names such as `blue.6` for Mantine color props when appropriate. Verify that custom styling remains intentional in both color schemes.

## Content And Interaction

- Keep headings, labels, helper text, empty states, and button copy short, specific, and action-oriented.
- Remove repeated explanations and decorative text. Preserve essential context, consequences, and recovery guidance.
- Make the primary action easy to identify. Keep secondary actions visually quieter and group related actions consistently.
- Use icon-only controls only when their meaning is conventional, and provide an accessible label and tooltip.
- Keep responsive changes intentional: preserve action reachability, readable line lengths, useful spacing, and logical content order on small screens.

## Destructive Actions

- Require explicit confirmation before every delete or archive mutation.
- Prefer the project's existing confirmation pattern. Use `modals.openConfirmModal` when `@mantine/modals` is already configured; otherwise use a controlled Mantine `Modal` without adding a dependency solely for confirmation.
- Name the affected item, state the consequence briefly, and label the confirm button with the exact action, such as `Delete` or `Archive`.
- Keep cancel as the safe default. Run the mutation only from the confirm handler, and prevent duplicate submission while it is pending.
- Use Mantine danger or warning theme colors rather than hardcoded destructive colors.

## Quality Checklist

- Verify responsive layouts on mobile and desktop.
- Verify intentional light and dark theme behavior.
- Verify spacing is generous and consistent.
- Verify all font weights are at most `500`.
- Verify section panels use `Card`, not `Paper`.
- Verify borders and interface copy are minimal.
- Verify colors come from Mantine theme tokens or CSS variables.
- Verify every delete and archive action has a confirmation modal.
- Verify accessible names, focus states, keyboard access, contrast, and relevant UI states.
