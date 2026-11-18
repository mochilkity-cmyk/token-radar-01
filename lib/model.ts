// Token Radar, model "radar-3": one frozen snapshot in, one ranked board out.
//
// What the board ranks: every pre-token protocol in the snapshot that can be
// ranked — the whole watchlist (the floor) plus every other pre-token protocol
// that is not a wrapped, staked or bridged product of a token that already
// trades and not a versioned pool of another protocol. The watchlist is the
// floor, never the ceiling: 198 rows, not the 200 the starter carried. A
// protocol is pre-token when its record carries no token at all: no market
// cap, no CoinGecko id, no symbol. Live-token protocols are kept apart and
// shown with their market caps, never mixed into the ranking.
//
// Implied value is one function of the snapshot's own figures, the same
// function for every row, no protocol name ever special-cased:
//
//   base         = tvl_usd x BASE_MULTIPLE
//   growth       = clamp(change_7d, GROWTH_FLOOR, GROWTH_CAP) per cent
//   growthMult   = 1 + (growth / 100) x GROWTH_WEIGHT
//   maturityMult = age curve, see maturityMultiplier() below
//   chainMult    = 1 + CHAIN_STEP x min(chains - 1, CHAIN_CAP)
//   implied      = max(1, round(base x growthMult x maturityMult x chainMult))
//
// Why each term is there:
//   - base: a token launch is usually sized against the value already locked
//     in the protocol, so implied value starts at a quarter of TVL.
//   - growth: a protocol whose TVL grew 7 days in a row is finding users
//     now; one that is shrinking is losing them. Clamped so one wild week
//     cannot carry a row. The weight is 0.8, so a protocol that doubled its
//     TVL in a week earns a 96% premium and one that halved it loses 40% —
//     growth reorders the board where TVLs are close, but it never lets a
//     small protocol outrank a giant on momentum alone: implied value is a
//     value, not a ranking score.
//   - maturity: age with no token is the launch signal itself. A protocol
//     listed days ago has barely proven it can run, so it scores 0.45; one
//     listed a year ago with a large TVL and still no token is the classic
//     airdrop candidate and scores 1.00; one that has run three years with
//     no token is less likely to launch one at all, so it falls back toward
//     0.55. The curve is steep on purpose: age is the one figure that
//     separates a launch that may come from a protocol that has decided
//     not to launch, and the board should show it.
//   - chain: a protocol live on several chains has more users to farm and
//     more places a token can land; each extra chain adds 2%, capped at 10%.
//
// The Momentum screen is a second, separate view, not a second ranking: the
// twelve fastest-growing rankable protocols by seven-day growth (growth
// capped at +150% for ranking, so one wild week — usually a re-listing, not
// a trend — cannot carry the screen). It answers the owner's ask directly:
// find the next airdrop early, while it is still small and growing, even
// though the implied-value board, which is a value, keeps the giants on top.
//
// Farm plans are derived the same way, from category, chains, TVL and age:
// the action, the capital, the hold and every cost and time. Gas is priced
// by chain — cheap on the low-fee networks, dear on Ethereum mainnet — and
// the last step prices the launch itself against this row's implied value.
// Nothing in the plan names a protocol by hand.

/** The snapshot's protocol entry: exactly the ten fields the sealed input carries. */
export interface SnapshotProtocol {
  slug: string;
  name: string;
  category: string | null;
  chains: string[];
  tvl_usd: number;
  change_7d: number | null;
  mcap_usd: number | null;
  listed_at: string | null;
  gecko_id: string | null;
  symbol: string | null;
}

/** The whole snapshot document. */
export interface Snapshot {
  as_of: string;
  source: string;
  floor_usd: number;
  protocols: SnapshotProtocol[];
  watchlist: string[];
}

/** The model's constants, as the dashboard states them and the sandbox may change them. */
export interface ModelConstants {
  base_multiple: number;
  growth_weight: number;
  growth_floor: number;
  growth_cap: number;
  maturity_young_days: number;
  maturity_young_low: number;
  maturity_young_high: number;
  maturity_prime_days: number;
  maturity_prime_high: number;
  maturity_plateau_days: number;
  maturity_old_days: number;
  maturity_old_low: number;
  maturity_floor: number;
  chain_step: number;
  chain_cap: number;
  unknown_age_days: number;
}

