// Build a CLEAN hand-crafted dummy fixture. Writes the same three JSON files
// as build-fixture.ts, but from a small set of readable records so the UI
// looks the way it should during a demo.
//
// Run with:  npm run build:fixture

import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import type {
  LifecyclePhase,
  ManufacturerRef,
  PartRecord,
  VolumeFixture,
} from '../src/types';
import { extractAttributes } from './lib/extract';
import { buildVocabulary } from './lib/vocab';
import { buildClusters } from './lib/clusters';

const __filename = fileURLToPath(import.meta.url);
const ROOT = resolve(dirname(__filename), '..');

interface Seed {
  gpn: string;
  description: string;
  partType: string;
  phase: LifecyclePhase;
  manufacturers?: ManufacturerRef[];
}

// -------- the dummy records -----------------------------------------------
// Every description is deliberately verbose so the extractor pulls out every
// attribute cleanly. Phrases like "M3x0.5mm Thread", "8mm Long", "Pan Head",
// "Phillips", "Zinc Plated Steel" are what the normaliser is designed for.

const SEEDS: Seed[] = [
  // ========================================================================
  //  M3 pan phillips steel zinc plated 8mm — the hero demo cluster
  // ========================================================================
  {
    gpn: '07052664',
    description:
      'Screw, M3x0.5mm Thread, Pan Head, Phillips, Zinc-Plated Steel, 8mm Long',
    partType: 'Fastener-Bolts & Screws',
    phase: 'Production',
    manufacturers: [
      { name: 'McMaster-Carr', partNumber: '91290A113' },
      { name: 'Fastenal', partNumber: 'M30500800PP' },
    ],
  },

  // Pack variant of 07052664: identical part, sold in 100-packs. Google
  // ruling 3: keep both GPNs, but combine and highlight their volume.
  {
    gpn: '07052665',
    description:
      'Screw, M3x0.5mm Thread, Pan Head, Phillips, Zinc-Plated Steel, 8mm Long (100 Pack)',
    partType: 'Fastener-Bolts & Screws',
    phase: 'Production',
    manufacturers: [{ name: 'McMaster-Carr', partNumber: '91290A113-100' }],
  },

  // Same part, worse description. Pitch, material and finish all unstated →
  // "needs review" in the happy path demo, picks up extra `review`s on skip.
  {
    gpn: '07022596',
    description:
      'Screw, M3x8mm, Pan Philips Head, With External-Tooth Lock Washer',
    partType: 'Fastener-Bolts & Screws',
    phase: 'Production',
    manufacturers: [{ name: 'Bossard', partNumber: 'BN82428' }],
  },

  // Identical-description duplicate cluster — 1106617 / 1249277 / 1094168.
  // All three carry the exact same text, so the fixture clusters them by
  // identical-description evidence.
  {
    gpn: '1106617',
    description:
      'Screw, M3x0.5mm Thread, 8mm Long, Pan Head, Phillips, Steel, Zinc Plated',
    partType: 'Fastener-Bolts & Screws',
    phase: 'Production',
    manufacturers: [{ name: 'Keystone', partNumber: 'KS-M3-8-PP' }],
  },
  {
    gpn: '1249277',
    description:
      'Screw, M3x0.5mm Thread, 8mm Long, Pan Head, Phillips, Steel, Zinc Plated',
    partType: 'Fastener-Bolts & Screws',
    phase: 'Prototype',
    manufacturers: [{ name: 'Würth', partNumber: 'WU-304-M3-8' }],
  },
  {
    gpn: '1094168',
    description:
      'Screw, M3x0.5mm Thread, 8mm Long, Pan Head, Phillips, Steel, Zinc Plated',
    partType: 'Fastener-Bolts & Screws',
    phase: 'Preliminary',
    manufacturers: [{ name: 'Fastenal', partNumber: 'FA-M30508PP' }],
  },

  // Shared-MPN cluster around 0100-1-002-01 — four GPNs, four different
  // vendors, descriptions that look unrelated.
  {
    gpn: '07016397',
    description:
      'Screw, M3x0.5mm Thread, 8mm Long, Pan Head, Phillips, Steel, Zinc Plated',
    partType: 'Fastener-Bolts & Screws',
    phase: 'Production',
    manufacturers: [{ name: 'Supermicro', partNumber: '0100-1-002-01' }],
  },
  {
    gpn: '07035144',
    description:
      'HDW, SCREW PANHEAD PHILLIPS M3 x 8MM, STEEL, ZINC',
    partType: 'Fastener-Bolts & Screws',
    phase: 'Production',
    manufacturers: [{ name: 'Dell', partNumber: '0100-1-002-01' }],
  },
  {
    gpn: '07090971',
    description:
      'Screw, PHP, M3 x 0.5 x 8 mm, Steel, Zinc, Rack Mount Hardware',
    partType: 'Fastener-Bolts & Screws',
    phase: 'Preliminary',
    manufacturers: [{ name: 'HPE', partNumber: '0100-1-002-01' }],
  },
  {
    gpn: '1017592-01',
    description:
      'Mounting Screw, M3 Pan Head Philips, 8mm, Zinc Steel, RoHS',
    partType: 'Fastener-Bolts & Screws',
    phase: 'Production',
    manufacturers: [{ name: 'Lenovo', partNumber: '0100-1-002-01' }],
  },

  // Conflict cluster — shared MPN 90317A111, members disagree on material.
  {
    gpn: '07070024',
    description:
      'Screw, M3x0.5mm Thread, 8mm Long, Pan Head, Phillips, Steel, Zinc',
    partType: 'Fastener-Bolts & Screws',
    phase: 'Production',
    manufacturers: [{ name: 'McMaster-Carr', partNumber: '90317A111' }],
  },
  {
    gpn: '07082586',
    description:
      'Screw, M3x0.5mm Thread, 8mm Long, Pan Head, Phillips, Stainless Steel, Zinc Plated, 316',
    partType: 'Fastener-Bolts & Screws',
    phase: 'Production',
    manufacturers: [{ name: 'McMaster-Carr', partNumber: '90317A111' }],
  },

  // ========================================================================
  //  Other M3 variants — give the dropdowns real counts & variety
  // ========================================================================
  {
    gpn: '12345001',
    description:
      'Screw, M3x0.5mm Thread, 6mm Long, Flat Head, Phillips, Stainless Steel, Passivated',
    partType: 'Fastener-Bolts & Screws',
    phase: 'Production',
    manufacturers: [{ name: 'Bossard', partNumber: 'BN82600' }],
  },
  {
    gpn: '12345002',
    description:
      'Screw, M3x0.5mm Thread, 12mm Long, Button Head, Torx T10, Alloy Steel, Black Oxide',
    partType: 'Fastener-Bolts & Screws',
    phase: 'Production',
    manufacturers: [{ name: 'McMaster-Carr', partNumber: '92949A116' }],
  },
  {
    gpn: '12345003',
    description:
      'Screw, M3x0.5mm Thread, 10mm Long, Socket Head, Hex, Stainless Steel 18-8, Plain',
    partType: 'Fastener-Bolts & Screws',
    phase: 'Production',
    manufacturers: [{ name: 'McMaster-Carr', partNumber: '92196A113' }],
  },
  {
    gpn: '12345004',
    description:
      'Screw, M3x0.5mm Thread, 20mm Long, Pan Head, Phillips, Steel, Zinc Plated, Split Lock Washer',
    partType: 'Fastener-Bolts & Screws',
    phase: 'Prototype',
    manufacturers: [{ name: 'Keystone', partNumber: 'KS-M3-20-PPZ' }],
  },
  {
    gpn: '12345005',
    description:
      'Screw, Captive, Pan Head Phillips, M3x0.5mm Thread, 6mm Long, Steel, Zinc Plated, W/Washer',
    partType: 'Fastener-Bolts & Screws',
    phase: 'Production',
    manufacturers: [{ name: 'PEM', partNumber: 'PFS2-M3-6-ZI' }],
  },

  // Near-match pair (Week 3 feedback): 5.4 mm vs 5.5 mm. Search 5.4 and the
  // 5.5 mm part shows as a close match, with far higher volume.
  {
    gpn: '12345006',
    description:
      'Screw, M3x0.5mm Thread, 5.5mm Long, Pan Head, Phillips, Steel, Zinc Plated',
    partType: 'Fastener-Bolts & Screws',
    phase: 'Production',
    manufacturers: [{ name: 'Bossard', partNumber: 'BN380-M3-5.5' }],
  },
  {
    gpn: '12345007',
    description:
      'Screw, M3x0.5mm Thread, 5.4mm Long, Pan Head, Phillips, Steel, Zinc Plated',
    partType: 'Fastener-Bolts & Screws',
    phase: 'Preliminary',
    manufacturers: [{ name: 'Keystone', partNumber: 'KS-M3-5.4-PPZ' }],
  },

  // ========================================================================
  //  Different threads: M4, M5, imperial
  // ========================================================================
  {
    gpn: '12345010',
    description:
      'Screw, M4x0.7mm Thread, 10mm Long, Socket Head, Hex, Alloy Steel, Black Oxide',
    partType: 'Fastener-Bolts & Screws',
    phase: 'Production',
    manufacturers: [{ name: 'McMaster-Carr', partNumber: '91290A194' }],
  },
  {
    gpn: '12345011',
    description:
      'Screw, M5x0.8mm Thread, 16mm Long, Pan Head, Phillips, Steel, Zinc Plated',
    partType: 'Fastener-Bolts & Screws',
    phase: 'Production',
    manufacturers: [{ name: 'Bossard', partNumber: 'BN82600-M5-16' }],
  },
  {
    gpn: '12345012',
    description:
      'Screw, M5x0.8mm Thread, 25mm Long, Hex Head, Hex, Steel, Zinc Plated',
    partType: 'Fastener-Bolts & Screws',
    phase: 'Preliminary',
    manufacturers: [{ name: 'Fastenal', partNumber: 'FA-M50825HH' }],
  },
  {
    gpn: '07001144',
    description:
      'Screw, 10-32 Thread, 1/2in Long, Pan Head, Phillips, Steel, Black Oxide',
    partType: 'Fastener-Bolts & Screws',
    phase: 'End of Production',
    manufacturers: [{ name: 'Keystone', partNumber: 'KS-10-32-050-BLK' }],
  },
  {
    gpn: '07004435',
    description:
      'Screw, 8-32 Thread, 3/8in Long, Pan Head, Phillips, Steel, Zinc Plated',
    partType: 'Fastener-Bolts & Screws',
    phase: 'Production',
    manufacturers: [{ name: 'Fastenal', partNumber: 'FA-832038PP' }],
  },

  // ========================================================================
  //  Bolts
  // ========================================================================
  {
    gpn: '13000001',
    description:
      'Bolt, Hex Head, M8x1.25mm Thread, 25mm Long, Steel, Zinc Plated, Grade 8.8',
    partType: 'Fastener-Bolts & Screws',
    phase: 'Production',
    manufacturers: [{ name: 'Würth', partNumber: 'WU-M8-25-G88' }],
  },
  {
    gpn: '13000002',
    description:
      'Bolt, Hex Head, M10x1.5mm Thread, 40mm Long, Stainless Steel, Plain',
    partType: 'Fastener-Bolts & Screws',
    phase: 'Production',
    manufacturers: [{ name: 'McMaster-Carr', partNumber: '92240A630' }],
  },

  // ========================================================================
  //  Nuts and cage nuts
  // ========================================================================
  {
    gpn: '14000001',
    description: 'Nut, Hex, M3x0.5mm Thread, Steel, Zinc Plated',
    partType: 'Fastener-Nut',
    phase: 'Production',
    manufacturers: [{ name: 'Fastenal', partNumber: 'FA-HN-M3-ZI' }],
  },
  {
    gpn: '14000002',
    description:
      'Nut, Hex, M5x0.8mm Thread, Stainless Steel 316, Passivated',
    partType: 'Fastener-Nut',
    phase: 'Production',
    manufacturers: [{ name: 'McMaster-Carr', partNumber: '91828A251' }],
  },
  {
    gpn: '07015054',
    description: 'Cage Nut, M6x1.0mm Thread, Steel, Zinc Plated (100 pieces)',
    partType: 'Fastener-Nut',
    phase: 'Production',
    manufacturers: [{ name: 'Hoffman', partNumber: 'HM-CN-M6-100' }],
  },
  {
    gpn: '14000003',
    description: 'Cage Nut, M5x0.8mm Thread, Steel, Zinc Plated',
    partType: 'Fastener-Nut',
    phase: 'Production',
    manufacturers: [{ name: 'Hoffman', partNumber: 'HM-CN-M5' }],
  },

  // ========================================================================
  //  Washers — give the washer wizard real variety
  // ========================================================================
  {
    gpn: '15000001',
    description:
      'Washer, M3, 3.2mm ID, 7mm OD, 0.5mm THK, Flat, Stainless Steel, Passivated',
    partType: 'Fastener-Washers',
    phase: 'Production',
    manufacturers: [{ name: 'McMaster-Carr', partNumber: '91116A110' }],
  },
  {
    gpn: '15000002',
    description:
      'Washer, M3, Split Lock, Steel, Zinc Plated',
    partType: 'Fastener-Washers',
    phase: 'Production',
    manufacturers: [{ name: 'Fastenal', partNumber: 'FA-SLW-M3-ZI' }],
  },
  {
    gpn: '15000003',
    description:
      'Washer, M4, 4.3mm ID, 9mm OD, 0.8mm THK, External Tooth, Stainless Steel',
    partType: 'Fastener-Washers',
    phase: 'Production',
    manufacturers: [{ name: 'Bossard', partNumber: 'BN14-M4' }],
  },
  {
    gpn: '15000004',
    description:
      'Washer, M5, 5.5mm ID, 10mm OD, 1mm THK, Flat, Steel, Zinc Plated',
    partType: 'Fastener-Washers',
    phase: 'Production',
    manufacturers: [{ name: 'Keystone', partNumber: 'KS-FW-M5-ZI' }],
  },
  {
    gpn: '04100607',
    description:
      'Washer, External Tooth, #10, Steel, Zinc Plated',
    partType: 'Fastener-Washers',
    phase: 'Production',
    manufacturers: [{ name: 'McMaster-Carr', partNumber: '91114A011' }],
  },
  {
    gpn: '15000005',
    description:
      'Washer, Flat, 1/4in Screw Size, 0.281in ID, 0.625in OD, Steel, Zinc Plated',
    partType: 'Fastener-Washers',
    phase: 'End of Production',
    manufacturers: [{ name: 'Fastenal', partNumber: 'FA-FW-14-ZI' }],
  },
  // Identical-description washer duplicate (two GPNs)
  {
    gpn: '15000010',
    description:
      'Washer, M3, 3.2mm ID, 7mm OD, 0.5mm THK, Flat, Stainless Steel, Passivated',
    partType: 'Fastener-Washers',
    phase: 'Prototype',
    manufacturers: [{ name: 'Bossard', partNumber: 'BN730-M3' }],
  },

  // ========================================================================
  //  Standoff
  // ========================================================================
  {
    gpn: '16000001',
    description:
      'Standoff, M3x0.5mm Thread, 10mm Long, Brass, Nickel Plated',
    partType: 'Fastener-Standoff',
    phase: 'Production',
    manufacturers: [{ name: 'Keystone', partNumber: 'KS-SO-M3-10-NI' }],
  },
];

