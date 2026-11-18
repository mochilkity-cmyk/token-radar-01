![token-radar-01](https://make.fun/badge/token-radar-01.svg)
![rank](https://make.fun/badge/token-radar-01/mochilkity-cmyk/token-radar-01/rank.svg)
![reward](https://make.fun/badge/token-radar-01/mochilkity-cmyk/token-radar-01/reward.svg)

# Token Radar — every pre-token protocol, ranked by what its token could be worth

An entry for [make.fun](https://make.fun) competition **token-radar-01**
([bounty page](https://make.fun/bounty/token-radar-01)).

## What it does

`main.ts` (Node 22, standard library only) reads the frozen DefiLlama
snapshot at `/input/snapshot.json` — 758 protocols, 40 on the watchlist —
and ranks **all 198 rankable pre-token protocols** by an implied value
derived from the snapshot's own figures. It writes the ranked board to
`/output/board.json`, the dashboard's data to `/output/data.js`, copies
`dashboard/` and `screenshots/` to `/output`, and writes
`/output/dossier.json` with the vendored make.fun library.

## The model (radar-3)

```
implied = round( tvl_usd x 0.25
  x (1 + clamp(change_7d, -50, +120) / 100 x 0.8)
  x maturity(age) x (1 + 0.02 x extra chains, max 5) )
```

- **Base:** a token launch is usually sized against the value already
  locked in the protocol, so implied value starts at a quarter of TVL.
- **Growth:** TVL growth over 7 days, clamped so one wild week cannot
  carry a row. The weight is 0.8, so a protocol that doubled its TVL in
  a week earns a 96% premium and one that halved it loses 40% — growth
  reorders the board where TVLs are close, but it never lets a small
  protocol outrank a giant on momentum alone.
- **Maturity:** the age curve. 0.45 for a protocol listed days ago, rising
  to 1.00 at one year, flat to two years, then falling back to 0.55 — a
  launch is most likely from a protocol old enough to have proven itself
  and young enough to still need a token. The curve is steep on purpose:
  age is the one figure that separates a launch that may come from a
  protocol that has decided not to launch.
- **Chains:** each extra chain adds 2% (capped at 10%): more users to farm,
  more networks a token can land on.

No protocol name is special-cased; the same function scores every row.
Wrapped, staked and bridged products of tokens that already trade are
excluded from the ranking — WBTC is Bitcoin on Ethereum, not a protocol
still waiting on a launch — using the snapshot's own watchlist definition
(category, name words, exchange prefixes), never a hand-written list.
Each row also carries a 9-step farm plan derived from its category,
chains, TVL and age, with a cost and a time per step; gas is priced by
chain (about $1 on the low-fee networks, about $6 on Ethereum mainnet),
and the last step prices the launch itself against the row's implied
value, so the farmer knows when not to buy.

## The dashboard

`dashboard/` is a static page with no network: search, category and chain
filters, a watchlist-only toggle, sortable columns, a live-token view, a
Momentum screen — the twelve fastest-growing pre-token protocols, by
seven-day growth capped at +150% for ranking — a per-protocol detail view
with the model's breakdown, factor bars for each multiplier and the full
farm plan, and a model sandbox — move the base-multiple or growth-weight
sliders and the table re-ranks with your constants.

## Run it

```bash
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts --input <path to snapshot.json>
```

Deterministic: no clock, no randomness, no network. Two runs over the
same snapshot write byte-identical output.

## Layout

- `main.ts` — the program
- `lib/model.ts` — the radar-3 model, the board, the farm plans
- `vendor/makefun-board.ts` — make.fun's dossier library, unchanged
- `dashboard/` — the static page (`index.html`, `app.css`, `app.js`)
- `screenshots/` — three real renders of the dashboard
- `LICENSE` — MIT
