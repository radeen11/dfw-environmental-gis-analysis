# DFW Industrial Facilities — Interactive EPA ECHO Map

An independent, open-source GIS portfolio project customizing the [DataMade Searchable Map Template](https://github.com/datamade/searchable-map-template-csv) to visualize a **capped sample of 75 facilities** in the Dallas–Fort Worth region flagged in EPA ECHO as associated with the Toxics Release Inventory (TRI).

**Project stage:** Map code implemented and committed; GitHub Pages deployment and browser testing still pending.

## Features

- Leaflet map with OpenStreetMap tiles (no Google Maps API key or Google billing)
- Clickable, color-coded facility markers with EPA-reported status and source links
- Text search for facility name, address, and Registry ID
- City, Clean Air Act, NPDES, RCRA and compliance-status filters
- Keyboard-operable facility results table and responsive layout
- Transparent dataset provenance and interpretation cautions

## View locally

Run a local HTTP server in this folder; for example:

```bash
python3 -m http.server 8000
```

Then visit `http://localhost:8000/`. Opening the HTML directly from `file://` may block CSV loading.

## Publish with GitHub Pages

1. Open **Settings → Pages** for this repository.
2. Set **Build and deployment → Source** to **Deploy from a branch**.
3. Choose **master** and **/(root)**, then Save.
4. After deployment, open `https://radeen11.github.io/dfw-environmental-gis-analysis/`.
5. Verify that markers, filters, table, and EPA links work.

## Data

- `data/dfw-epa-tri-facilities-sample.csv` — 75 EPA ECHO records
- [DATA_SOURCE.md](DATA_SOURCE.md) — extraction settings, limitations, and reproducibility
- [PROJECT_PLAN.md](PROJECT_PLAN.md) — research question and outstanding work

The sample is not a complete DFW inventory. EPA TRI association and reported compliance statuses are **not** evidence of actual exposure, site-specific risk, or up-to-date regulatory findings; point coordinates may also be approximate. Consult EPA reports before drawing conclusions.

## Credits and license

Derived from [DataMade's Searchable Map Template – CSV](https://github.com/datamade/searchable-map-template-csv), itself based on work by Derek Eder. The original project is MIT licensed; its [LICENSE](LICENSE) is preserved. This map adds new dataset integration, UI, filters, documentation, and responsive presentation, retaining attribution to the source authors.

Map tiles © OpenStreetMap contributors. Facility records provided by the U.S. Environmental Protection Agency.
