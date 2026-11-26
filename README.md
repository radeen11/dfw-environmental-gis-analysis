# Dallas–Fort Worth EPA Facility Explorer

**[View the live interactive map](https://radeen11.github.io/dfw-environmental-gis-analysis/)**

An independent environmental GIS portfolio project that adapted the MIT-licensed [DataMade Searchable Map Template — CSV](https://github.com/datamade/searchable-map-template-csv) into a responsive Leaflet dashboard. It analyzes **300 EPA ECHO TRI-associated facility records** in a defined Dallas–Fort Worth study rectangle.

## What the two views mean

**TRI-associated facilities** is a fixed snapshot of 300 ECHO facilities with a TRI association in the rectangular study area (November 26, 2026). **Latest inspection year** queries EPA for facilities whose **most recent recorded inspection date** falls within the selected calendar year. That is not the count of inspections conducted during the year and not a census of facilities operating then. Neither view alone establishes pollution, risk, or violation history.

## What it does

- Offers a complete 300-record TRI-associated snapshot and an **all-ECHO mode that downloads every matching facility record in the study rectangle**; the map aggregates large results into a grid, and lists at most 250 table rows while computing full-data statistics.
- Maps all 300 TRI snapshot records and links every point to its EPA facility report.
- Searches facility names, addresses, registry IDs and city names, with regulatory program and compliance-status filters.
- Displays filter-responsive city/program bar charts and a summary of record and coordinate-quality counts.
- Aggregates selected points into an optional **approximate 10 km square grid** for spatial pattern exploration.
- Offers a **≤100 m source coordinate-accuracy screen** to examine geographic-quality sensitivity.
- Runs statically on GitHub Pages without backend code, Google Maps API, or a paid API key.

## Key observed results (Nov 26, 2026 snapshot)

| Indicator | Count |
| --- | ---: |
| EPA records / unique FRS IDs | 300 |
| EPA-reported city labels | 53 |
| No Violation Identified | 197 |
| Violation / Violation Identified / Significant Violation | 13 |
| Unknown or blank status | 90 |
| Air / NPDES / RCRA program flags | 69 / 206 / 150 |
| Locations reporting coordinate accuracy >100 m | 52 |
| Occupied approximate 10 km grid cells | 64 |

**Interpretation warning:** These values apply **only to TRI-flagged ECHO facilities inside the rectangle**, not all DFW industrial facilities. They do not measure pollution levels, exposure, health outcomes, or actual current violations. See [ANALYSIS.md](ANALYSIS.md).

## Reproduce the analysis

1. Use Python 3.9+ to run `python3 scripts/fetch_epa_echo.py`, which retrieves EPA query count and every results page, checks coordinate values and FRS registry IDs, and rewrites the CSV. The service changes over time; a new count may not equal 300.
2. Run a local static server, e.g. `python3 -m http.server 8000` from the repository root.
3. Visit `http://localhost:8000/` (or the GitHub Pages URL), and use the controls to explore results.
4. Read [DATA_SOURCE.md](DATA_SOURCE.md) for the exact source and extraction design and [ANALYSIS.md](ANALYSIS.md) for research questions, methods, results, uncertainty, and limitations.

## Project structure

- `index.html` — accessible, responsive map and charts interface.
- `js/map.js` — Leaflet visualization, spatial aggregation and filter-aware summary logic.
- `data/dfw-epa-tri-facilities-complete.csv` — full 300-record study-area extract.
- `data/dfw-epa-tri-facilities-sample.csv` — archived 75-record pilot snapshot (not currently mapped).
- `scripts/fetch_epa_echo.py` — reproducible EPA ArcGIS paginated extraction and cleaning.
- `ANALYSIS.md` — detailed methodology and interpretation.
- `DATA_SOURCE.md` — source identification, query parameters and caveats.
- `PROJECT_PLAN.md` — project history and remaining enhancements.

## Limitations and ethics

EPA returned 34,152 all-ECHO records in the rectangle on November 26, 2026. The live site requests every matching record with pagination and requires successful complete validation. The study rectangle is not the official DFW metro area;

## Original software attribution

Originally forked from [DataMade's Searchable Map Template — CSV](https://github.com/datamade/searchable-map-template-csv), itself influenced by Derek Eder. The source is under MIT license; its [LICENSE](LICENSE) and copyright notice are retained. The portfolio version adds independent EPA data integration, map interface, program/status filters, analysis charts, spatial grid aggregation, quality screening, data extraction script, and research documentation.

Map uses Leaflet and © OpenStreetMap contributors; facility records from the U.S. Environmental Protection Agency. This is an independent personal portfolio project, not affiliated with EPA.

**Verification:** The live 300-record deployment was browser-tested on November 26, 2026: 300/300 facility markers and charts loaded; the 10 km grid displayed 64 occupied cells; enabling the ≤100 m positional-quality filter reduced the map to 248/300 records and 61 occupied grid cells. Earlier search, status filters and popups were also tested by the project owner.


## Complete all-ECHO mode (November 26, 2026 revision)

The **All EPA ECHO** selection no longer limits the data to the first 300 records. It requests the current total, then pages through **every record** matching the geographic rectangle from the public EPA ArcGIS FeatureServer, using 1,000 records per request with up to four concurrent requests. All pages must return the expected number of records, and the combined set must have distinct FRS identifiers and valid in-rectangle coordinates. If verification fails, the site shows an error instead of presenting a truncated dataset as complete.

Once loaded, filters, city charts, regulatory-program counts, compliance counts and 10 km grid aggregation operate on **all downloaded ECHO records**. For browser performance, an overview with over 1,500 matches displays an aggregate grid instead of thousands of point icons. Narrower selections render all corresponding markers. The results table is deliberately capped at the first 250 entries while its counts and charts include every matching record. The live ECHO number can differ from the 34,152-record count checked on November 26, 2026.

**Critical scope distinction:** "All ECHO" means all facility records **in the ECHO All Facilities layer that match this rectangular spatial selection at query time**. It does not mean all environmental datasets, all historical violations, all facilities outside this rectangle, or all regulated entities ever recorded. Dates and compliance categories reflect EPA's source, not independently established current legal status. EPA's database may change during a multi-page live query, which can cause validation failure and require retry.

**Latest verification note (Nov 26, 2026):** The complete all-ECHO paginated loading code has been committed to GitHub, but the most recent live-browser check still loaded the previous 300-record-preview deployment. The new full-dataset version is **not yet independently browser-verified**; check the latest GitHub Pages deployment and test the all-ECHO loader before treating aggregate results as final.


## Last-inspection-year timeline (November 26, 2026)

The All ECHO interface now filters by **EPA's `fac_date_last_inspection` calendar year**, not by an invented Census-year snapshot or a fixed 300-record output cap. The live ECHO query returns all records in the study rectangle whose *most recent recorded inspection* falls within the chosen year (2017–2026). For example, direct EPA count queries on Nov 26, 2026 returned **129** for 2024, **131** for 2025, and **169** for 2026 year to date. Counts may change as EPA updates ECHO.

The UI downloads the entire year-specific result set with pagination and uses the downloaded results for charts and map markers. This does **not** answer how many facilities existed, operated, were inspected at least once, or violated a rule during the year: a facility inspected in 2025 and again in 2026 appears under **2026** only because this field stores the **latest** inspection date. Facilities without that date are absent from every year view. For historical events and true time-series analyses, separate ECHO inspection and enforcement history datasets are required.

The TRI-associated scope retains its distinct **300-record snapshot** (all TRI-flagged facilities in the rectangle at the extraction date, not selected by inspection year). The historical documentation describing all-ECHO unrestricted loading reflects an earlier implementation; the live interface prioritizes meaningful year-scoped inspection cohorts.