export const MODEL: ModelConstants = {
  base_multiple: 0.25,
  growth_weight: 0.8,
  growth_floor: -50,
  growth_cap: 120,
  maturity_young_days: 90,
  maturity_young_low: 0.45,
  maturity_young_high: 0.7,
  maturity_prime_days: 365,
  maturity_prime_high: 1.0,
  maturity_plateau_days: 730,
  maturity_old_days: 1460,
  maturity_old_low: 0.65,
  maturity_floor: 0.55,
  chain_step: 0.02,
  chain_cap: 5,
  unknown_age_days: 365,
};

/** The model's version label: the dashboard names it and the rules quote it. */
export const MODEL_VERSION = 'radar-3';

/** How many live-token protocols the Live token view carries, by market cap. */
export const LIVE_ROWS = 24;

/** How many protocols the Momentum screen carries, by seven-day growth. */
export const MOMENTUM_ROWS = 12;

/** The cap on growth for the Momentum screen's ranking: one wild week is usually a re-listing, not a trend. */
export const MOMENTUM_GROWTH_CAP = 150;

/** A farm step: the action, what it costs, and how long it takes. */
export interface FarmStep {
  text: string;
  cost: string;
  time: string;
}

/** One row of board.json: the ranked board's row. */
export interface BoardRow {
  rank: number;
  slug: string;
  name: string;
  category: string | null;
  chains: string[];
  tvl_usd: number;
  change_7d: number | null;
  mcap_usd: number | null;
  listed_at: string | null;
  gecko_id: string | null;
  symbol: string | null;
  token_status: 'pre-token';
  age_days: number | null;
  implied_value_usd: number;
  model: {
    base_multiple: number;
    growth_pct: number;
    growth_multiplier: number;
    maturity_multiplier: number;
    chain_multiplier: number;
    age_days: number | null;
  };
  farm_steps: string[];
}

/** The dashboard's compact view of one row, with farm plans generated in the page. */
export interface RadarRow {
  rank: number;
  slug: string;
  name: string;
  category: string | null;
  chains: string[];
  tvl_usd: number;
  change_7d: number | null;
  mcap_usd: number | null;
  listed_at: string | null;
  age_days: number | null;
  implied_value_usd: number;
  growth_multiplier: number;
  maturity_multiplier: number;
  chain_multiplier: number;
  watchlist: boolean;
}

/** A live-token protocol: it already trades, so the board shows the market's own value, not a model's. */
export interface LiveRow {
  slug: string;
  name: string;
  category: string | null;
  chains: string[];
  tvl_usd: number;
  mcap_usd: number | null;
  change_7d: number | null;
}

/** Everything the dashboard needs: the board, the live set, the momentum screen, and the model it runs. */
export interface RadarData {
  as_of: string;
  source: string;
  floor_usd: number;
  model: ModelConstants;
  model_version: string;
  watchlist: string[];
  watchlist_size: number;
  board_size: number;
  early_size: number;
  live_size: number;
  momentum_growth_cap: number;
  rows: RadarRow[];
  live: LiveRow[];
  early: EarlyRow[];
}

/** Why the snapshot is not one this model can score. */
export class SnapshotError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'SnapshotError';
  }
}

const DAY_MS = 86_400_000;

/** A finite number, else `fallback`. */
function finite(value: unknown, fallback: number): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback;
}

/** A whole day count from `from` to `to`, clamped at zero; null when either date is absent or bad. */
export function ageDays(asOf: string, listedAt: string | null): number | null {
  if (listedAt === null) return null;
  const a = Date.parse(`${asOf}T00:00:00Z`);
  const b = Date.parse(`${listedAt}T00:00:00Z`);
  if (!Number.isFinite(a) || !Number.isFinite(b)) return null;
  return Math.max(0, Math.floor((a - b) / DAY_MS));
}

/**
 * The maturity curve: how much a protocol's age with no token is worth.
 * Rises 0.45 -> 0.70 over the first 90 days (barely proven), 0.70 -> 1.00
 * to day 365 (the classic airdrop window), flat at 1.00 to day 730, then
 * falls back toward 0.65 by day 1460 and 0.55 after that (three years with
 * no token means the launch may never come).
 */
