# Release candidate evidence ledger

Local implementation/checks and hosted behavior are separate. Task 4's exact local commands/results are recorded in its handoff report; the controller fills hosted receipts and exact tested revision below. No empty/missing live case is a pass.

| Gate | State | Evidence required |
|---|---|---|
| Local resource/build/legacy draft/fixture regressions | Pass locally | 11 new tests plus existing regression coverage; Task 4 RED/GREEN report |
| Whole branch unit/type/lint/production compiler | Pass locally | At commit 415908b: 70 files / 362 tests; typecheck pass; lint 0 errors / 395 existing warnings; env-free Webpack build pass (Node 22.22.3), not hosted journey proof |
| Stable + automation deployed same reviewed source | Blocked | Vercel IDs/alias/qaCommit, compiled backend commit, HTML commit |
| Stable migration / encrypted hash / retirement | Blocked | Private source census, dry-run/apply/checkpoints, old URL denial |
| Fourteen-step normal two-party journey | Blocked | Independent real Clerk sessions, case assertions and sanitized receipts |
| Signup / onboarding / account switch / expiry | Blocked | Actual UI signup, exact new IDs, separate allowlist, same-browser switch |
| Draft/share/revision/signed-copy/work/archive/reopen | Blocked | UI behavior plus source-linked backend evidence |
| Foreign district/consultant/admin/anonymous boundaries | Blocked | Metadata/history and Next/direct HTTP denial |
| Upload retry/concurrent same ticket/wrong purpose/formats/large file | Blocked | Actual HTTP byte/hash and UI assertions; >4.5 MiB streaming |
| Failed delivery retry / queued reset | Blocked | Induced fault labeled synthetic; actual recipient retry/capture/watchdog cancellation |
| Performance | Blocked | Measured route/action, hardware/runtime, network/throttling, samples |
| Keyboard/semantics/axe/mobile emulation | Blocked for candidate staging | Viewport/device emulation separated from physical devices |
| Physical iOS Safari / Android Chrome / screen-reader speech | Blocked | Devices/speech testing unavailable |
| Real email transport | Blocked | Capture-only; Resend not configured |
| Production deployment/migration | Not applicable | No authorization |

`staging:smoke --expected-commit=<SHA>` is read-only after normal sign-in: it checks current Hub, compiled frontend identity, private byte hashes through authenticated Next/direct routes and anonymous denial. It does not expect a fixed four-row count or fetch a bearer storage URL. Optional alias selection must retain required cross-party checks in final evidence.

`release-journey.mjs` supplies normal sign-in, isolated browser sessions, refreshed Clerk JWT calls, private byte-hash probes and a fourteen-case runner. The controller provides reviewed case adapters inside `.qa-private` using the actual live selectors. Exports: `journeyCases`, `signIn`, `openSession`, `verifyPrivateDownload`, `assertMutableTarget`, `runJourney`. Case callback receives `{browser,resources,accounts,openSession,verifyPrivateDownload}` and must throw on a failed assertion. Missing adapters are Blocked; exceptions produce sanitized Fail records. The runner refuses stable and mixed targets. This helper is not itself completed UI journey evidence.

Never enable raw Playwright auth/network traces or storageState for live runs. No login/password/OTP/cookie/JWT/file-key screenshots. Record safe post-login UI, aliases, case IDs and timings only; raw errors are sanitized because Playwright credential-fill diagnostics can echo input. Private HTTP hashes and IDs stay in private evidence. Existing public/local Playwright configuration is not the live-auth harness.

Legacy rehearsal amendment: focused regression command covers resource/compiled-commit/confirmation gates, fixed-byte identity, shared-source migration without contract merging, draft visibility, repeat apply/seed/reset, and preservation of base/supplementary/unrelated data. Live rehearsal is pending the controller. Exact final amendment counts are in the Task 4 handoff appendix; the earlier whole-suite result is not relabeled as an amendment run.
