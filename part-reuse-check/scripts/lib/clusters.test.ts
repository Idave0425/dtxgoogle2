import { describe, expect, it } from 'vitest';
import { findPackVariantClusters, stripPackWording } from './clusters';
import { part } from '../../src/engine/testParts';

describe('pack-variant clusters', () => {
  it('strips pack wording', () => {
    expect(stripPackWording('Screw, M3, 8mm Long (100 Pack)').trim()).toBe('Screw, M3, 8mm Long');
  });

  it('groups single and bulk packs of the same part', () => {
    const parts = [
      part('A', {}, { description: 'Screw, M3x0.5mm, 8mm Long', quantity: null }),
      part('B', {}, { description: 'Screw, M3x0.5mm, 8mm Long (100 Pack)', quantity: 100 }),
      part('C', {}, { description: 'Screw, M3x0.5mm, 10mm Long', quantity: null }),
    ];
    const clusters = findPackVariantClusters(parts);
    expect(clusters).toHaveLength(1);
    expect(clusters[0].gpns).toEqual(['A', 'B']);
    expect(clusters[0].evidence).toBe('pack-variant');
  });

  it('does not call identical single parts a pack variant', () => {
    const parts = [
      part('A', {}, { description: 'Washer, M3, Flat' }),
      part('B', {}, { description: 'Washer, M3, Flat' }),
    ];
    expect(findPackVariantClusters(parts)).toHaveLength(0);
  });
});