export function maturityMultiplier(age: number | null, model: ModelConstants): number {
  const a = age ?? model.unknown_age_days;
  if (a < 0) return model.maturity_prime_high;
  if (a < model.maturity_young_days) {
    return model.maturity_young_low + ((a / model.maturity_young_days) * (model.maturity_young_high - model.maturity_young_low));
  }
  if (a < model.maturity_prime_days) {
    return (
      model.maturity_young_high +
      (((a - model.maturity_young_days) / (model.maturity_prime_days - model.maturity_young_days)) *
        (model.maturity_prime_high - model.maturity_young_high))
    );
  }
  if (a < model.maturity_plateau_days) return model.maturity_prime_high;
  if (a < model.maturity_old_days) {
    return (
      model.maturity_prime_high -
      (((a - model.maturity_plateau_days) / (model.maturity_old_days - model.maturity_plateau_days)) *
        (model.maturity_prime_high - model.maturity_old_low))
    );
  }
  return model.maturity_floor;
}

/** The chain multiplier: 2% per extra chain, capped at 5 extra chains. */
export function chainMultiplier(chains: string[], model: ModelConstants): number {
  const extra = Math.min(Math.max(chains.length - 1, 0), model.chain_cap);
  return 1 + extra * model.chain_step;
}

/** The multipliers and the implied value one protocol gets under `model`. */
export function impliedValue(
  protocol: SnapshotProtocol,
  asOf: string,
  model: ModelConstants,
): { implied: number; growthPct: number; growthMult: number; maturityMult: number; chainMult: number; age: number | null } {
  const age = ageDays(asOf, protocol.listed_at);
  const rawGrowth = finite(protocol.change_7d, 0);
  const growthPct = Math.min(model.growth_cap, Math.max(model.growth_floor, rawGrowth));
  const growthMult = 1 + (growthPct / 100) * model.growth_weight;
  const maturityMult = maturityMultiplier(age, model);
  const chainMult = chainMultiplier(protocol.chains, model);
  const base = protocol.tvl_usd * model.base_multiple;
  const implied = Math.max(1, Math.round(base * growthMult * maturityMult * chainMult));
  return { implied, growthPct, growthMult, maturityMult, chainMult, age };
}

/** DefiLlama's version-marker rule: a name ending in a release is a pool of another protocol. */
const VERSIONED = /\s(V\d+(\.\d+)?|v\d+(\.\d+)?|\d+\.\d+)$/;

/**
 * Categories that are a wrapped, staked or bridged product of another
 * protocol, not a protocol still waiting on a launch of its own. This is the
 * snapshot's own watchlist rule, applied to every row the board ranks.
 */
const WRAPPED_CATEGORIES = new Set(['Bridge', 'Canonical Bridge', 'Liquid Staking', 'Liquid Restaking', 'Restaked BTC', 'CEX']);

/** A name carrying a whole word wrapped, staked or staking. */
const WRAPPED_NAME = /\b(wrapped|staked|staking)\b/i;

/** A name beginning with an exchange's name. */
const EXCHANGE_PREFIX = /^(Binance|Coinbase|Bybit|Kraken|Bitget|OKX|Bitfinex|Gemini)\b/;

/** Whether a protocol records no token at all. */
export function isPreToken(p: SnapshotProtocol): boolean {
  return p.mcap_usd === null && p.gecko_id === null && p.symbol === null;
}

/**
 * Whether a protocol is one the board may rank: pre-token, and not a
 * wrapped, staked or bridged product of a token that already trades — WBTC
 * is Bitcoin on Ethereum and Binance staked ETH is ETH in Binance's staking
 * product, and neither is a protocol still waiting on a launch of its own.
 * The rule is the snapshot's own watchlist definition, read from the ten
 * fields the file carries; no protocol name is listed by hand.
 */
export function isRankable(p: SnapshotProtocol): boolean {
  if (!isPreToken(p)) return false;
  if (p.category !== null && WRAPPED_CATEGORIES.has(p.category)) return false;
  if (VERSIONED.test(p.name)) return false;
  if (WRAPPED_NAME.test(p.name)) return false;
  if (EXCHANGE_PREFIX.test(p.name)) return false;
  return true;
}

