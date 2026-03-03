#!/usr/bin/env node
// dependency-graph — Visualize npm dependency trees. Zero external dependencies.
// Built-ins only: fs, path, os, readline, child_process, zlib, crypto

import { readFileSync, existsSync, statSync, readdirSync } from 'fs';
import { resolve, join, basename } from 'path';
import { homedir } from 'os';

// ─── ANSI Colors ────────────────────────────────────────────────────────────

const C = {
  reset:   '\x1b[0m',
  bold:    '\x1b[1m',
  dim:     '\x1b[2m',
  blue:    '\x1b[34m',
  cyan:    '\x1b[36m',
  yellow:  '\x1b[33m',
  red:     '\x1b[31m',
  green:   '\x1b[32m',
  magenta: '\x1b[35m',
  white:   '\x1b[37m',
  gray:    '\x1b[90m',
};

const noColor = process.env.NO_COLOR || !process.stdout.isTTY;
const c = (color, str) => noColor ? str : `${C[color]}${str}${C.reset}`;
const bold = (str) => noColor ? str : `${C.bold}${str}${C.reset}`;

// ─── Tree Drawing Chars ──────────────────────────────────────────────────────

const TREE = {
  branch: '├── ',
  last:   '└── ',
  pipe:   '│   ',
  space:  '    ',
};

// ─── CLI Argument Parsing ───────────────────────────────────────────────────

function parseArgs(argv) {
  const args = argv.slice(2);
  const opts = {
    package: null,
    depth: 3,
    prod: false,
    dev: false,
    why: null,
    circular: false,
    stats: false,
    json: false,
    flat: false,
    help: false,
    version: false,
    cwd: process.cwd(),
  };

  let i = 0;
  while (i < args.length) {
    const arg = args[i];
    if (arg === '--help' || arg === '-h') {
      opts.help = true;
    } else if (arg === '--version' || arg === '-v') {
      opts.version = true;
    } else if (arg === '--prod') {
      opts.prod = true;
    } else if (arg === '--dev') {
      opts.dev = true;
    } else if (arg === '--circular') {
      opts.circular = true;
    } else if (arg === '--stats') {
      opts.stats = true;
    } else if (arg === '--json') {
      opts.json = true;
    } else if (arg === '--flat') {
      opts.flat = true;
    } else if (arg === '--depth' || arg === '-d') {
      i++;
      const n = parseInt(args[i], 10);
      opts.depth = isNaN(n) ? 3 : Math.max(1, n);
    } else if (arg === '--why' || arg === '-w') {
      i++;
      opts.why = args[i] || null;
    } else if (arg === '--cwd') {
      i++;
      opts.cwd = args[i] ? resolve(args[i]) : process.cwd();
    } else if (!arg.startsWith('-')) {
      opts.package = arg;
    }
    i++;
  }

  return opts;
}

// ─── Help / Version ──────────────────────────────────────────────────────────

function printVersion() {
  const pkgPath = new URL('./package.json', import.meta.url).pathname;
  try {
    const pkg = JSON.parse(readFileSync(pkgPath, 'utf8'));
    console.log(pkg.version);
  } catch {
    console.log('1.0.0');
  }
}

function printHelp() {
  console.log(`
${bold(c('cyan', 'dependency-graph'))} ${c('gray', '— npm dependency tree visualizer')}

${bold('USAGE')}
  dep-graph [package] [options]

${bold('OPTIONS')}
  ${c('blue', '--depth <n>')}       Limit tree depth (default: 3)
  ${c('blue', '--prod')}            Production dependencies only
  ${c('blue', '--dev')}             Dev dependencies only
  ${c('blue', '--why <pkg>')}       Why is a package installed? Show all dependents
  ${c('blue', '--circular')}        Detect circular dependencies
  ${c('blue', '--stats')}           Show dependency statistics
  ${c('blue', '--json')}            Output as JSON
  ${c('blue', '--flat')}            Flat sorted list with versions
  ${c('blue', '--cwd <path>')}      Set working directory (default: current dir)
  ${c('blue', '--version, -v')}     Show version
  ${c('blue', '--help, -h')}        Show this help

${bold('EXAMPLES')}
  dep-graph                     # Show current project dependency tree
  dep-graph lodash              # Show deps of a specific package
  dep-graph --depth 5           # Deeper tree
  dep-graph --prod              # Production deps only
  dep-graph --why express       # Why is express installed?
  dep-graph --circular          # Find circular dependencies
  dep-graph --stats             # Dependency statistics
  dep-graph --flat              # Flat list with versions
  dep-graph --json              # JSON output

${bold('COLOR LEGEND')}
  ${c('blue', 'blue')}    Direct dependency
  ${c('white', 'white')}   Transitive dependency
  ${c('yellow', 'yellow')}  Duplicate version detected
  ${c('red', 'red')}      Circular dependency
`);
}

