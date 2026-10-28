// Step definitions per family. ARCHITECTURE §5, §4.1.

import type { AttributeKey, Family, StepDefinition } from '../types';

export const SCOPE_STEP_KEY = '__scope__' as unknown as AttributeKey;
export const REVIEW_STEP_KEY = '__review__' as unknown as AttributeKey;

export const FAMILY_STEP: StepDefinition = {
  key: 'family',
  prompt: 'What kind of fastener are you looking for?',
  help:
    'Pick the broad family. This decides which attributes we ask you about next — a washer has no head, a screw has no outer diameter.',
  kind: 'enum',
  disqualifying: true,
};

/**
 * Near-match tolerance per numeric attribute (Week 3 feedback). A 5.5 mm
 * screw should surface as a close match for a 5.4 mm search, with its volume,
 * so the engineer can choose. Thread pitch is deliberately absent: a pitch
 * that is close is still a pitch that does not fit.
 */
export const NEAR_TOLERANCE: Partial<Record<AttributeKey, { abs: number; rel: number }>> = {
  lengthMm: { abs: 0.15, rel: 0.03 },
  innerDiameterMm: { abs: 0.1, rel: 0.03 },
  outerDiameterMm: { abs: 0.15, rel: 0.03 },
  thicknessMm: { abs: 0.05, rel: 0.05 },
};

/** True when `found` is stated, not equal, but within the key's tolerance. */
export function isNear(
  key: AttributeKey,
  asked: string | number | null,
  found: string | number | null
): boolean {
  const tol = NEAR_TOLERANCE[key];
  if (!tol || typeof asked !== 'number' || typeof found !== 'number') return false;
  const delta = Math.abs(asked - found);
  return delta >= 0.001 && delta <= Math.max(tol.abs, tol.rel * asked) + 1e-9;
}

const S = (
  key: AttributeKey,
  prompt: string,
  help: string,
  kind: 'enum' | 'numeric',
  disqualifying: boolean,
  unit?: 'mm'
): StepDefinition => ({
  key,
  prompt,
  help,
  kind,
  disqualifying,
  unit,
  nearTolerance: NEAR_TOLERANCE[key],
});

const SCREW_STEPS: StepDefinition[] = [
  S('threadSize', 'Thread size?', 'Metric like M3 or imperial like 10-32. We only match what the record actually says — a diameter without a thread designation is unknown.', 'enum', true),
  S('threadPitchMm', 'Thread pitch?', 'Only 11% of screw records state a pitch. Skip if you do not know it — we will not assume the standard value.', 'numeric', true, 'mm'),
  S('lengthMm', 'Length?', 'Normalised to millimetres (5/8 inch = 15.875 mm). Type any value; parts within ~3% show up as close matches with their volume.', 'numeric', true, 'mm'),
  S('headType', 'Head type?', 'Pan, flat, socket, hex, truss, button, cap, oval, round, flange, low profile, washer head.', 'enum', true),
  S('driveType', 'Drive type?', 'Phillips, hex, Torx, square, slotted, combo. Torx bit size (T10/T20) is captured but not a filter.', 'enum', true),
  S('material', 'Material?', 'Stainless steel vs plain steel is a real difference. 18-8 / 304 / 316 / A2 / A4 are all stainless and merge for search; the grade shows on the result row.', 'enum', true),
  S('finish', 'Finish?', 'Zinc plated, black oxide, passivated and so on. A bare "BLACK" in the description shows up as "black (unspecified)" — it is a colour claim, not a finish spec.', 'enum', true),
  S('integralWasher', 'Does it need a built-in washer?', 'Many records bundle a split-lock or external-tooth washer into the part. Choose a style you need, or skip if plain-is-fine.', 'enum', true),
  S('gradeClass', 'Grade / strength class?', 'Grade 5, Grade 8, Class 8.8… — barely stated in the database, so this step does NOT disqualify records that leave it blank.', 'enum', false),
];

const NUT_STEPS: StepDefinition[] = [
  S('threadSize', 'Thread size?', 'Metric like M5 or imperial like 10-32.', 'enum', true),
  S('threadPitchMm', 'Thread pitch?', 'Only matched when the description states it. Skip if you do not know.', 'numeric', true, 'mm'),
  S('material', 'Material?', 'Stainless, plain steel, brass, nylon…', 'enum', true),
  S('finish', 'Finish?', 'Zinc plated, black oxide, etc.', 'enum', true),
  S('integralWasher', 'Captive / with-washer feature?', 'Keps-style, SEM-style, etc.', 'enum', true),
];

const WASHER_STEPS: StepDefinition[] = [
  S('fitsScrewSize', 'Fits what screw size?', 'Washers state the screw they fit as a thread (M5), a number (#8), or a diameter (1/4in). All three forms live on this list.', 'enum', true),
  S('innerDiameterMm', 'Inner diameter?', '26% of washer records state ID. Skip if you only know the screw size.', 'numeric', true, 'mm'),
  S('outerDiameterMm', 'Outer diameter?', '37% of washer records state OD.', 'numeric', true, 'mm'),
  S('thicknessMm', 'Thickness?', '25% of washer records state THK.', 'numeric', true, 'mm'),
  S('washerStyle', 'Style?', 'Flat, split lock, external tooth, internal tooth, square cone, nylon patch…', 'enum', true),
  S('material', 'Material?', 'Stainless, plain steel, nylon, bronze…', 'enum', true),
  S('finish', 'Finish?', 'Zinc plated, black oxide, passivated, plain…', 'enum', true),
];

const STANDOFF_STEPS: StepDefinition[] = [
  S('threadSize', 'Thread size?', 'Metric like M3 or imperial.', 'enum', true),
  S('threadPitchMm', 'Thread pitch?', 'Only matched when stated.', 'numeric', true, 'mm'),
  S('lengthMm', 'Length?', 'In mm.', 'numeric', true, 'mm'),
  S('material', 'Material?', '', 'enum', true),
  S('finish', 'Finish?', '', 'enum', true),
];

export const STEPS_BY_FAMILY: Record<Family, StepDefinition[]> = {
  screw: SCREW_STEPS,
  bolt: SCREW_STEPS,
  nut: NUT_STEPS,
  'cage nut': NUT_STEPS,
  washer: WASHER_STEPS,
  standoff: STANDOFF_STEPS,
};

export const SCOPE_STEP: StepDefinition = {
  key: SCOPE_STEP_KEY,
  prompt: 'Which parts should we search?',
  help: 'Pick which lifecycle phases are in play and whether kits (bundled parts) are included. Defaults match the common "building something new" case.',
  kind: 'enum',
  disqualifying: false,
};

export const REVIEW_STEP: StepDefinition = {
  key: REVIEW_STEP_KEY,
  prompt: 'Review your query',
  help: 'Everything you have told us so far. Jump back to any step to change it, or run the search.',
  kind: 'enum',
  disqualifying: false,
};

export function stepsFor(family: Family | null): StepDefinition[] {
  if (!family) return [FAMILY_STEP];
  return [FAMILY_STEP, ...STEPS_BY_FAMILY[family], SCOPE_STEP, REVIEW_STEP];
}
