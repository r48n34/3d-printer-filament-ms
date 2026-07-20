# Spoolbook

A browser-local filament inventory and print-usage ledger built with Vite, React, TypeScript, Mantine, and Dexie.

## Features

- Track active and archived physical filament spools
- Deduct print usage as quantity × grams per item
- Add, remove, or set measured filament stock
- Recalculate every spool balance from its chronological ledger
- Search and filter inventory and history
- Export and restore validated JSON backups
- Store all records locally in IndexedDB—no backend or account required
- Install as a PWA and keep the app shell available offline after the first visit

## Development

```bash
pnpm install
pnpm dev
```

## Quality checks

```bash
pnpm fmt
pnpm lint
pnpm typecheck
pnpm test
pnpm build
```

Clearing this site's browser storage removes its IndexedDB data. Use the **Data & backup** page to download regular backups.