// ─── Package.json Reader ─────────────────────────────────────────────────────

function readPackageJson(dir) {
  const pkgPath = join(dir, 'package.json');
  if (!existsSync(pkgPath)) return null;
  try {
    return JSON.parse(readFileSync(pkgPath, 'utf8'));
  } catch {
    return null;
  }
}

// ─── Lock File Reader ────────────────────────────────────────────────────────

function readLockFile(cwd) {
  const lockPath = join(cwd, 'package-lock.json');
  if (!existsSync(lockPath)) return null;
  try {
    return JSON.parse(readFileSync(lockPath, 'utf8'));
  } catch {
    return null;
  }
}

// ─── node_modules Traversal ──────────────────────────────────────────────────

function getInstalledVersion(cwd, pkgName) {
  // Handle scoped packages like @scope/name
  const parts = pkgName.startsWith('@') ? pkgName.split('/') : [pkgName];
  let nmPath;
  if (parts.length === 2) {
    nmPath = join(cwd, 'node_modules', parts[0], parts[1]);
  } else {
    nmPath = join(cwd, 'node_modules', pkgName);
  }
  const pkg = readPackageJson(nmPath);
  return pkg ? pkg.version : null;
}

function getPackageDeps(cwd, pkgName, depType) {
  const parts = pkgName.startsWith('@') ? pkgName.split('/') : [pkgName];
  let nmPath;
  if (parts.length === 2) {
    nmPath = join(cwd, 'node_modules', parts[0], parts[1]);
  } else {
    nmPath = join(cwd, 'node_modules', pkgName);
  }

  const pkg = readPackageJson(nmPath);
  if (!pkg) return {};

  if (depType === 'prod') return pkg.dependencies || {};
  if (depType === 'dev') return pkg.devDependencies || {};
  return { ...(pkg.dependencies || {}), ...(pkg.optionalDependencies || {}) };
}

// ─── Dependency Graph Builder ────────────────────────────────────────────────

function buildDepGraph(cwd, opts) {
  const rootPkg = readPackageJson(cwd);
  if (!rootPkg) {
    return { error: 'No package.json found in ' + cwd };
  }

  const nmExists = existsSync(join(cwd, 'node_modules'));

  let rootDeps = {};
  if (opts.prod) {
    rootDeps = rootPkg.dependencies || {};
  } else if (opts.dev) {
    rootDeps = rootPkg.devDependencies || {};
  } else {
    rootDeps = {
      ...(rootPkg.dependencies || {}),
      ...(rootPkg.devDependencies || {}),
      ...(rootPkg.optionalDependencies || {}),
    };
  }

  return {
    name: rootPkg.name || basename(cwd),
    version: rootPkg.version || '0.0.0',
    deps: rootDeps,
    nmExists,
    rootPkg,
    cwd,
  };
}

// ─── Tree Node Builder ───────────────────────────────────────────────────────

function buildTree(cwd, pkgName, visited, versionMap, depth, maxDepth, isDirect) {
  const version = getInstalledVersion(cwd, pkgName) || 'unknown';
  const key = `${pkgName}@${version}`;

  // Track version conflicts
  if (!versionMap[pkgName]) versionMap[pkgName] = new Set();
  versionMap[pkgName].add(version);

  const isCircular = visited.has(pkgName);
  const node = {
    name: pkgName,
    version,
    isDirect,
    isCircular,
    children: [],
    isDuplicate: false,
  };

  if (isCircular || depth >= maxDepth) {
    return node;
  }

  const newVisited = new Set(visited);
  newVisited.add(pkgName);

  const childDeps = getPackageDeps(cwd, pkgName, 'prod');
  for (const [childName] of Object.entries(childDeps)) {
    const child = buildTree(cwd, childName, newVisited, versionMap, depth + 1, maxDepth, false);
    node.children.push(child);
  }

  return node;
}

// ─── Circular Dependency Detection ──────────────────────────────────────────

function findCircular(cwd, name, chain, visited, cycles) {
  if (chain.includes(name)) {
    const idx = chain.indexOf(name);
    cycles.push(chain.slice(idx).concat(name));
    return;
  }
  if (visited.has(name)) return;

  visited.add(name);
  const deps = getPackageDeps(cwd, name, 'prod');
  for (const depName of Object.keys(deps)) {
    findCircular(cwd, depName, [...chain, name], visited, cycles);
  }
}