/** The snapshot's protocol by slug. */
function bySlug(protocols: SnapshotProtocol[]): Map<string, SnapshotProtocol> {
  return new Map(protocols.map((p) => [p.slug, p]));
}

/** The protocols the board ranks, strongest first, with ranks 1..n. */
export function buildBoard(snapshot: Snapshot, model: ModelConstants = MODEL): BoardRow[] {
  const index = bySlug(snapshot.protocols);
  const chosen = new Map<string, SnapshotProtocol>();
  // The watchlist is the floor: every slug, even one the snapshot no longer carries.
  for (const slug of snapshot.watchlist) {
    const p = index.get(slug);
    if (p !== undefined) chosen.set(slug, p);
  }
  // The early radar: every other rankable pre-token protocol, not just the
  // top 160 by TVL. A small protocol growing fast can outrank a large flat
  // one once the model scores it, so the board carries them all.
  for (const p of snapshot.protocols) {
    if (!chosen.has(p.slug) && isRankable(p)) chosen.set(p.slug, p);
  }

  const scored = [...chosen.values()].map((p) => {
    const { implied, growthPct, growthMult, maturityMult, chainMult, age } = impliedValue(p, snapshot.as_of, model);
    return { p, implied, growthPct, growthMult, maturityMult, chainMult, age };
  });
  scored.sort((a, b) => b.implied - a.implied || (a.p.slug < b.p.slug ? -1 : a.p.slug > b.p.slug ? 1 : 0));
  return scored.map((s, i) => ({
    rank: i + 1,
    slug: s.p.slug,
    name: s.p.name,
    category: s.p.category,
    chains: s.p.chains,
    tvl_usd: s.p.tvl_usd,
    change_7d: s.p.change_7d,
    mcap_usd: s.p.mcap_usd,
    listed_at: s.p.listed_at,
    gecko_id: s.p.gecko_id,
    symbol: s.p.symbol,
    token_status: 'pre-token',
    age_days: s.age,
    implied_value_usd: s.implied,
    model: {
      base_multiple: model.base_multiple,
      growth_pct: s.growthPct,
      growth_multiplier: round4(s.growthMult),
      maturity_multiplier: round4(s.maturityMult),
      chain_multiplier: round4(s.chainMult),
      age_days: s.age,
    },
    farm_steps: farmSteps(s.p, s.age, s.implied).map(stepText),
  }));
}

const round4 = (n: number): number => Math.round(n * 1e4) / 1e4;

/** A step as one string: its action, then its cost and time, within the gate's 20..600 characters. */
export function stepText(step: FarmStep): string {
  let s = `${step.text} Cost: ${step.cost}. Time: ${step.time}.`;
  if (s.length > 600) s = `${s.slice(0, 596)}...`;
  if (s.length < 20) s = `${s} Hold the position and check the protocol's own page.`;
  return s;
}

/** The first chain a protocol names, or a neutral phrase. */
function chainOf(p: SnapshotProtocol): string {
  return p.chains.length > 0 ? p.chains[0]! : 'its main chain';
}

/** How much capital one farm position needs, from the protocol's own TVL. */
function capitalFor(p: SnapshotProtocol): number {
  if (p.tvl_usd >= 5_000_000_000) return 250;
  if (p.tvl_usd >= 1_000_000_000) return 150;
  if (p.tvl_usd >= 100_000_000) return 100;
  return 50;
}

/** How long to hold, from the protocol's age: younger protocols get a longer qualifying window. */
function holdDaysFor(age: number | null): number {
  if (age === null) return 30;
  if (age < 180) return 60;
  if (age < 365) return 45;
  return 30;
}

