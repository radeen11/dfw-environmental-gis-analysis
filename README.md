# DFW Industrial Facilities — Interactive EPA ECHO Map

An independent, open-source GIS portfolio project customizing the [DataMade Searchable Map Template](https://github.com/datamade/searchable-map-template-csv) to visualize a **capped sample of 75 facilities** in the Dallas–Fort Worth region flagged in EPA ECHO as associated with the Toxics Release Inventory (TRI).

**Project stage:** Live on GitHub Pages. Initial map display, search, filters, and marker popups were confirmed by the project owner on November 26, 2026. Additional dashboard/grid features have been committed but still require a fresh browser test.

## Features

- Leaflet map with OpenStreetMap tiles (no Google Maps API key or Google billing)
- Clickable, color-coded facility markers with EPA-reported status and source links
- Text search for facility name, address, and Registry ID
- City, Clean Air Act, NPDES, RCRA and compliance-status filters
- Keyboard-operable facility results table and responsive layout
- Filter-responsive city and EPA-program summary charts, with source limitations
- Optional approximate 10 km grid overlay of selected facility counts (not pollution density)
- Coordinate accuracy quality-control indicator
- Transparent dataset provenance and interpretation cautions

**[Open the live map](https://radeen11.github.io/dfw-environmental-gis-analysis/)**

## Observations from the 75-record sample

The current dataset contains 60 records marked "No Violation Identified," seven records with a reported violation status (including three significant), and eight with no reported status. Of the 75 records, 32 have the air flag, 59 have the NPDES/water flag and 61 have the RCRA/waste flag (these groups overlap). Five records list coordinate accuracy worse than 100 meters.

These are **descriptive counts for a registry-ID-sorted, capped sample** only; they cannot establish DFW-wide prevalence or exposure. [Read the full methodology and analysis.](ANALYSIS.md)

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
- [ANALYSIS.md](ANALYSIS.md) — results, spatial grid method, quality checks and interpretation

The sample is not a complete DFW inventory. EPA TRI association and reported compliance statuses are **not** evidence of actual exposure, site-specific risk, or up-to-date regulatory findings; point coordinates may also be approximate. Consult EPA reports before drawing conclusions.

## Credits and license

Derived from [DataMade's Searchable Map Template – CSV](https://github.com/datamade/searchable-map-template-csv), itself based on work by Derek Eder. The original project is MIT licensed; its [LICENSE](LICENSE) is preserved. This map adds new dataset integration, UI, filters, documentation, and responsive presentation, retaining attribution to the source authors.

Map tiles © OpenStreetMap contributors. Facility records provided by the U.S. Environmental Protection Agency.