function detectCircularDeps(cwd, rootDeps) {
  const cycles = [];
  const visited = new Set();

  for (const pkgName of Object.keys(rootDeps)) {
    if (!visited.has(pkgName)) {
      findCircular(cwd, pkgName, [], visited, cycles);
    }
  }

  // Deduplicate cycles (normalize by rotating to smallest element)
  const normalized = new Set();
  const unique = [];
  for (const cycle of cycles) {
    const body = cycle.slice(0, -1); // remove last repeated element
    const min = body.reduce((a, b) => a < b ? a : b);
    const idx = body.indexOf(min);
    const rotated = [...body.slice(idx), ...body.slice(0, idx)];
    const key = rotated.join('>');
    if (!normalized.has(key)) {
      normalized.add(key);
      unique.push(rotated);
    }
  }
  return unique;
}

// ─── Tree Renderer ───────────────────────────────────────────────────────────

function renderNode(node, prefix, isLast, versionMap, lines, depth) {
  const connector = isLast ? TREE.last : TREE.branch;
  const extension = isLast ? TREE.space : TREE.pipe;

  let nameStr;
  if (node.isCircular) {
    nameStr = c('red', node.name) + c('gray', `@${node.version}`) + c('red', ' [circular]');
  } else if (versionMap[node.name] && versionMap[node.name].size > 1) {
    nameStr = c('yellow', node.name) + c('gray', `@${node.version}`) + c('yellow', ' [duplicate]');
  } else if (node.isDirect) {
    nameStr = c('blue', bold(node.name)) + c('gray', `@${node.version}`);
  } else {
    nameStr = c('white', node.name) + c('gray', `@${node.version}`);
  }

  lines.push(prefix + connector + nameStr);

  const childPrefix = prefix + extension;
  node.children.forEach((child, i) => {
    const childIsLast = i === node.children.length - 1;
    renderNode(child, childPrefix, childIsLast, versionMap, lines, depth + 1);
  });
}

function renderTree(rootName, rootVersion, children, versionMap) {
  const lines = [];
  lines.push(bold(c('cyan', `${rootName}`) + c('gray', `@${rootVersion}`)));

  children.forEach((child, i) => {
    const isLast = i === children.length - 1;
    renderNode(child, '', isLast, versionMap, lines, 0);
  });

  return lines.join('\n');
}

// ─── Stats Calculator ────────────────────────────────────────────────────────

function collectAllDeps(cwd, pkgName, visited, allDeps) {
  if (visited.has(pkgName)) return;
  visited.add(pkgName);

  const version = getInstalledVersion(cwd, pkgName) || 'unknown';
  if (!allDeps[pkgName]) allDeps[pkgName] = new Set();
  allDeps[pkgName].add(version);

  const childDeps = getPackageDeps(cwd, pkgName, 'prod');
  for (const childName of Object.keys(childDeps)) {
    collectAllDeps(cwd, childName, visited, allDeps);
  }
}

function getDirectorySize(dirPath) {
  let total = 0;
  try {
    const entries = readdirSync(dirPath, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = join(dirPath, entry.name);
      try {
        if (entry.isDirectory()) {
          total += getDirectorySize(fullPath);
        } else if (entry.isFile()) {
          total += statSync(fullPath).size;
        }
      } catch {
        // skip unreadable
      }
    }
  } catch {
    // skip unreadable dir
  }
  return total;
}

function formatSize(bytes) {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  if (bytes < 1024 * 1024 * 1024) return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  return (bytes / (1024 * 1024 * 1024)).toFixed(2) + ' GB';
}

function computeStats(cwd, rootDeps, nmExists) {
  const allDeps = {};
  const visited = new Set();

  for (const pkgName of Object.keys(rootDeps)) {
    collectAllDeps(cwd, pkgName, visited, allDeps);
  }

  const direct = Object.keys(rootDeps).length;
  const total = Object.keys(allDeps).length;
  const transitive = total - direct;
  const duplicates = Object.entries(allDeps).filter(([, versions]) => versions.size > 1);

  let nmSize = null;
  if (nmExists) {
    try {
      nmSize = getDirectorySize(join(cwd, 'node_modules'));
    } catch {
      nmSize = null;
    }
  }

  return { direct, total, transitive, duplicates, nmSize, allDeps };
}

// ─── --why: Find Dependents ──────────────────────────────────────────────────