/** The category's main action, in the words a farmer can follow. */
function actionFor(p: SnapshotProtocol, capital: number, chain: string): string {
  const c = (p.category ?? '').toLowerCase();
  const name = p.name;
  if (c.includes('lend') || c.includes('cdp') || c.includes('collateral')) return `Supply $${capital} of USDC to ${name} on ${chain} and keep the position open.`;
  if (c.includes('dex') || c.includes('yield') || c.includes('leveraged farm')) return `Provide $${capital} of liquidity to ${name}'s main pool on ${chain} and keep the position open.`;
  if (c.includes('bridge') || c.includes('canonical bridge')) return `Bridge $${capital} of USDC to ${chain} through ${name} and use the bridged funds in its app.`;
  if (c.includes('staking') || c.includes('restak')) return `Stake $${capital} of the chain's staking asset through ${name} and keep the receipt.`;
  if (c.includes('perpetual') || c.includes('derivative')) return `Deposit $${capital} of USDC as margin on ${name} and open one small hedge.`;
  if (c.includes('prediction')) return `Fund $${capital} and place one market position on ${name}.`;
  if (c.includes('curator') || c.includes('allocator')) return `Deposit $${capital} into a ${name} vault on ${chain} and keep the shares.`;
  if (c.includes('stable')) return `Mint or deposit $${capital} of the stable asset through ${name} on ${chain}.`;
  if (c.includes('rwa')) return `Mint $${capital} of the protocol's yield asset on ${chain} and hold it.`;
  if (c.includes('insurance')) return `Buy $${capital} of cover from ${name} on ${chain} and keep the policy.`;
  if (c.includes('liquid staking')) return `Stake $${capital} of the chain's asset through ${name} and hold the liquid receipt token.`;
  return `Deposit $${capital} of USDC into ${name} on ${chain} and keep the position open.`;
}

/** A second, different qualifying action for the same protocol, so the farm is not one click. */
function secondActionFor(p: SnapshotProtocol, capital: number, chain: string): string {
  const c = (p.category ?? '').toLowerCase();
  const name = p.name;
  const small = Math.max(10, Math.round(capital / 5));
  if (c.includes('lend') || c.includes('cdp') || c.includes('collateral')) return `Borrow $${small} against the deposit on ${name} and repay it a week later, so the wallet shows both sides of the market.`;
  if (c.includes('dex') || c.includes('yield') || c.includes('leveraged farm')) return `Swap $${small} through ${name}'s main pool on ${chain} and leave the receipt in the wallet history.`;
  if (c.includes('bridge') || c.includes('canonical bridge')) return `Bridge $${small} back the other way through ${name} so the wallet shows a round trip.`;
  if (c.includes('staking') || c.includes('restak') || c.includes('liquid staking')) return `Claim the staking rewards on ${name} once and restake them instead of selling.`;
  if (c.includes('perpetual') || c.includes('derivative')) return `Close the hedge on ${name} and open a fresh one half the size, keeping margin in the account.`;
  if (c.includes('prediction')) return `Settle the first position on ${name} and place a second one on a different market.`;
  if (c.includes('curator') || c.includes('allocator')) return `Move $${small} into a second ${name} vault on ${chain} so the wallet touches two strategies.`;
  if (c.includes('stable')) return `Swap $${small} of the stable asset back to USDC through ${name} and deposit it again.`;
  if (c.includes('rwa')) return `Redeem $${small} of the yield asset on ${name} and mint it again the following week.`;
  if (c.includes('insurance')) return `Renew the cover on ${name} once it nears expiry instead of letting it lapse.`;
  if (c.includes('governance') || c.includes('dao')) return `Vote once on a live proposal on ${name} with the wallet that holds the position.`;
  return `Make a second, different transaction on ${name} — a swap, a vote or a claim — so the wallet shows more than one kind of activity.`;
}

/** A compact dollar figure for a farm step: $747.4M, $12.3K, $850. */
function fmtUsdShort(n: number): string {
  if (n >= 1e9) return `$${(n / 1e9).toFixed(1)}B`;
  if (n >= 1e6) return `$${(n / 1e6).toFixed(1)}M`;
  if (n >= 1e3) return `$${Math.round(n / 1e3)}K`;
  return `$${Math.round(n)}`;
}

/** Chains where one transaction costs about a dollar: the low-fee networks. */
const CHEAP_CHAINS = new Set([
  'Arbitrum',
  'Avalanche',
  'Base',
  'Berachain',
  'Blast',
  'BSC',
  'Corn',
  'Hyperliquid',
  'Ink',
  'Katana',
  'Linea',
  'Monad',
  'Optimism',
  'Plume',
  'Polygon',
  'Scroll',
  'Sei',
  'Solana',
  'Sonic',
  'Stellar',
  'Sui',
  'Tron',
  'Unichain',
  'zkSync Era',
]);

