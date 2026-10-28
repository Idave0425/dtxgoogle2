// Google's three rulings (Week 3) turned into labels an engineer can act on.

import type { DuplicateCluster, PartRecord } from '../../types';

export interface ClusterLabel {
  kind: 'likely-duplicate' | 'pack-variant' | 'shared-mpn' | 'conflict' | 'identical';
  short: string;
  title: string;
  guidance: string;
}

export function clusterLabel(
  cluster: DuplicateCluster,
  members: PartRecord[]
): ClusterLabel {
  if (cluster.conflictingKeys.length > 0) {
    return {
      kind: 'conflict',
      short: 'Conflict',
      title: 'Shared identifier, conflicting specs',
      guidance:
        'These GPNs share an identifier but state different specs. That is a data issue, not proof they are the same part.',
    };
  }
  if (cluster.evidence === 'pack-variant') {
    return {
      kind: 'pack-variant',
      short: 'Pack variant',
      title: 'Same part, different pack size',
      guidance:
        'Kept as separate GPNs (single vs bulk), but their volume is combined when judging how often this part is used.',
    };
  }
  if (cluster.evidence === 'identical-description') {
    const phases = new Set(members.map((m) => m.phase));
    return phases.size > 1
      ? {
          kind: 'likely-duplicate',
          short: 'Likely duplicate',
          title: 'Same description, different lifecycle status',
          guidance:
            'Identical except for lifecycle phase. Google’s ruling: candidates to consolidate into one GPN.',
        }
      : {
          kind: 'identical',
          short: 'Likely duplicate',
          title: 'Identical description',
          guidance: 'Byte-for-byte the same description under different GPNs.',
        };
  }
  return {
    kind: 'shared-mpn',
    short: 'Same MPN',
    title: 'Same manufacturer part number',
    guidance:
      'Different GPNs carry the same manufacturer part number. They may describe the same part. An engineer has to confirm.',
  };
}
