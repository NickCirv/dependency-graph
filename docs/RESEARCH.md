# dependency-graph — documentation research

Reviewed 21 September 2026. Public GitHub source only.

## Revision and scope

- Commit: [`74081788dcb1eb4e8f73c4b5c5c66b823c3e32e1`](https://github.com/NickCirv/dependency-graph/commit/74081788dcb1eb4e8f73c4b5c5c66b823c3e32e1).
- Tree: `fe304d852cca39c2fe72ff117d4dc35f56e035bb`; truncated: `false`.
- Capture: 6 of 6 eligible text files; all eligible text files.
- Method: package and entrypoint inspection, implementation-interface review, targeted behavior/limitation inspection, and test-source review. This is not an exhaustive correctness or security audit.
- Commands run against repository code: **none**. External services, deployment and npm publication were not verified.

## Claim and evidence map

| Documentation claim | Pinned evidence | Assessment |
| --- | --- | --- |
| Runtime, executable and development commands | [package.json](https://github.com/NickCirv/dependency-graph/blob/74081788dcb1eb4e8f73c4b5c5c66b823c3e32e1/package.json) | Source declaration inspected; runtime unverified |
| Explores an npm project's installed dependency tree and version relationships. | [index.js](https://github.com/NickCirv/dependency-graph/blob/74081788dcb1eb4e8f73c4b5c5c66b823c3e32e1/index.js) | Implementation interfaces inspected; behavior not executed |
| Dependency-tree traversal; version conflicts and cycles; reverse dependents; flat lists and package-size statistics. | [index.js](https://github.com/NickCirv/dependency-graph/blob/74081788dcb1eb4e8f73c4b5c5c66b823c3e32e1/index.js) | Source-backed scope, not a test result |
| Results depend on the lockfile and node_modules state. Missing installations limit transitive detail. Its dep-graph executable alias overlaps with a separate source-import tool. | [index.js](https://github.com/NickCirv/dependency-graph/blob/74081788dcb1eb4e8f73c4b5c5c66b823c3e32e1/index.js) | Material limits documented; service compatibility remains open |
| Existing checks | [test/smoke.test.js](https://github.com/NickCirv/dependency-graph/blob/74081788dcb1eb4e8f73c4b5c5c66b823c3e32e1/test/smoke.test.js) | Test source read; no passing-run claim |

## Documentation inventory and disposition

| Existing document | Decision |
| --- | --- |
| [README.md](https://github.com/NickCirv/dependency-graph/blob/74081788dcb1eb4e8f73c4b5c5c66b823c3e32e1/README.md) | Rewritten with source-specific purpose, direct checkout setup, limitations and verification status. Old section fragments retained where practical. |

Added `docs/REFERENCE.md` for the observed implementation and command surface, and this research record. Protected license and attribution files remain in their original locations without edits. No source or product UI was changed.

## Quality dimensions

| Dimension | Status | Evidence / next step |
| --- | --- | --- |
| Pinned provenance | Verified | Captured commit, tree and per-file hashes recorded below |
| Interface documentation | Partially verified | Source inspection only; run clean-checkout quickstart |
| Runtime behavior | Unverified | No repository execution in this review |
| Test results | Unverified | Existing tests were not run |
| Deployment / package availability | Unverified | No remote publish or live-service check |
| Visual / link checks | Unverified | Portfolio renderer and independent QA are separate from this authoring step |

## Unresolved issues

Results depend on the lockfile and node_modules state. Missing installations limit transitive detail. Its dep-graph executable alias overlaps with a separate source-import tool.

## Captured source inventory

This lists captured provenance, not a claim that every line received a full audit. Binary/generated/excluded files are outside the eligible text capture.

| File | SHA-256 | Bytes |
| --- | --- | --- |
| [LICENSE](https://github.com/NickCirv/dependency-graph/blob/74081788dcb1eb4e8f73c4b5c5c66b823c3e32e1/LICENSE) | `68729cab364d82364078b08d8580ccfa51dc69c81a7d64e8d8d47a1da6c9349d` | 1072 |
| [README.md](https://github.com/NickCirv/dependency-graph/blob/74081788dcb1eb4e8f73c4b5c5c66b823c3e32e1/README.md) | `d4b14d5638101d2df7410bed08c400b35530f37a6e62061bd92b223aa85d500d` | 1891 |
| [package.json](https://github.com/NickCirv/dependency-graph/blob/74081788dcb1eb4e8f73c4b5c5c66b823c3e32e1/package.json) | `de65ec1d3b143e4e09b9d4d033df8a16be30f3b08dc9fab7c3d243f378f5c99d` | 848 |
| [.github/workflows/ci.yml](https://github.com/NickCirv/dependency-graph/blob/74081788dcb1eb4e8f73c4b5c5c66b823c3e32e1/.github/workflows/ci.yml) | `e818f4e6bd805f798665dbbf04964d02f12fc59dd7f18903ad63d26d374ae3f0` | 380 |
| [index.js](https://github.com/NickCirv/dependency-graph/blob/74081788dcb1eb4e8f73c4b5c5c66b823c3e32e1/index.js) | `94a61433b434a7f45ba412dbc305f3853866ba0d2990e50771e968126087e09b` | 22785 |
| [test/smoke.test.js](https://github.com/NickCirv/dependency-graph/blob/74081788dcb1eb4e8f73c4b5c5c66b823c3e32e1/test/smoke.test.js) | `31178f9e769b3cc662acbdb5a9984a51a26132adb2f1a6ecf1b6d94cc9470c1f` | 338 |
