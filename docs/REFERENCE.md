# dependency-graph — implementation reference

Source revision: `74081788dcb1eb4e8f73c4b5c5c66b823c3e32e1`. This reference records source declarations; it is not a transcript of a successful run.

## Entrypoint and runtime

[package.json](https://github.com/NickCirv/dependency-graph/blob/74081788dcb1eb4e8f73c4b5c5c66b823c3e32e1/package.json) declares `index.js`. Node.js `>=20` and npm.

Executable mapping: `dependency-graph` → `./index.js`, `dep-graph` → `./index.js`.

## Supported workflow

Dependency-tree traversal; version conflicts and cycles; reverse dependents; flat lists and package-size statistics.

Results depend on the lockfile and node_modules state. Missing installations limit transitive detail. Its dep-graph executable alias overlaps with a separate source-import tool.

## Command reference

The commands below use the installed executable name. From the pinned checkout, replace it with the `node` entrypoint shown above. Options and command branches were cross-checked against captured source; examples are not execution transcripts.

| Flag | Description |
|------|-------------|
| `--depth <n>` | Limit tree depth (default: 3) |
| `--prod` | Production dependencies only |
| `--dev` | Dev dependencies only |
| `--why <pkg>` | Show all dependency chains that pull in a package |
| `--circular` | Detect circular dependency cycles |
| `--stats` | Total count, direct vs transitive, conflicts, disk size |
| `--flat` | Flat alphabetical list with resolved versions |
| `--json` | Machine-readable JSON output (works with any flag) |
| `--cwd <path>` | Run against a different directory |

## Package scripts

| Script | Exact command |
| --- | --- |
| `test` | `node --test` |

## Implementation sources

[index.js](https://github.com/NickCirv/dependency-graph/blob/74081788dcb1eb4e8f73c4b5c5c66b823c3e32e1/index.js).

## Verification boundary

No repository code, tests, network operation, hook installer or migration was executed for this review. Source inspection supports the documented interface; runtime correctness and external-service compatibility remain unverified.
