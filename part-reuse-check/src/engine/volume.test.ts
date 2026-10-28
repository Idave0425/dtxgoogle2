import { describe, expect, it } from 'vitest';
import type { MatchResult, VolumeFixture } from '../types';
import { rankResults } from './rank';
import {
  annualQtyOf,
  combinedVolume,
  formatQty,
  preferredGpn,
  volumeTier,
} from './volume';
import { part } from './testParts';

const fixture: VolumeFixture = {
  source: 'sample',
  asOf: null,
  byGpn: {
    A: { annualQty: 100, orders: 1 },
    B: { annualQty: 50_000, orders: 30 },
    C: { annualQty: 9_000, orders: 8 },
    D: { annualQty: 2_000, orders: 3 },
    E: { annualQty: 1_000, orders: 2 },
  },
};

function result(gpn: string, verdict: MatchResult['verdict'], phase: any = 'Production'): MatchResult {
  return {
    part: part(gpn, {}, { phase }),
    verdict,
    comparisons: [],
    unknownKeys: [],
    differingKeys: [],
    nearKeys: [],
    exclusionReason: null,
  };
}

describe('volume lookup', () => {
  it('returns null for parts with no data, never zero', () => {
    expect(annualQtyOf(fixture, 'Z')).toBeNull();
    expect(volumeTier(fixture, 'Z')).toBe('pending');
  });

  it('treats everything as pending when the source is none', () => {
    const none: VolumeFixture = { ...fixture, source: 'none' };
    expect(annualQtyOf(none, 'B')).toBeNull();
    expect(volumeTier(none, 'B')).toBe('pending');
  });

  it('tiers parts against the whole fixture', () => {
    expect(volumeTier(fixture, 'B')).toBe('high-runner');
    expect(volumeTier(fixture, 'C')).toBe('regular');
    expect(volumeTier(fixture, 'A')).toBe('low');
  });

  it('formats quantities compactly', () => {
    expect(formatQty(950)).toBe('950');
    expect(formatQty(1250)).toBe('1.3k');
    expect(formatQty(48_000)).toBe('48k');
    expect(formatQty(1_250_000)).toBe('1.25M');
  });
});

describe('ranking: match, then phase, then volume', () => {
  const vol = (g: string) => annualQtyOf(fixture, g);

  it('orders by volume within the same verdict and phase', () => {
    const ranked = rankResults([result('A', 'match'), result('C', 'match'), result('B', 'match')], vol);
    expect(ranked.map((r) => r.part.gpn)).toEqual(['B', 'C', 'A']);
  });

  it('never lets volume beat a better verdict or phase', () => {
    const ranked = rankResults(
      [
        result('B', 'review'),
        result('C', 'match', 'Preliminary'),
        result('A', 'match'),
        result('D', 'near'),
      ],
      vol
    );
    expect(ranked.map((r) => r.part.gpn)).toEqual(['A', 'C', 'D', 'B']);
  });

  it('sorts pending volume after known volume', () => {
    const ranked = rankResults([result('Z', 'match'), result('A', 'match')], vol);
    expect(ranked.map((r) => r.part.gpn)).toEqual(['A', 'Z']);
  });

  it('falls back to the original tiebreaks when no volume is known', () => {
    const ranked = rankResults([result('Y', 'match'), result('X', 'match')]);
    expect(ranked.map((r) => r.part.gpn)).toEqual(['X', 'Y']);
  });
});

describe('preferred part and pack variants', () => {
  it('picks the highest-volume match or near-match, ignoring review', () => {
    const results = [result('A', 'match'), result('C', 'near'), result('B', 'review')];
    expect(preferredGpn(fixture, results)).toBe('C');
  });

  it('has no preferred part when nothing has volume', () => {
    expect(preferredGpn(fixture, [result('Z', 'match')])).toBeNull();
  });

  it('combines pack-variant volume and stays pending when unknown', () => {
    const cluster = { id: 'p', evidence: 'pack-variant' as const, evidenceValue: '', gpns: ['B', 'C', 'Z'], conflictingKeys: [] };
    expect(combinedVolume(fixture, cluster)).toBe(59_000);
    expect(combinedVolume(fixture, { ...cluster, gpns: ['Z'] })).toBeNull();
  });
});