function findDependents(cwd, targetPkg, rootDeps) {
  const dependents = [];

  function check(pkgName, chain, visited) {
    if (visited.has(pkgName)) return;
    const newVisited = new Set(visited);
    newVisited.add(pkgName);

    const deps = getPackageDeps(cwd, pkgName, 'prod');
    for (const depName of Object.keys(deps)) {
      if (depName === targetPkg) {
        dependents.push([...chain, pkgName, depName]);
      } else {
        check(depName, [...chain, pkgName], newVisited);
      }
    }
  }

  for (const pkgName of Object.keys(rootDeps)) {
    if (pkgName === targetPkg) {
      dependents.push(['(root)', pkgName]);
    } else {
      check(pkgName, ['(root)'], new Set());
    }
  }

  return dependents;
}

// ─── --flat: Flat List ───────────────────────────────────────────────────────

function buildFlatList(cwd, rootDeps) {
  const allDeps = {};
  const visited = new Set();

  for (const pkgName of Object.keys(rootDeps)) {
    collectAllDeps(cwd, pkgName, visited, allDeps);
  }

  const result = [];
  for (const [name, versions] of Object.entries(allDeps)) {
    result.push({ name, versions: [...versions].sort() });
  }

  return result.sort((a, b) => a.name.localeCompare(b.name));
}

// ─── Single Package Dep Tree ─────────────────────────────────────────────────

function showPackageTree(cwd, pkgName, opts) {
  const version = getInstalledVersion(cwd, pkgName);
  if (!version) {
    console.error(c('red', `Package "${pkgName}" not found in node_modules`));
    process.exit(1);
  }

  const versionMap = {};
  const tree = buildTree(cwd, pkgName, new Set(), versionMap, 0, opts.depth, true);

  // Mark duplicates
  for (const [name, versions] of Object.entries(versionMap)) {
    if (versions.size > 1) {
      // Already handled in renderNode
    }
  }

  if (opts.json) {
    console.log(JSON.stringify(tree, null, 2));
    return;
  }

  console.log(bold(c('cyan', `${pkgName}`) + c('gray', `@${version}`)));
  tree.children.forEach((child, i) => {
    const isLast = i === tree.children.length - 1;
    renderNode(child, '', isLast, versionMap, [], 0);
  });

  // Re-render properly
  const lines = [];
  tree.children.forEach((child, i) => {
    const isLast = i === tree.children.length - 1;
    renderNode(child, '', isLast, versionMap, lines, 0);
  });
  if (lines.length === 0) {
    console.log(c('gray', '  (no dependencies)'));
  } else {
    console.log(lines.join('\n'));
  }
}

// ─── Main Entry ──────────────────────────────────────────────────────────────

