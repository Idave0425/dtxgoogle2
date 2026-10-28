# Week 3 changes: Google feedback

Source: *[Week 3] 3.2: Incorporate Google Feedback*. This document records how
the prototype changed against `REQUIREMENTS.md` / `ARCHITECTURE.md`. Where they
disagree, this file describes what the code now does.

## 1. Volume (feedback items 3 and 5)

**What Google asked for:** use order volume as a ranking factor, and point
engineers at "preferred" high-runner parts so usage consolidates.

**Data.** A new fixture, `src/fixtures/volumes.json` (`VolumeFixture` in
`src/types.ts`):

| `source` | Meaning | UI |
| --- | --- | --- |
| `vendor` | Real order history from Google's vendors | numbers shown as-is |
| `sample` | Illustrative numbers in the demo fixture | purple "Sample volumes" note on Results; "sample volume" on the preferred card |
| `none` | No data yet | every part reads **volume pending**; no preferred part |

- **Current approach (team decision):** volume is artificial proof-of-concept
  data attached to the dummy dataset, and every volume feature is built on it.
  `npm run build:fixture` (demo) writes `sample` volumes for 35 of 38 GPNs.
  Three are left out on purpose so the "pending" state is visible (Google said
  ~85% coverage is acceptable).
- Fallback, not the focus yet: `npm run build:fixture:real` reads an optional `data/volumes.csv`
  (`GPN,Annual Qty,Orders[,As Of]`). With no file it writes `source: 'none'`.
  Missing GPNs stay pending. Gaps are **never** filled with estimates.

**Ranking (amends FR-12).** Verdict → lifecycle phase → **volume (desc)** →
manufacturer count → stated-attribute count → GPN. Pending volume sorts after
any known volume, never as zero. With `source: 'none'` the order is exactly
the Week 2 order.

**Tiers.** `high-runner` = top 20% of GPNs with volume data; `low` = under 5%
of the top part's volume; otherwise `regular`; `pending` when unknown.
Tiers are computed against the whole fixture, so a tier means the same thing
whatever the query.

**Preferred part.** The highest-volume result that is a `match` or `near`.
`review` results are never preferred: an unknown spec can't be recommended.
Shown as a callout above the table and a ★ tag on the row. This is a
suggestion. Google makes consolidation calls (R3 still holds).

## 2. Near-matches (feedback item 4)

New verdicts: `AttributeVerdict` gains `'near'`, `ResultVerdict` gains
`'near'` ("Close match"). Ranked between `match` and `review`.

Tolerance per attribute (`NEAR_TOLERANCE` in `engine/steps.ts`): a stated
value within `max(abs, rel × asked)` is near.

| Attribute | abs | rel |
| --- | --- | --- |
| length | 0.15 mm | 3% |
| inner diameter | 0.10 mm | 3% |
| outer diameter | 0.15 mm | 3% |
| thickness | 0.05 mm | 5% |

**Thread pitch has no tolerance on purpose.** A pitch that is close still
doesn't fit.

Numeric steps now accept a typed value ("Use 5.4 mm"), so engineers can search
for a size that doesn't exist yet and see what is close.

## 3. Duplicate labels by type (feedback item 5)

New cluster evidence `pack-variant`: same description once pack wording
(`(100 Pack)`, `100 PCS`, `bulk` …) is stripped, different pack quantity.
Kept as separate GPNs; the notice shows each member's volume and the
**combined volume**.

Cluster notices are labelled by Google's three rulings:

| Label | When |
| --- | --- |
| Likely duplicate | identical description (members in different lifecycle phases = consolidation candidate) |
| Pack variant | `pack-variant` evidence |
| Same MPN | shared manufacturer part number, no conflicts |
| Conflict | any cluster whose members state differing specs |

Near-match "duplicates" (5.4 vs 5.5 mm) surface through the `near` verdict,
not as clusters.

## 4. UI refresh

- Header with segmented tabs; the prototype marker (NFR-8) is a pill there.
- Wizard: vertical stepper rail; search box focused on every step, so the
  whole flow is type → Enter; option counts drawn as bars; a three-part pool
  meter (states your value / close / doesn't say) replaces the two numbers
  (FR-7 still satisfied). "Go to review" appears once every step is
  answered, so editing one answer from Results doesn't force a re-walk.
- Scope: phases grouped as Active / Early / Retired, with toggle switches.
- Results: summary stats, preferred-part callout, volume column with bars,
  tags per row (Preferred, High runner, duplicate type), cleaner expandable
  detail with a Volume panel.
- Compare: Lifecycle and Volume rows; dots mark rows where the parts differ.
- Dead end: nearest misses show volume.
- Removed the unused `ResultCard.tsx`.

## 5. Not done in this pass (still open from the feedback doc)

- Extraction fixes (plain "PAN", "ST" = steel, "square cone" ≠ square drive,
  "M3x5" lengths, phantom 4.22 mm pitch). `07022596` still reads head =
  unknown because "Pan Philips Head" isn't parsed.
- MPN prefix matching (1106617 / 1094168 share only a prefix).
- Vague-description breakdown, description standard, screw-catalog
  cross-reference, kits, Gemini agent.

## 6. Note for Google security review

The app is a static single-page bundle. It reads three committed JSON files at
build time plus `volumes.json`, makes no network requests at runtime, has no
backend, no auth and no storage, and nothing typed into it leaves the browser
tab. "Flag to data owner" and "Request a new GPN" are in-memory mocks.
