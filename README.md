<div align="center">

# dependency-graph

**Render npm dependency trees in your terminal — circular deps, version conflicts, and stats in one command.**

[![License: MIT](https://img.shields.io/badge/License-MIT-0B0A09?style=flat-square&logo=opensourceinitiative&logoColor=white)](LICENSE)
[![Zero Dependencies](https://img.shields.io/badge/dependencies-0-brightgreen?style=flat-square&labelColor=0B0A09)](package.json)
[![Node](https://img.shields.io/badge/node-%3E%3D18-0B0A09?style=flat-square&logo=node.js&logoColor=white)](package.json)

</div>

## Install

```bash
npx github:NickCirv/dependency-graph
```

## Usage

```bash
# Show dependency tree for the current project
dep-graph

# Detect circular dependencies
dep-graph --circular

# Show dependency statistics (counts, conflicts, node_modules size)
dep-graph --stats
```

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

## What it does

Reads `package.json` and `node_modules` to build a dependency tree, then renders it with Unicode box-drawing characters and ANSI color coding: blue for direct deps, yellow for version conflicts, and red for circular references. Works without `node_modules` too — falls back to declared ranges from `package.json`. Zero runtime dependencies; uses only Node.js built-ins.

---

<sub>Zero dependencies · Node ≥18 · MIT · by <a href="https://github.com/NickCirv">NickCirv</a></sub>
