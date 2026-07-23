---
name: frontend-table
description: Working with the frontend when user require to build a table regarding their requirements. 
---

This skill guides to work on the frontent when a user prompt to build table components.

## Basic Table Specs
- **Language:** TypeScript TSX.
- **Table Library:** `mantine-react-table v2` with `useMantineReactTable({})` base
- **Data from:** Usually from backend services or database scheme types. It is rare to build the type from zero.

- **Requirements:**
1. The `filterFn: 'includesString',` must be added to each column items.  
2. Must use `Cell: ({ row }) => (// Remaining components)` for any custom column components.
3. Please fully adapts the `useMantineReactTable()` and template provided items at your genetations.
4. Must add `size: <number>,` to each column items, and have a default number to it.
5. The table type is usually from @backend regarding API services. Do not create a new types / interface for the existing type.
6. For date related field, prefer to use `dayjs` via `dayjs().format("YYYY-MM-DD HH:mm:ss")` to display the date relaetd values.

Please references to the existing references `references/AdminsTable.tsx` for a table file that use a admin schema for samples.