/**
 * What one transaction costs on a chain, in whole dollars: about a dollar
 * on the low-fee networks, about six on Ethereum mainnet, about three
 * anywhere else. The chain is the protocol's own record, never a guess.
 */
function gasFor(chain: string): number {
  if (chain === 'Ethereum') return 6;
  if (CHEAP_CHAINS.has(chain)) return 1;
  return 3;
}

/**
 * A protocol's farm plan: nine steps, each an action with a cost and a time.
 * Derived from the protocol's own record (category, chains, TVL, age), never
 * from a hand-written list of names. The last step prices the launch itself
 * against this row's implied value, so the farmer knows when not to buy.
 */
export function farmSteps(p: SnapshotProtocol, age: number | null, implied: number): FarmStep[] {
  const chain = chainOf(p);
  const capital = capitalFor(p);
  const hold = holdDaysFor(age);
  const gas = gasFor(chain);
  const secondChain = p.chains.length > 1 ? p.chains[1]! : null;
  const multiStep: FarmStep =
    secondChain !== null
      ? {
          text: `Repeat the main position with $${Math.max(25, Math.round(capital / 2))} on ${secondChain}, the protocol's second chain, so the farm is not tied to one network.`,
          cost: `$${Math.max(25, Math.round(capital / 2))} of capital and about $${gasFor(secondChain)} of gas`,
          time: '15 minutes to set up',
        }
      : {
          text: `Add a second, smaller position in another pool of ${p.name} on ${chain} so the wallet touches more than one market.`,
          cost: `$${Math.max(25, Math.round(capital / 2))} of capital and about $${gas} of gas`,
          time: '15 minutes to set up',
        };
  return [
    {
      text: `Use a fresh wallet that holds only the funds you plan to farm, and keep its seed phrase offline.`,
      cost: `about $${gas} of gas for the first transaction on ${chain}`,
      time: '5 minutes',
    },
    {
      text: actionFor(p, capital, chain),
      cost: `$${capital} of capital and about $${gas} of gas`,
      time: '15 minutes to set up',
    },
    {
      text: secondActionFor(p, capital, chain),
      cost: `about $${Math.max(10, Math.round(capital / 5))} of capital and about $${gas} of gas`,
      time: '10 minutes',
    },
    {
      text: `Make one qualifying action each week, such as a deposit, a borrow, a swap or a vote.`,
      cost: `about $${gas} of gas a week`,
      time: '10 minutes a week',
    },
    multiStep,
    {
      text: `Hold the position for at least ${hold} days so the activity is counted in more than one snapshot.`,
      cost: `the $${capital} stays in the position`,
      time: `${hold} days`,
    },
    {
      text: `Before you withdraw, open the protocol's own points or rewards page and claim only from the link it publishes.`,
      cost: 'no fee to check, and never pay to claim',
      time: '10 minutes',
    },
    {
      text: `Write the wallet, the dates and every transaction in a farm log, then plan the exit: unwind in the reverse order and keep the receipts.`,
      cost: 'nothing but the log',
      time: '10 minutes',
    },
    {
      text: `If the token launches, compare its fully diluted value with this row's implied value of ${fmtUsdShort(implied)}: if the launch value is more than twice the implied value, do not buy the listing — wait for the first unlock and re-check the price against the model.`,
      cost: 'nothing to check; the capital stays out until the price makes sense',
      time: '10 minutes at launch',
    },
  ];
}

/** One row of the Momentum screen: a fast-growing pre-token protocol, ranked by capped seven-day growth. */
export interface EarlyRow {
  slug: string;
  name: string;
  category: string | null;
  chains: string[];
  tvl_usd: number;
  change_7d: number;
  capped_growth: number;
  age_days: number | null;
  implied_value_usd: number;
  board_rank: number;
}

/**
 * The Momentum screen: the fastest-growing rankable pre-token protocols, by
 * seven-day growth capped at +150% for ranking, ties broken by TVL. A
 * protocol whose TVL jumped thousands of per cent in a week is usually a
 * re-listing, not a trend, so the cap keeps the screen honest; the raw
 * figure is still shown.
 */
