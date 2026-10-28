// Volume: how much of each GPN Google actually orders. Week 3 feedback.
//
// Volume is a ranking factor (after verdict and lifecycle phase) and the basis
// for the "preferred" part. Until vendor data arrives, nothing is invented:
// every part reads "volume pending" and ranking falls back to the original
// manufacturer-count tiebreak.

import type {
  DuplicateCluster,
  MatchResult,
  VolumeFixture,
  VolumeRecord,
  VolumeTier,
} from '../types';

/** Share of parts with volume data that count as high runners. */
export const HIGH_RUNNER_SHARE = 0.2;
/** Below this share of the top part's volume, a part is a low runner. */
export const LOW_RUNNER_SHARE = 0.05;

export function volumeOf(fixture: VolumeFixture, gpn: string): VolumeRecord | null {
  if (fixture.source === 'none') return null;
  return fixture.byGpn[gpn] ?? null;
}

export function annualQtyOf(fixture: VolumeFixture, gpn: string): number | null {
  return volumeOf(fixture, gpn)?.annualQty ?? null;
}

/**
 * Tier relative to every part in the fixture that has volume data, so a tier
 * means the same thing whatever the current query.
 */
export function volumeTier(fixture: VolumeFixture, gpn: string): VolumeTier {
  const qty = annualQtyOf(fixture, gpn);
  if (qty === null) return 'pending';
  const all = Object.values(fixture.byGpn)
    .map((v) => v.annualQty)
    .sort((a, b) => b - a);
  if (all.length === 0) return 'pending';
  const cutoffIndex = Math.max(0, Math.ceil(all.length * HIGH_RUNNER_SHARE) - 1);
  if (qty >= all[cutoffIndex] && qty > 0) return 'high-runner';
  if (qty < all[0] * LOW_RUNNER_SHARE) return 'low';
  return 'regular';
}

/**
 * The one part to point engineers at: among results that are a match or a
 * close match, the highest-volume part. Null when no candidate has volume
 * data, because "preferred" without data would be invented.
 */
export function preferredGpn(
  fixture: VolumeFixture,
  results: MatchResult[]
): string | null {
  let best: { gpn: string; qty: number } | null = null;
  for (const r of results) {
    if (r.verdict !== 'match' && r.verdict !== 'near') continue;
    const qty = annualQtyOf(fixture, r.part.gpn);
    if (qty === null || qty <= 0) continue;
    if (!best || qty > best.qty) best = { gpn: r.part.gpn, qty };
  }
  return best?.gpn ?? null;
}

/**
 * Pack variants are kept as separate GPNs but their volume is combined
 * (Google ruling 3). Returns null when no member has volume data.
 */
export function combinedVolume(
  fixture: VolumeFixture,
  cluster: DuplicateCluster
): number | null {
  let total = 0;
  let any = false;
  for (const g of cluster.gpns) {
    const q = annualQtyOf(fixture, g);
    if (q === null) continue;
    total += q;
    any = true;
  }
  return any ? total : null;
}

/** 12400 -> "12.4k", 950 -> "950", 1250000 -> "1.25M". */
export function formatQty(n: number): string {
  if (n >= 1_000_000) return `${trim(n / 1_000_000, 2)}M`;
  if (n >= 10_000) return `${trim(n / 1000, 0)}k`;
  if (n >= 1000) return `${trim(n / 1000, 1)}k`;
  return String(n);
}

function trim(n: number, digits: number): string {
  return String(Number(n.toFixed(digits)));
}

export const TIER_LABEL: Record<VolumeTier, string> = {
  'high-runner': 'High runner',
  regular: 'Regular',
  low: 'Low runner',
  pending: 'Volume pending',
};
