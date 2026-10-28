// Total, deterministic ordering. ARCHITECTURE §5, FR-12, amended by the
// Week 3 feedback: how well it matches, then lifecycle phase, then volume.

import type { LifecyclePhase, MatchResult, ResultVerdict } from '../types';

const VERDICT_RANK: Record<ResultVerdict, number> = {
  match: 0,
  near: 1,
  review: 2,
  different: 3,
};

/** Annual quantity for a GPN, or null when volume is pending. */
export type VolumeLookup = (gpn: string) => number | null;

const PHASE_RANK: Record<LifecyclePhase, number> = {
  Production: 0,
  Preliminary: 1,
  Planning: 2,
  Prototype: 3,
  'End of Production': 4,
  Sunset: 5,
  Obsolete: 6,
};

function statedCount(r: MatchResult): number {
  let n = 0;
  for (const v of Object.values(r.part.attributes)) {
    if (v !== null && v !== undefined) n++;
  }
  return n;
}

export function rankResults(
  results: MatchResult[],
  volumeOf: VolumeLookup = () => null
): MatchResult[] {
  const copy = [...results];
  copy.sort((a, b) => {
    const dv = VERDICT_RANK[a.verdict] - VERDICT_RANK[b.verdict];
    if (dv !== 0) return dv;
    const dp = PHASE_RANK[a.part.phase] - PHASE_RANK[b.part.phase];
    if (dp !== 0) return dp;
    // Higher volume first; pending volume sorts after any known volume.
    const va = volumeOf(a.part.gpn);
    const vb = volumeOf(b.part.gpn);
    if (va !== vb) {
      if (va === null) return 1;
      if (vb === null) return -1;
      return vb - va;
    }
    const dm = b.part.manufacturers.length - a.part.manufacturers.length;
    if (dm !== 0) return dm;
    const ds = statedCount(b) - statedCount(a);
    if (ds !== 0) return ds;
    return a.part.gpn.localeCompare(b.part.gpn);
  });
  return copy;
}