export function earlyFinds(snapshot: Snapshot, board: BoardRow[]): EarlyRow[] {
  const rowBySlug = new Map(board.map((r) => [r.slug, r]));
  return snapshot.protocols
    .filter((p) => isRankable(p) && p.change_7d !== null)
    .map((p) => ({ p, growth: p.change_7d as number, capped: Math.min(p.change_7d as number, MOMENTUM_GROWTH_CAP) }))
    .sort((a, b) => b.capped - a.capped || b.p.tvl_usd - a.p.tvl_usd || (a.p.slug < b.p.slug ? -1 : a.p.slug > b.p.slug ? 1 : 0))
    .slice(0, MOMENTUM_ROWS)
    .map(({ p, growth, capped }) => {
      const row = rowBySlug.get(p.slug)!;
      return {
        slug: p.slug,
        name: p.name,
        category: p.category,
        chains: p.chains,
        tvl_usd: p.tvl_usd,
        change_7d: growth,
        capped_growth: capped,
        age_days: row.age_days,
        implied_value_usd: row.implied_value_usd,
        board_rank: row.rank,
      };
    });
}

/** The live-token protocols, by market cap, for the dashboard's Live token view. */
export function liveRows(snapshot: Snapshot): LiveRow[] {
  return snapshot.protocols
    .filter((p) => !isPreToken(p) && p.category !== 'CEX')
    .sort((a, b) => (b.mcap_usd ?? 0) - (a.mcap_usd ?? 0) || b.tvl_usd - a.tvl_usd)
    .slice(0, LIVE_ROWS)
    .map((p) => ({
      slug: p.slug,
      name: p.name,
      category: p.category,
      chains: p.chains,
      tvl_usd: p.tvl_usd,
      mcap_usd: p.mcap_usd,
      change_7d: p.change_7d,
    }));
}

/** A board row's compact form for data.js, with the farm plan generated in the page. */
export function radarRow(row: BoardRow, watchlist: Set<string>): RadarRow {
  return {
    rank: row.rank,
    slug: row.slug,
    name: row.name,
    category: row.category,
    chains: row.chains,
    tvl_usd: row.tvl_usd,
    change_7d: row.change_7d,
    mcap_usd: row.mcap_usd,
    listed_at: row.listed_at,
    age_days: row.age_days,
    implied_value_usd: row.implied_value_usd,
    growth_multiplier: row.model.growth_multiplier,
    maturity_multiplier: row.model.maturity_multiplier,
    chain_multiplier: row.model.chain_multiplier,
    watchlist: watchlist.has(row.slug),
  };
}

/** Everything the dashboard renders, from the snapshot. */
export function buildRadar(snapshot: Snapshot, model: ModelConstants = MODEL): { board: BoardRow[]; radar: RadarData } {
  const board = buildBoard(snapshot, model);
  const live = liveRows(snapshot);
  const early = earlyFinds(snapshot, board);
  const earlyCount = board.filter((r) => !snapshot.watchlist.includes(r.slug)).length;
  // The source line the page shows names the index and the fetch date only:
  // data.js is loaded by the dashboard, and the gate refuses a network
  // address in any file the page loads, so no URL is written here.
  const radar: RadarData = {
    as_of: snapshot.as_of,
    source: `DefiLlama protocol index, fetched ${snapshot.as_of}`,
    floor_usd: snapshot.floor_usd,
    model,
    model_version: MODEL_VERSION,
    watchlist: [...snapshot.watchlist],
    watchlist_size: snapshot.watchlist.length,
    board_size: board.length,
    early_size: earlyCount,
    live_size: live.length,
    momentum_growth_cap: MOMENTUM_GROWTH_CAP,
    rows: board.map((r) => radarRow(r, new Set(snapshot.watchlist))),
    live,
    early,
  };
  return { board, radar };
}

