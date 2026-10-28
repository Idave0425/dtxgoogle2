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
| `sample` | Illustrative numbers in the demo fixture | a "proof-of-concept sample data" line under the Results title |
| `none` | No data yet | every part reads **volume pending**; no preferred part |

- **Current default: volume pending.** Per the 3.2 doc, no numbers are made
  up while Google's vendor data is outstanding. `npm run build:fixture` writes
  `source: 'none'`, and every part reads "volume pending".
- **Proof of concept on demand:** `npm run build:fixture:sample` writes
  illustrative `sample` volumes for 35 of 38 GPNs, so the ranking, preferred
  part, high runners and pack-variant totals can be demoed. Three are left out
  on purpose to show the pending state (Google said ~85% coverage is
  acceptable).
- Real data: `npm run build:fixture:real` reads an optional `data/volumes.csv`
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

## 4. UI refresh (tasteskill, achromatic ledger)

The front end follows the `design-taste-frontend` skill
(`.claude/skills/design-taste-frontend`, app-screen rules). Its draw dealt the
**achromatic-ledger** style (seed 1594108509, sheet in `.taste-skill/`),
chosen because engineers use this for quick lookups where the figures carry
the meaning.

- **Shell:** an open-plane sidebar on the page ground. It holds the product's
  hex-nut mark and name, the scope (fasteners, Oct 2026 snapshot), the nav,
  the search steps nested under Search (each one editable), and the
  prototype notice (NFR-8). No top bar.
- **Colour:** the chrome is ink only, with a near-black primary. The one data
  hue (`#1d5fbf`) marks order volume and nothing else. Verdicts are small
  glyph marks and pale pills.
- **Face:** a steel blue-grey ground (`#f2f4f7`), the hue on volume, and
  Geist / Geist Mono (Mono for GPNs and MPNs only). The fonts are bundled
  under `src/styles/fonts` (SIL OFL), so the app still makes no network calls
  at runtime; the skill's Google Fonts link was not used for that reason.
- **Search:** title "Find a fastener", one step per card, and a live
  **shortlist** beside it of the parts that already fit, ranked with their
  volume and updating with every answer.
- **Results:** the h1 is the part itself ("M3 × 0.5 × 8 mm pan phillips
  screw"). The line under it states the finding: how many GPNs fit, and
  which one is ordered most, with its share. **Copy &lt;GPN&gt;** is the one
  primary action. Signature element: a **volume-share strip** showing how
  one spec's volume is spread across GPNs, the consolidation case.
  Verdict counts are underline tabs (All fits, Match, Close, Needs review,
  Excluded), which replace the old excluded-records disclosure. Only
  answered attributes get a column.
- **Compare, dead end and flag log** share the same title row; nearest misses
  and flags are plain ruled tables.
- **Lint:** `node .claude/skills/design-taste-frontend/scripts/lint.mjs --app src`
  passes with 0 FAILs. Two warnings remain, both deliberate: monospace (GPN
  and MPN identifiers), and em dashes used as missing-value marks. The skill's
  browser inspector could not take screenshots in this environment, so the
  visual checks were done by hand at 1440, 768 and 390 px.

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
