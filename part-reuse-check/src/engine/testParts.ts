// Hand-written records for engine unit tests (ARCHITECTURE §8: engine tests
// never depend on the generated fixture).

import type { LifecyclePhase, PartAttributes, PartRecord } from '../types';

const BLANK: PartAttributes = {
  family: 'screw',
  threadSize: null,
  threadPitchMm: null,
  lengthMm: null,
  headType: null,
  driveType: null,
  driveSize: null,
  material: null,
  materialGrade: null,
  finish: null,
  gradeClass: null,
  integralWasher: null,
  fitsScrewSize: null,
  washerStyle: null,
  innerDiameterMm: null,
  outerDiameterMm: null,
  thicknessMm: null,
};

export function part(
  gpn: string,
  attrs: Partial<PartAttributes>,
  opts: { phase?: LifecyclePhase; description?: string; quantity?: number | null } = {}
): PartRecord {
  return {
    gpn,
    gpnKey: gpn.replace(/^0+/, ''),
    description: opts.description ?? `part ${gpn}`,
    partType: 'Fastener-Bolts & Screws',
    phase: opts.phase ?? 'Production',
    sources: [{ sheet: 'Set 02', row: 2 }],
    manufacturers: [],
    attributes: { ...BLANK, ...attrs },
    raw: {},
    packaging: { quantity: opts.quantity ?? null, isKit: false },
  };
}