// -------- sample volumes ---------------------------------------------------
// ILLUSTRATIVE ONLY. Google has not shared vendor volumes yet. These numbers
// exist so the volume ranking and "preferred" logic can be demoed, and the UI
// labels them "sample" everywhere they appear. A few GPNs are deliberately
// left out to show the "volume pending" state (Google said ~85% coverage is
// acceptable). Pieces per year, purchase orders per year.
const SAMPLE_VOLUMES: Record<string, [number, number]> = {
  '07052664': [48000, 36],
  '07052665': [22000, 14],
  '07022596': [3100, 6],
  '1106617': [9600, 12],
  '1249277': [400, 2],
  '1094168': [1200, 3],
  '07016397': [15000, 18],
  '07035144': [6200, 9],
  '1017592-01': [2400, 4],
  '07070024': [5200, 8],
  '07082586': [1800, 3],
  '12345001': [7400, 10],
  '12345002': [3300, 5],
  '12345003': [21000, 22],
  '12345004': [250, 1],
  '12345005': [4100, 6],
  '12345006': [26000, 24],
  '12345007': [600, 2],
  '12345010': [11000, 14],
  '12345011': [8800, 11],
  '12345012': [1500, 3],
  '07001144': [300, 1],
  '07004435': [5200, 7],
  '13000001': [6400, 8],
  '14000001': [30000, 26],
  '14000002': [2600, 4],
  '07015054': [12000, 10],
  '14000003': [7000, 9],
  '15000001': [18000, 20],
  '15000002': [25000, 21],
  '15000003': [3400, 5],
  '15000004': [14000, 15],
  '04100607': [9000, 10],
  '15000010': [300, 1],
  '16000001': [2200, 4],
};

