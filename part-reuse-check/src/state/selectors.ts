// Derived values for components. Pure functions over AppState + the fixtures.

import type {
  AppState,
  AttributeKey,
  DuplicateCluster,
  Family,
  PartRecord,
  StepDefinition,
  VocabOption,
} from '../types';
import { filterCandidates, optionsForStep, poolCounts } from '../engine/candidates';
import { stepsFor } from '../engine/steps';
import { matchAll } from '../engine/match';
import { rankResults } from '../engine/rank';
import { ALL_PARTS, CLUSTERS, VOCAB, VOLUMES } from './context';
import { preferredGpn, volumeOf, volumeTier } from '../engine/volume';

export function selectFamily(state: AppState): Family | null {
  const a = state.query.answers['family'];
  if (a?.state === 'answered') return a.value as Family;
  return null;
}

export function selectSteps(state: AppState): StepDefinition[] {
  return stepsFor(selectFamily(state));
}

export function selectCurrentStep(state: AppState): StepDefinition {
  const steps = selectSteps(state);
  return steps[Math.min(state.stepIndex, steps.length - 1)];
}

export function selectPoolCounts(state: AppState) {
  return poolCounts(ALL_PARTS, state.query);
}

export function selectOptionsForCurrentStep(state: AppState): VocabOption[] {
  const step = selectCurrentStep(state);
  if (step.kind !== 'enum' && step.kind !== 'numeric') return [];
  if (!(step.key in VOCAB)) {
    // family step: vocab holds canonical values from the data (all families)
    if (step.key === 'family') return VOCAB.family ?? [];
    return [];
  }
  return optionsForStep(ALL_PARTS, state.query, step.key as AttributeKey, VOCAB);
}

export function selectClustersForVisibleResults(state: AppState): DuplicateCluster[] {
  if (!state.results) return [];
  const gpns = new Set(state.results.map((r) => r.part.gpn));
  return CLUSTERS.filter((c) => c.gpns.some((g) => gpns.has(g)));
}

export function selectAllParts(): PartRecord[] {
  return ALL_PARTS;
}
export function selectAllClusters(): DuplicateCluster[] {
  return CLUSTERS;
}

export function selectPartByGpn(gpn: string): PartRecord | undefined {
  return ALL_PARTS.find((p) => p.gpn === gpn);
}

/** For FR-13: records that would survive scope but were disqualified by answers. */
export function selectExcluded(state: AppState) {
  if (!state.results) return [];
  return state.results.filter((r) => r.verdict === 'different');
}

// ---------- volume (Week 3 feedback) ----------

export function selectVolumeSource() {
  return VOLUMES.source;
}

export function selectVolume(gpn: string) {
  return { record: volumeOf(VOLUMES, gpn), tier: volumeTier(VOLUMES, gpn) };
}

/** Largest annual quantity among the given GPNs, for scaling volume bars. */
export function selectMaxVolume(gpns: string[]): number {
  let max = 0;
  for (const g of gpns) max = Math.max(max, volumeOf(VOLUMES, g)?.annualQty ?? 0);
  return max;
}

export function selectPreferredGpn(state: AppState): string | null {
  return state.results ? preferredGpn(VOLUMES, state.results) : null;
}

export function selectVolumes() {
  return VOLUMES;
}

/**
 * Index of the furthest step the engineer may jump to: every attribute step
 * before it is answered or skipped. Scope always counts as settled.
 */
export function selectFurthestReachable(state: AppState): number {
  const steps = selectSteps(state);
  for (let i = 0; i < steps.length; i++) {
    const k = steps[i].key as string;
    if (k === '__scope__' || k === '__review__') continue;
    const a = state.query.answers[steps[i].key];
    if (!a || a.state === 'pending') return Math.max(i, state.stepIndex);
  }
  return steps.length - 1;
}

// ---------- titles and shortlist (UI refresh) ----------

/**
 * The query as the engineer would say it: "M3 × 0.5 × 8 mm pan phillips screw".
 * Used as the results h1, so the screen is named after the part, not "Results".
 */
export function selectQuerySummary(state: AppState): string {
  const a = state.query.answers;
  const v = (k: AttributeKey) => (a[k]?.state === 'answered' ? a[k]!.value : null);
  const family = (v('family') as string | null) ?? 'fastener';
  const size = v('threadSize') ?? v('fitsScrewSize');
  const dims: string[] = [];
  if (size !== null) dims.push(String(size));
  if (v('threadPitchMm') !== null) dims.push(String(v('threadPitchMm')));
  if (v('lengthMm') !== null) dims.push(`${v('lengthMm')} mm`);
  const sizePart = dims.join(' × ');
  const washerDims = (
    [
      ['innerDiameterMm', 'ID'],
      ['outerDiameterMm', 'OD'],
      ['thicknessMm', 'thick'],
    ] as const
  )
    .filter(([k]) => v(k) !== null)
    .map(([k, l]) => `${v(k)} mm ${l}`);
  const words = (
    ['headType', 'driveType', 'washerStyle', 'material', 'finish'] as AttributeKey[]
  )
    .map((k) => v(k))
    .filter((x): x is string => typeof x === 'string');
  const head = [sizePart, ...words, family].filter(Boolean).join(' ');
  return washerDims.length ? `${head}, ${washerDims.join(', ')}` : head;
}

/** Live shortlist for the wizard: what already fits the answers so far. */
export function selectShortlist(state: AppState, limit = 5) {
  const family = selectFamily(state);
  if (!family) return { total: 0, rows: [] as ReturnType<typeof rankResults> };
  const steps = stepsFor(family);
  const pool = filterCandidates(ALL_PARTS, state.query);
  const ranked = rankResults(matchAll(pool, state.query, steps), (g) =>
    volumeOf(VOLUMES, g)?.annualQty ?? null
  ).filter((r) => r.verdict !== 'different');
  return { total: ranked.length, rows: ranked.slice(0, limit) };
}
