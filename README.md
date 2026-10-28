# Part Reuse Check

DiversaTech × Google prototype. A guided search that helps Google hardware
engineers find an existing fastener GPN before creating a new one. Results are
ranked by match, then lifecycle phase, then order volume.

> Prototype: not connected to any Google system. It runs entirely in your
> browser from a static data file. No backend, no login, nothing is sent
> anywhere.

## Run it locally

You need [Node.js](https://nodejs.org) 18 or newer and git.

```bash
git clone https://github.com/Idave0425/dtxgoogle2.git
cd dtxgoogle2/part-reuse-check
npm install
npm run dev
```

Open the address it prints, normally **http://localhost:5173**. Stop it with
`Ctrl+C`.

That's all. The demo dataset is already in the repo, so nothing else needs
setting up.

## Try it

1. Pick **screw**, then **M3**, **0.5**, and type **5.4** for length.
2. Click **Skip this step** for the rest, then **Continue** and **Search parts**.
3. `12345007` (5.4 mm) is the match; `12345006` (5.5 mm) shows as a
   **close match**. Tick both and click **Compare** to see them side by side.

More demo paths are in [`part-reuse-check/README.md`](part-reuse-check/README.md#demo-script).

## Volume data

Google hasn't shared vendor order volumes yet, so every part reads
**volume pending**. To preview the volume features with clearly labelled
sample numbers (preferred part, high runners, combined pack volume):

```bash
npm run build:fixture:sample
```

Switch back with `npm run build:fixture`.

## Other commands

Run these from `part-reuse-check/`:

| Command | What it does |
| --- | --- |
| `npm test` | Runs the test suite |
| `npm run build` | Builds a static site into `dist/` (host it anywhere) |
| `npm run build:fixture:real` | Rebuilds from Google's GPN export. The export isn't in this repo; put `set01.csv` and `set02.csv` from the team Drive in `data/` first. |

## Docs

- [`part-reuse-check/README.md`](part-reuse-check/README.md): matching rules, demo script, open questions
- [`part-reuse-check/docs/CHANGES-WEEK3.md`](part-reuse-check/docs/CHANGES-WEEK3.md): what changed after Google's Week 3 feedback, plus a note for the security review