// ---- turn seeds into PartRecords -----------------------------------------
const allParts: PartRecord[] = SEEDS.map((seed, i) => {
  const { attributes, raw } = extractAttributes(seed.partType, seed.description);
  const isKit = /\bkit\b/i.test(seed.description);
  const qty = seed.description.match(/\((\d+)\s*(?:pieces|pcs|pack|count)\b/i);
  return {
    gpn: seed.gpn,
    gpnKey: seed.gpn.replace(/^0+/, '') || seed.gpn,
    description: seed.description,
    partType: seed.partType,
    phase: seed.phase,
    sources: [{ sheet: 'Set 02', row: i + 2 }],
    manufacturers: seed.manufacturers ?? [],
    attributes,
    raw,
    packaging: { quantity: qty ? Number(qty[1]) : null, isKit },
  };
});

const parts = allParts
  .slice()
  .sort((a, b) => a.gpn.localeCompare(b.gpn));

const vocab = buildVocabulary(parts);
const clusters = buildClusters(parts, allParts);

// ---- write ---------------------------------------------------------------
const outDir = resolve(ROOT, 'src/fixtures');
mkdirSync(outDir, { recursive: true });
writeFileSync(resolve(outDir, 'parts.json'), JSON.stringify(parts, null, 2));
writeFileSync(resolve(outDir, 'vocab.json'), JSON.stringify(vocab, null, 2));
writeFileSync(
  resolve(outDir, 'clusters.json'),
  JSON.stringify(clusters, null, 2)
);
const volumes: VolumeFixture = {
  source: 'sample',
  asOf: null,
  byGpn: Object.fromEntries(
    Object.entries(SAMPLE_VOLUMES)
      .filter(([gpn]) => parts.some((p) => p.gpn === gpn))
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([gpn, [annualQty, orders]]) => [gpn, { annualQty, orders }])
  ),
};
writeFileSync(resolve(outDir, 'volumes.json'), JSON.stringify(volumes, null, 2));

// ---- summary -------------------------------------------------------------
const byFamily = new Map<string, number>();
for (const p of parts) {
  byFamily.set(p.attributes.family, (byFamily.get(p.attributes.family) ?? 0) + 1);
}

console.log('');
console.log(`DUMMY fixture built`);
console.log(`records       : ${parts.length}`);
for (const [f, n] of [...byFamily.entries()].sort((a, b) => b[1] - a[1])) {
  console.log(`  ${f.padEnd(14)}${n}`);
}
console.log(`vocab keys    : ${Object.keys(vocab).length}`);
console.log(`clusters      : ${clusters.length}`);
console.log(`  shared-mpn            : ${clusters.filter((c) => c.evidence === 'shared-mpn').length}`);
console.log(`  identical-description : ${clusters.filter((c) => c.evidence === 'identical-description').length}`);
console.log(`  pack-variant          : ${clusters.filter((c) => c.evidence === 'pack-variant').length}`);
console.log(`sample volumes: ${Object.keys(volumes.byGpn).length}/${parts.length} GPNs`);
console.log('wrote src/fixtures/{parts,vocab,clusters,volumes}.json');
console.log('');