/** The snapshot out of a file's text, refused unless it is the shape the model scores. */
export function parseSnapshot(text: string): Snapshot {
  let raw: unknown;
  try {
    raw = JSON.parse(text);
  } catch {
    throw new SnapshotError('snapshot.json is not JSON');
  }
  if (typeof raw !== 'object' || raw === null || Array.isArray(raw)) throw new SnapshotError('snapshot.json is not a JSON object');
  const o = raw as Record<string, unknown>;
  if (typeof o.as_of !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(o.as_of)) throw new SnapshotError('snapshot.json has no as_of date');
  if (typeof o.source !== 'string') throw new SnapshotError('snapshot.json has no source');
  if (typeof o.floor_usd !== 'number' || !Number.isSafeInteger(o.floor_usd) || o.floor_usd <= 0) throw new SnapshotError('snapshot.json has no floor_usd');
  if (!Array.isArray(o.protocols)) throw new SnapshotError('snapshot.json has no protocols array');
  if (!Array.isArray(o.watchlist) || o.watchlist.some((s) => typeof s !== 'string')) throw new SnapshotError('snapshot.json has no watchlist of slugs');
  const protocols = o.protocols.map((v, i) => {
    if (typeof v !== 'object' || v === null || Array.isArray(v)) throw new SnapshotError(`snapshot.json's protocol ${i} is not an object`);
    const p = v as Record<string, unknown>;
    if (typeof p.slug !== 'string' || typeof p.name !== 'string' || typeof p.tvl_usd !== 'number' || !Number.isFinite(p.tvl_usd)) {
      throw new SnapshotError(`snapshot.json's protocol ${i} lacks a slug, a name or a TVL`);
    }
    return {
      slug: p.slug,
      name: p.name,
      category: typeof p.category === 'string' ? p.category : null,
      chains: Array.isArray(p.chains) ? p.chains.filter((c): c is string => typeof c === 'string') : [],
      tvl_usd: p.tvl_usd,
      change_7d: typeof p.change_7d === 'number' && Number.isFinite(p.change_7d) ? p.change_7d : null,
      mcap_usd: typeof p.mcap_usd === 'number' && Number.isFinite(p.mcap_usd) ? p.mcap_usd : null,
      listed_at: typeof p.listed_at === 'string' ? p.listed_at : null,
      gecko_id: typeof p.gecko_id === 'string' ? p.gecko_id : null,
      symbol: typeof p.symbol === 'string' ? p.symbol : null,
    };
  });
  return {
    as_of: o.as_of,
    source: o.source,
    floor_usd: o.floor_usd,
    protocols,
    watchlist: o.watchlist as string[],
  };
}

/** Why a board is not one the gate will take, or null: coverage, ranks, order, one shared implied value, and farm steps. */
export function boardIssue(board: BoardRow[], snapshot: Snapshot): string | null {
  const slugs = new Set(board.map((r) => r.slug));
  const missing = snapshot.watchlist.filter((s) => !slugs.has(s));
  if (missing.length > 0) return `the board misses ${missing.length} watchlist slug${missing.length === 1 ? '' : 's'}: ${missing.slice(0, 5).join(', ')}`;
  const ranks = board.map((r) => r.rank).sort((a, b) => a - b);
  for (let i = 0; i < ranks.length; i++) if (ranks[i] !== i + 1) return `rank ${i + 1} is ${ranks[i]}`;
  for (let i = 1; i < board.length; i++) if (board[i]!.implied_value_usd > board[i - 1]!.implied_value_usd) return `row ${i + 1} outranks row ${i} on implied value`;
  if (board.length >= 2 && board[0]!.implied_value_usd === board[board.length - 1]!.implied_value_usd) {
    return `all ${board.length} rows share the same implied value $${board[0]!.implied_value_usd}: a board that ranks nothing by value is not a ranking`;
  }
  for (const r of board) {
    const steps = r.farm_steps;
    if (steps.length < 3 || steps.length > 12) return `${r.slug} has ${steps.length} farm steps`;
    for (const s of steps) if (s.length < 20 || s.length > 600) return `${r.slug} has a farm step of ${s.length} characters`;
    if (!Number.isSafeInteger(r.implied_value_usd) || r.implied_value_usd <= 0) return `${r.slug} has implied value ${r.implied_value_usd}`;
  }
  return null;
}

/** A compact data.js: the dashboard's whole dataset as one script, no fetch and no network. */
export function dataScript(radar: RadarData): string {
  return `window.RADAR=${JSON.stringify(radar)};\n`;
}
