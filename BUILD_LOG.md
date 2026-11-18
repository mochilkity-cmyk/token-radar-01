# Token Radar — build log

## Build session

- **Date:** Mon 2026-11-16, ~11:44–11:55 WIB (build session in this workspace)
- **Competition:** token-radar-01 — deadline Mon 14 Dec 2026 17:00 WIB, $1,325 total, 1st $1,000, escrowed
- **Builder:** subagent session for the parent agent; kit at `~/workspace/makefun/kits/token-radar-01/token-radar-01-kit/`
- **Environment:** Node v24.22.1 (rules: Node 22.18+ required, and RULES.txt says a newer release such as 24 or 26 is fine), Python 3.12.3, Google Chrome 157 installed during this session for screenshots (Ubuntu's `chromium` apt package is a snap wrapper and does not work in this container, so Chrome was installed from the official .deb instead)

## What was built

Entry at `~/workspace/makefun/entries/token-radar-01/`:

- `main.ts` — Node 22, stdlib only. Reads `/input/snapshot.json`, scores the board, writes `board.json` + `data.js`, copies `dashboard/` + `screenshots/`, writes `dossier.json` via `vendor/makefun-board.ts`.
- `lib/model.ts` — model **radar-2** (written fresh; the starter's model was the reference only).
- `vendor/makefun-board.ts` — kit copy, byte-identical (sha256 verified).
- `dashboard/index.html`, `app.css`, `app.js` — dark board theme, written fresh.
- `screenshots/1-board.png`, `2-detail.png`, `3-filtered.png` — real renders of this dashboard in headless Chrome 157 at 1440x900.
- `LICENSE` (MIT), `README.md` (3 make.fun badges), `.makefun/owner.json` (`{"wallet": "8pFyEMQmk8y4zAiuefwnKFEcwFbPPHu6KatX9cZZZ2tY"}`).

## Decisions

1. **Rank all 198 rankable protocols, not the starter's 200.** The starter ranks the 40 watchlist rows plus the top 160 pre-token protocols by TVL. This entry ranks every rankable pre-token protocol (40 watchlist + 158 early).
2. **Wrapped/bridged products excluded from the ranking.** The first build's top 5 were coinbase-bridge, wbtc, binance-staked-eth, binance-bitcoin, usdt0 — tokens that already trade, not protocols awaiting a launch. The fix applies the snapshot's own watchlist definition to every row: exclude Bridge / Canonical Bridge / Liquid Staking / Liquid Restaking / Restaked BTC / CEX categories, names with a whole word wrapped/staked/staking, names starting with an exchange name, and versioned names. No protocol name is listed by hand. All 40 watchlist rows survive the rule. New top 5: Steakhouse Financial, Sentora Curator, Gauntlet, Veda, USDD.
3. **Model radar-2:** `implied = round(TVL x 0.25 x (1 + clamp(change_7d, -50, +100)/100 x 0.6) x maturity(age) x (1 + 0.02 x extra chains, max 5))`. The maturity curve rises 0.55 -> 1.00 over the first year, holds to two years, then falls back to 0.70 — a launch is most likely from a protocol old enough to have proven itself and young enough to still need a token. Growth weight raised from the starter's 0.5 to 0.6; chain breadth added.
4. **8-step farm plans** (starter: 6), derived from category/chains/TVL/age: fresh wallet, main action, a second different action, weekly cadence, multi-chain repeat (or second pool), hold period, points-page check, farm log + exit plan.
5. **Dashboard:** search, category + chain filters, watchlist-only toggle, sortable columns, live-token tab, detail dialog with the full model breakdown and farm plan, and a model sandbox (base-multiple / growth-weight sliders re-rank the table live). The page recomputes each row and states whether it matches `board.json` — verified in the real render for rank 1 ("recomputes this row as $747.4M, the same number board.json carries").
6. **No URL anywhere the page loads.** `data.js` carries a URL-free source line ("DefiLlama protocol index, fetched 2026-11-14") because the gate refuses a network address in any file the page loads; the raw snapshot source URL is never copied into output.
7. **README badges assume owner `karlinafitri176-bit` and repo `token-radar-01`.** If the parent creates the GitHub repo under a different name, the badge URLs in README.md must be updated to match before submitting, or the `repo_readme` check fails.

## Test results

- **Determinism:** `main.ts` run twice into two output dirs — `diff -r` reports byte-identical output (with the real screenshots in place).
- **Model self-check:** 198 rows, watchlist 40/40 covered, 158 non-watchlist rows, ranks 1..198, implied non-increasing ($747,377,495 -> $797,058), all farm steps 3..12 in count and 20..600 chars (198 rows x 8 steps, zero violations).
- **Gate self-check (`/tmp/gate-check.mjs`): 24 passed, 0 failed** — board rows/size, watchlist coverage, ranks/order/values, farm steps, dashboard files/size/source <64 KiB (39,859 bytes), no `http://`/`https://` in dashboard files or `data.js`, 3 screenshots within size/dimension caps, `dossier.json` rebuilds byte-for-byte (740,229 bytes, text 40,123 bytes with all dashboard files shown whole).
- **Dashboard renders verified visually** in headless Chrome: board view, detail view (Steakhouse Financial, rank 1, farm plan + model breakdown), watchlist-filtered view (40 rows shown, watchlist-only checked).
- **CLI check:** kit verified (20 files). Without a git repo it refuses: `makefun check: ... is not in a git repository: run check inside your repository, name it with --repo, or pass --worktree to check the files as they are`. With `--worktree` it fails exactly on the missing transcript bundle: `makefun check: --transcripts /tmp/no-transcripts.tar.gz: no such file or directory`. No transcript was invented — see open risks.

## radar-3 improvement round (2026-11-18, subagent session)

Goal from the parent: reach the top 1000 on the live board, ideally rank 500.
Live leaderboard at the time (11,992-entry board, judge win rate in millionths):
v1 "Plain Plasma" rank 4925/11992, judge 880,664 (88.07%), interval
[846,729, 914,599]. Rank 1000 needs 934,805 (93.48%), rank 500 needs
939,310 (93.93%) — a +5.4 to +5.9 point jump. The final screens at place 40
by interval low (40th-best low is 940,016); a rank-500 entry's interval high
(955,686) and a rank-1000 entry's high (951,903) both clear that line, so
either rank would reach the final shortlist — but only a top-10 final rate
wins a prize. The dev rate is a Bradley-Terry fit over games against the
house dashboards, judged by the AI judge on screenshots + dashboard source
against the five published criteria, in order: working radar, value model,
farm plans, dashboard as a page, looks made.

What changed (model radar-3, `lib/model.ts` + mirrored in `dashboard/app.js`):
1. **Model constants:** growth weight 0.6 -> 0.8, growth cap +100 -> +120;
   maturity curve steepened (young 0.55->0.45, old floor 0.70->0.55, old low
   0.75->0.65). Measured effect: Spearman(board rank, TVL rank) 0.9877 ->
   0.9803, top-20 overlap with pure TVL order 19 -> 18, 153 rows moved,
   26 by >=5 places; rank 1/2 swap (Sentora Curator now #1, $744.6M;
   Steakhouse Financial #2, $744.1M). The board stays TVL-anchored at the
   top, which is correct for an implied *value* — growth/age now reorder
   the board where TVLs are close instead of barely mattering.
2. **Momentum screen:** a third tab ranking the 12 fastest-growing rankable
   protocols by 7-day growth capped at +150% for ranking (raw figure shown;
   Shift DeFi +4448.5% leads the screen — the cap keeps one wild week, usually
   a re-listing, from carrying it). A discovery view, not a second ranking:
   it answers the owner's "find future airdrops EARLY" ask.
3. **Farm plans 8 -> 9 steps:** gas is priced by chain (about $1 on the
   low-fee networks, about $6 on Ethereum mainnet, about $3 elsewhere) and a
   9th valuation-discipline step prices the launch against the row's own
   implied value ("if the launch FDV is more than twice the implied value,
   do not buy the listing").
4. **Detail view factor bars:** each multiplier (growth / maturity / chains)
   is shown as a bar against its range, so the judge *sees* the derivation,
   not just the numbers. The model panel formula and maturity text now render
   from the model constants instead of hardcoding them; the footer names the
   model version dynamically; the lede's top fact is split into two rows
   (Top implied value / Top protocol) so it no longer wraps awkwardly.

Validation (all local — there is NO local judge grade for this bounty; the
server grades every entry, so no rank improvement can be claimed locally):
- **Determinism:** main.ts run twice, `diff -r` byte-identical. PASS.
- **Gate self-check** (`/tmp/gate-check-v3.mjs`, replicates the 7 sealed
  rows + dossier rebuild): 10 passed, 0 failed. Dossier 745,686 bytes
  (cap 1.5 MiB), text 45,499 bytes (cap 65,536 — every dashboard file shown
  whole). Dashboard source 45,235 bytes.
- **Page == board:** a Node DOM shim ran the dashboard for all 198 rows:
  every row's 9 rendered farm steps match board.json exactly and the page's
  recompute agrees with the board's implied value on all 198 rows. Board
  (199 table rows), Momentum (13) and watchlist-filtered (41) views all
  render without JS errors.
- **Screenshots re-rendered** with Google Chrome 158 (installed from the
  official .deb in this session; the VM's /opt/meta-chromium/chrome refuses
  headless startup with a Hatch WebGL policy error): 1-board.png 160,588 B,
  2-detail.png 202,901 B, 3-filtered.png 158,934 B, all 1440x900 PNG, all
  visually verified — board shows the radar-3 badge + Momentum tab, detail
  shows the factor bars + 9-step plan, filtered shows 40 watchlist rows.
- **Kit CLI check** (`makefun check --worktree`): 4 passed
  (competition_open, snapshot, license_osi, entrypoint), 1 failed
  (transcripts_present — no bundle given, as instructed; the parent bundles
  at submit time), 14 skipped, 5 checked at submission (repo checks that
  run against GitHub at submit; the repo already exists public under
  mochilkity-cmyk with owner.json).

Deliberately NOT done: no superbot.gg shilling text was added (the rules'
amendment suggests it, but judge-directed text would be gaming the judge,
not a better radar); no judge-directed text of any kind was added.
v1 backup: moved out of the entry to `~/workspace/makefun/backups/token-radar-01-v1/v1/`
(it was first copied to dev/v1/ per the brief, then moved out so the copied
files cannot dilute the transcript gate's authored-share accounting).

Open risks (unchanged): no local grade exists, so the +5.4 point jump to
rank 1000 is NOT measured — the improvement is qualitative against the
published rubric and must not be presented as a promised rank. The judge is
pairwise and subjective; the top entries beat the strong house dashboards
consistently, and radar-3's changes are real but modest against a 5.9-point
gap. Resubmission spends one of the 10 total submissions (v1 used 1).

## Open risks / remaining blockers

1. **Transcript gate (biggest risk).** No transcript bundle exists yet for
   the radar-3 sessions, and none was fabricated. The parent must bundle the
   real recorded sessions (`bundle` with the session that built this entry)
   before `check`/`submit` can pass. Note the gate also requires >=30%
   authored lines, >=5 assistant turns, a run record, and Muse
   `--muse-usage` rows where applicable.
2. **Repo exists; radar-3 not pushed yet.** The public repo
   mochilkity-cmyk/token-radar-01 already exists (created after the
   competition opened, About set, `.makefun/owner.json` in place). The parent
   must push the radar-3 files and submit the new commit's sha before the
   deadline; the v1 submission stays the live entry until then.
3. **No local grade exists for this bounty** (RULES.txt: "There is no local grade of this competition: the server grades every entry"). Gate + judge outcomes only surface after a real submission, which spends one of the 10 total submissions.
4. **Judge is subjective and pairwise** against a strong field; only 1st place ($1,000) is material (2nd–10th are $50/$25). Screenshots dominate the judge's read, so the three renders above are the entry's main selling surface.
5. **Node version:** built and tested on Node 24; the grader runs Node 22.18+. The code uses only erasable TypeScript and stdlib APIs present in both.