async function main() {
  const opts = parseArgs(process.argv);

  if (opts.help) {
    printHelp();
    return;
  }

  if (opts.version) {
    printVersion();
    return;
  }

  const cwd = opts.cwd;

  // Single package mode
  if (opts.package) {
    if (!existsSync(join(cwd, 'node_modules'))) {
      console.warn(c('yellow', 'Warning: node_modules not found. Run npm install first.'));
    }
    showPackageTree(cwd, opts.package, opts);
    return;
  }

  const graph = buildDepGraph(cwd, opts);

  if (graph.error) {
    console.error(c('red', 'Error: ' + graph.error));
    process.exit(1);
  }

  const { name, version, deps, nmExists, cwd: graphCwd } = graph;

  if (!nmExists) {
    console.warn(c('yellow', 'Warning: node_modules not found. Run npm install first.'));
    console.log(`\n${bold(c('cyan', name))}${c('gray', `@${version}`)}`);
    const depNames = Object.keys(deps);
    if (depNames.length === 0) {
      console.log(c('gray', '  (no dependencies declared)'));
    } else {
      depNames.forEach((d, i) => {
        const isLast = i === depNames.length - 1;
        const connector = isLast ? TREE.last : TREE.branch;
        console.log(connector + c('blue', d) + c('gray', ` ${deps[d]} (not installed)`));
      });
    }
    return;
  }

  // --why mode
  if (opts.why) {
    const target = opts.why;
    const dependents = findDependents(cwd, target, deps);
    const installedVer = getInstalledVersion(cwd, target);

    console.log(`\n${bold(c('cyan', `Why is "${target}" installed?`))}`);
    if (installedVer) {
      console.log(c('gray', `Installed version: ${installedVer}\n`));
    }

    if (dependents.length === 0) {
      console.log(c('yellow', `  "${target}" is not a dependency of this project.`));
    } else {
      dependents.forEach((chain) => {
        const parts = chain.map((p, i) => {
          if (i === 0) return c('gray', p);
          if (i === chain.length - 1) return c('red', bold(p));
          return c('blue', p);
        });
        console.log('  ' + parts.join(c('gray', ' → ')));
      });
    }
    return;
  }

  // --circular mode
  if (opts.circular) {
    console.log(`\n${bold(c('cyan', 'Circular Dependency Detection'))}\n`);
    const cycles = detectCircularDeps(cwd, deps);

    if (cycles.length === 0) {
      console.log(c('green', 'No circular dependencies detected.'));
    } else {
      console.log(c('red', `Found ${cycles.length} circular dependency chain(s):\n`));
      cycles.forEach((cycle, i) => {
        const rendered = cycle.map((p, j) => j === 0 ? c('red', bold(p)) : c('yellow', p));
        console.log(`  ${i + 1}. ` + rendered.join(c('gray', ' → ')) + c('red', ' → ' + cycle[0]));
      });
    }
    return;
  }

  // --stats mode
  if (opts.stats) {
    const stats = computeStats(cwd, deps, nmExists);
    console.log(`\n${bold(c('cyan', `${name}@${version} — Dependency Statistics`))}\n`);
    console.log(`  ${c('blue', 'Direct deps:')}      ${stats.direct}`);
    console.log(`  ${c('white', 'Transitive deps:')}  ${stats.transitive}`);
    console.log(`  ${c('green', 'Total unique:')}     ${stats.total}`);

    if (stats.duplicates.length > 0) {
      console.log(`  ${c('yellow', 'Version conflicts:')} ${stats.duplicates.length}`);
      stats.duplicates.forEach(([pkgName, versions]) => {
        console.log(`    ${c('yellow', pkgName)}: ${[...versions].join(', ')}`);
      });
    } else {
      console.log(`  ${c('green', 'Version conflicts:')} 0`);
    }

    if (stats.nmSize !== null) {
      console.log(`  ${c('magenta', 'node_modules size:')} ${formatSize(stats.nmSize)}`);
    }
    return;
  }

  // --flat mode
  if (opts.flat) {
    const flat = buildFlatList(cwd, deps);
    if (opts.json) {
      console.log(JSON.stringify(flat, null, 2));
      return;
    }
    console.log(`\n${bold(c('cyan', `${name}@${version} — All Dependencies (flat)`))}\n`);
    flat.forEach(({ name: pkgName, versions }) => {
      const isDirect = pkgName in deps;
      const hasDupes = versions.length > 1;
      let nameStr;
      if (hasDupes) {
        nameStr = c('yellow', pkgName) + c('gray', ` (${versions.join(', ')})`);
      } else if (isDirect) {
        nameStr = c('blue', pkgName) + c('gray', `@${versions[0]}`);
      } else {
        nameStr = c('white', pkgName) + c('gray', `@${versions[0]}`);
      }
      console.log(`  ${nameStr}`);
    });
    console.log(c('gray', `\n  Total: ${flat.length} packages`));
    return;
  }

  // Default: tree mode
  const versionMap = {};
  const children = [];

  for (const pkgName of Object.keys(deps)) {
    const node = buildTree(cwd, pkgName, new Set(), versionMap, 0, opts.depth, true);
    children.push(node);
  }

  if (opts.json) {
    const output = {
      name,
      version,
      dependencies: children,
    };
    console.log(JSON.stringify(output, null, 2));
    return;
  }

  console.log('');
  const treeStr = renderTree(name, version, children, versionMap);
  console.log(treeStr);

  // Summary footer
  const totalDirect = children.length;
  const totalNodes = (function count(nodes) {
    return nodes.reduce((acc, n) => acc + 1 + count(n.children), 0);
  })(children);

  const conflictPkgs = Object.entries(versionMap).filter(([, v]) => v.size > 1);
  const circularNodes = (function findC(nodes) {
    return nodes.reduce((acc, n) => acc + (n.isCircular ? 1 : 0) + findC(n.children), 0);
  })(children);

  console.log('');
  console.log(c('gray', `  ${totalDirect} direct · ${totalNodes - totalDirect} transitive · ${totalNodes} total (depth ≤${opts.depth})`));
  if (conflictPkgs.length > 0) {
    console.log(c('yellow', `  ${conflictPkgs.length} version conflict(s) detected`));
  }
  if (circularNodes > 0) {
    console.log(c('red', `  ${circularNodes} circular reference(s) detected`));
  }
}

main().catch((err) => {
  console.error(c('red', 'Fatal: ' + err.message));
  process.exit(1);
});
