# Spoolbook

**A private, browser-local filament inventory and print-usage ledger for 3D-printing workshops.**

Spoolbook helps you keep an accurate count of every gram on your shelf. Add your physical spools, log prints as a quantity and grams-per-item, record manual adjustments, and review the full history of each spool. Your data stays in your browser—there is no account, server, or cloud sync required.

## Why Spoolbook?

Filament is easy to lose track of: a few test prints here, a partial project there, and suddenly a spool is empty when you need it. Spoolbook treats each spool as a small ledger, so its remaining weight is always calculated from its starting weight and chronological activity.

## Features

- **Track your spool library** — Record spool name, material, colour, brand, initial weight, purchase details, and notes.
- **Log print usage** — Deduct material automatically with `quantity × grams per item`.
- **Make stock adjustments** — Add, remove, or set a measured remaining weight, with a reason for the change.
- **See accurate balances** — Each spool balance is recalculated from its complete ledger rather than stored as a value that can drift.
- **Browse inventory and history** — Search and filter active or archived spools, plus the print and adjustment history behind them.
- **Keep your data portable** — Export all spools and records to a versioned JSON backup, then validate it before restoring.
- **Private by design** — Everything is stored in IndexedDB in the current browser. Nothing is uploaded.
- **Installable PWA** — Install Spoolbook like an app and use its cached shell offline after the first visit.

## How it works

1. Add a spool with its starting weight.
2. Record a print, including its quantity and estimated weight per item.
3. Spoolbook subtracts that usage from the calculated balance.
4. If you weigh a spool or need to correct its stock, add an adjustment instead of overwriting history.

This leaves you with both the current balance and an auditable record of how it changed.

## Getting started

### Prerequisites

- [Node.js](https://nodejs.org/) 20 or later
- [pnpm](https://pnpm.io/)

### Run locally

```bash
git clone https://github.com/<your-account>/spoolbook.git
cd spoolbook
pnpm install
pnpm dev
```

Vite will print the local development URL, usually `http://localhost:5173`.

### Build for production

```bash
pnpm build
pnpm preview
```

## Data and privacy

Spoolbook stores its database in [IndexedDB](https://developer.mozilla.org/docs/Web/API/IndexedDB_API) under your browser profile. This means:

- Your records do not leave your device through the app.
- Different browsers and browser profiles have separate data stores.
- Clearing site data, browser storage, or the browser profile can remove your records.

Use **Data & backup** to download regular JSON backups. A restore previews and validates the selected backup before replacing local data.

## Available scripts

| Command          | Description                                         |
| ---------------- | --------------------------------------------------- |
| `pnpm dev`       | Start the Vite development server.                  |
| `pnpm build`     | Type-check and create a production build.           |
| `pnpm preview`   | Preview the production build locally.               |
| `pnpm typecheck` | Run the TypeScript compiler without emitting files. |
| `pnpm test`      | Run the Vitest test suite.                          |
| `pnpm lint`      | Run Oxlint.                                         |
| `pnpm fmt:check` | Check formatting with Oxfmt.                        |
| `pnpm fmt`       | Format the project with Oxfmt.                      |

## Tech stack

- [React](https://react.dev/) and [TypeScript](https://www.typescriptlang.org/)
- [Vite](https://vite.dev/)
- [Mantine](https://mantine.dev/) for the interface
- [Dexie](https://dexie.org/) for IndexedDB access
- [Zod](https://zod.dev/) for backup validation
- [Vitest](https://vitest.dev/) and Testing Library for tests

## Contributing

Contributions, bug reports, and feature ideas are welcome. For changes, please keep the existing code style and run the relevant checks before opening a pull request:

```bash
pnpm fmt:check
pnpm lint
pnpm typecheck
pnpm test
```

## License

Spoolbook is released under the [MIT License](LICENSE).
