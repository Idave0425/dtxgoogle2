import { describe, expect, it } from 'vitest';
import type { Query } from '../types';
import { filterCandidates, poolCounts } from './candidates';
import { matchPart } from './match';
import { isNear, stepsFor } from './steps';
import { part } from './testParts';

const scope = { phases: ['Production' as const], allowKits: false, strict: false };
const q = (answers: Record<string, string | number>): Query => ({
  scope,
  answers: Object.fromEntries(
    Object.entries(answers).map(([key, value]) => [key, { key: key as any, state: 'answered', value }])
  ),
});

describe('near-match tolerance', () => {
  it('treats 5.5 mm as near 5.4 mm, but not 6 mm', () => {
    expect(isNear('lengthMm', 5.4, 5.5)).toBe(true);
    expect(isNear('lengthMm', 5.4, 6)).toBe(false);
  });

  it('never treats an equal value as near', () => {
    expect(isNear('lengthMm', 8, 8)).toBe(false);
  });

  it('never applies to thread pitch: close is still wrong', () => {
    expect(isNear('threadPitchMm', 0.5, 0.45)).toBe(false);
  });

  it('keeps near parts in the pool and labels them near', () => {
    const parts = [
      part('A', { threadSize: 'M3', lengthMm: 5.4 }),
      part('B', { threadSize: 'M3', lengthMm: 5.5 }),
      part('C', { threadSize: 'M3', lengthMm: 8 }),
      part('D', { threadSize: 'M3', lengthMm: null }),
    ];
    const query = q({ family: 'screw', threadSize: 'M3', lengthMm: 5.4 });
    expect(filterCandidates(parts, query).map((p) => p.gpn)).toEqual(['A', 'B', 'D']);
    expect(poolCounts(parts, query)).toEqual({ total: 3, exact: 1, near: 1, unknown: 1 });

    const steps = stepsFor('screw');
    expect(matchPart(parts[0], query, steps).verdict).toBe('match');
    const near = matchPart(parts[1], query, steps);
    expect(near.verdict).toBe('near');
    expect(near.nearKeys).toEqual(['lengthMm']);
    expect(matchPart(parts[2], query, steps).verdict).toBe('different');
    expect(matchPart(parts[3], query, steps).verdict).toBe('review');
  });
});
