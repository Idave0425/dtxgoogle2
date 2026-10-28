// Duplicate detection. REQUIREMENTS §7, plus Week 3 feedback.
// Three evidence types: shared-mpn, identical-description, and pack-variant
// (same part sold single vs bulk; kept as separate GPNs, volumes combined).
// Builder-time only. Conflicts (stated differing values) are marked.

import type {
  AttributeKey,
  DuplicateCluster,
  PartRecord,
} from '../../src/types';

const COMPARED_KEYS: AttributeKey[] = [
  'threadSize',
  'threadPitchMm',
  'lengthMm',
  'headType',
  'driveType',
  'material',
  'finish',
  'integralWasher',
  'innerDiameterMm',
  'outerDiameterMm',
  'thicknessMm',
  'washerStyle',
  'fitsScrewSize',
];

function normMpn(s: string): string {
  return s.toUpperCase().trim();
}

export function findSharedMpnClusters(
  parts: PartRecord[],
  allParts: PartRecord[]
): DuplicateCluster[] {
  const byMpn = new Map<string, Map<string, PartRecord>>();
  // group by (upper, trimmed) MPN across ALL parts
  for (const p of allParts) {
    for (const m of p.manufacturers) {
      if (!m.partNumber) continue;
      const key = normMpn(m.partNumber);
      if (!key) continue;
      if (!byMpn.has(key)) byMpn.set(key, new Map());
      byMpn.get(key)!.set(p.gpnKey, p);
    }
  }
  const inScopeKeys = new Set(parts.map((p) => p.gpnKey));
  const clusters: DuplicateCluster[] = [];
  for (const [mpn, members] of byMpn) {
    if (members.size < 2) continue;
    const list = Array.from(members.values());
    if (!list.some((p) => inScopeKeys.has(p.gpnKey))) continue;
    clusters.push({
      id: `mpn:${mpn}`,
      evidence: 'shared-mpn',
      evidenceValue: mpn,
      gpns: list.map((p) => p.gpn).sort(),
      conflictingKeys: [],
    });
  }
  return clusters;
}

function normDesc(d: string): string {
  return d.toLowerCase().replace(/[^a-z0-9]/g, '');
}

export function findIdenticalDescriptionClusters(
  parts: PartRecord[]
): DuplicateCluster[] {
  const byDesc = new Map<string, PartRecord[]>();
  for (const p of parts) {
    const k = normDesc(p.description);
    if (!k) continue;
    if (!byDesc.has(k)) byDesc.set(k, []);
    byDesc.get(k)!.push(p);
  }
  const clusters: DuplicateCluster[] = [];
  for (const [k, members] of byDesc) {
    const unique = new Map(members.map((p) => [p.gpnKey, p]));
    if (unique.size < 2) continue;
    clusters.push({
      id: `desc:${hash12(k)}`,
      evidence: 'identical-description',
      evidenceValue: k,
      gpns: Array.from(unique.values()).map((p) => p.gpn).sort(),
      conflictingKeys: [],
    });
  }
  return clusters;
}

/** Strips pack-size wording so "8mm Long (100 Pack)" and "8mm Long" compare equal. */
export function stripPackWording(d: string): string {
  return d
    .replace(/\(?\b\d+\s*(?:pieces|pcs|pack|pk|count|ct)\b\)?/gi, ' ')
    .replace(/\b(?:bulk|single|bag of|box of|qty)\b/gi, ' ');
}

export function findPackVariantClusters(parts: PartRecord[]): DuplicateCluster[] {
  const byBase = new Map<string, PartRecord[]>();
  for (const p of parts) {
    const k = normDesc(stripPackWording(p.description));
    if (!k) continue;
    if (!byBase.has(k)) byBase.set(k, []);
    byBase.get(k)!.push(p);
  }
  const clusters: DuplicateCluster[] = [];
  for (const [k, members] of byBase) {
    const unique = Array.from(new Map(members.map((p) => [p.gpnKey, p])).values());
    if (unique.length < 2) continue;
    // Only a pack variant when the members actually differ in pack size.
    const qtys = new Set(unique.map((p) => p.packaging.quantity ?? 1));
    if (qtys.size < 2) continue;
    clusters.push({
      id: `pack:${hash12(k)}`,
      evidence: 'pack-variant',
      evidenceValue: unique
        .map((p) => `${p.gpn} × ${p.packaging.quantity ?? 1}`)
        .sort()
        .join(', '),
      gpns: unique.map((p) => p.gpn).sort(),
      conflictingKeys: [],
    });
  }
  return clusters;
}

export function markConflicts(
  cluster: DuplicateCluster,
  parts: PartRecord[]
): DuplicateCluster {
  const members = parts.filter((p) => cluster.gpns.includes(p.gpn));
  if (members.length < 2) return cluster;
  const conflicts = new Set<AttributeKey>();
  for (const key of COMPARED_KEYS) {
    const stated = members
      .map((p) => (p.attributes as any)[key])
      .filter((v) => v !== null && v !== undefined);
    const uniq = new Set(stated.map((v) => (typeof v === 'number' ? v : String(v))));
    if (uniq.size > 1) conflicts.add(key);
  }
  return { ...cluster, conflictingKeys: Array.from(conflicts).sort() };
}

export function buildClusters(
  parts: PartRecord[],
  allParts: PartRecord[]
): DuplicateCluster[] {
  const partsByGpn = new Map(parts.map((p) => [p.gpn, p]));
  const inScopePartForCluster = (c: DuplicateCluster) =>
    c.gpns.map((g) => partsByGpn.get(g)).filter((p): p is PartRecord => !!p);

  const mpnClusters = findSharedMpnClusters(parts, allParts).map((c) =>
    markConflicts(c, inScopePartForCluster(c))
  );
  const descClusters = findIdenticalDescriptionClusters(parts).map((c) =>
    markConflicts(c, inScopePartForCluster(c))
  );
  const packClusters = findPackVariantClusters(parts).map((c) =>
    markConflicts(c, inScopePartForCluster(c))
  );
  const all = [...mpnClusters, ...descClusters, ...packClusters];
  all.sort((a, b) => a.id.localeCompare(b.id));
  return all;
}

function hash12(s: string): string {
  // small, deterministic FNV-1a trimmed to 12 hex chars
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = (h + ((h << 1) + (h << 4) + (h << 7) + (h << 8) + (h << 24))) >>> 0;
  }
  const first = h.toString(16).padStart(8, '0');
  // mix a second pass for 12 chars
  let h2 = 0x1000193;
  for (let i = s.length - 1; i >= 0; i--) {
    h2 ^= s.charCodeAt(i);
    h2 = Math.imul(h2, 16777619) >>> 0;
  }
  return (first + h2.toString(16).padStart(8, '0')).slice(0, 12);
}
