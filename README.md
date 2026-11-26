# Dallas–Fort Worth EPA Facility Explorer

**[Explore the interactive GIS map](https://radeen11.github.io/dfw-environmental-gis-analysis/)** · [Data provenance](DATA_SOURCE.md) · [Analysis and interpretation](ANALYSIS.md)

An independent environmental GIS portfolio project using publicly available **U.S. EPA Enforcement and Compliance History Online (ECHO)** data to explore facility locations, reported regulatory information, and spatial patterns within a defined Dallas–Fort Worth-area rectangle. Built with **JavaScript, Leaflet, OpenStreetMap, and Python**.

## At a glance

| Component | Description |
| --- | --- |
| Study area | Longitude −97.55 to −96.40, latitude 32.55 to 33.35 (WGS84 rectangle; **not** the official DFW metropolitan boundary) |
| TRI-associated snapshot | **300 records**, EPA ECHO query extract retrieved **November 26, 2026** |
| Latest-inspection-year view | Live EPA ECHO query for records whose **most recent recorded facility inspection date** falls in the selected year, **2017–2026** |
| GIS techniques | Coordinate validation, searchable facility markers, filtering, approximate 10 km grid counts, data-quality screening |
| Project outputs | Published interactive site, reusable Python data extractor, CSV snapshot, reproducible methods, analysis notes |

## What you can do

- Explore all **300 TRI-associated facility records** in the saved study-area snapshot, without a 75- or 300-record *preview* limit.
- Switch to a **year-specific cohort** of ECHO-listed facilities selected by their **latest recorded inspection date**. The app requests the entire matching cohort from EPA, not an arbitrary first 300 results.
- Search by facility name, location or EPA registry ID; filter by reported city, EPA program association, compliance classification, and source-reported positional accuracy.
- Examine map popups linked to source facility reports, summary charts, and **approximate 10 km facility-count grid cells**. When a very large cohort is selected, an aggregate grid substitutes for dense overlapping point symbols.
- Review source quality: a facility's position or compliance label may be uncertain, absent, outdated, or dependent on EPA program reporting.

**Crucial distinction:** The inspection-year view is **not a historical census**. A facility appears in the year of its **most recent inspection currently recorded by EPA**, not in every year it operated or was inspected. The app does not reconstruct inspection-event histories, pollution, or human exposure.

## Results from the fixed TRI snapshot

| Measure | Count |
| --- | ---: |
| TRI-associated EPA ECHO facility records / distinct registry IDs | 300 |
| Distinct EPA-reported city labels | 53 |
| No Violation Identified | 197 |
| Violation / Violation Identified / Significant Violation | 13 |
| Unknown or unreported classifications | 90 |
| CAA / NPDES / RCRA program flags (categories overlap) | 69 / 206 / 150 |
| Coordinates with source-reported positional accuracy worse than 100 m | 52 |
| Occupied approximate 10 km grid cells | 64 |

These are **counts of source records** meeting the TRI filter in this rectangle, **not** estimates of pollution, risk, current illegal activity, or all industrial sites. City comparisons are not normalized by population, land area, or facility type.

## Inspection-year data: interpretation

The app uses EPA ECHO's `fac_date_last_inspection` field. Direct EPA query checks on **November 26, 2026** returned **129** facilities with their latest recorded inspection in **2024**, **131** in **2025**, and **169** in **2026 to date** within the study rectangle. These numbers can change as ECHO is refreshed, and facilities with no recorded latest inspection date do not appear in this view. A facility re-inspected in 2026 would no longer belong to the 2025 cohort.

To investigate **all inspections that happened during a given year**, historical inspection events—not the current facility-level *last inspection* field—would be required.

## Reproducibility and project files

1. Run `python3 scripts/fetch_epa_echo.py` (Python 3 standard library and internet access) to regenerate the TRI-associated snapshot from the EPA ArcGIS service. The script checks pagination, registry IDs, coordinate validity, and output fields; a fresh run can return a different count.
2. Serve the repository as a static website, for example `python3 -m http.server 8000`, then open `http://localhost:8000`.
3. Read [DATA_SOURCE.md](DATA_SOURCE.md) for the exact feature layer, query, fields, and caveats, and [ANALYSIS.md](ANALYSIS.md) for the spatial analysis methodology.

| File | Purpose |
| --- | --- |
| [index.html](index.html) | Responsive GIS interface, labels, filters, table and charts |
| [js/dfw-map-copy-reviewed.js](js/dfw-map-copy-reviewed.js) | Active Leaflet map application and inspection-year queries |
| [data/dfw-epa-tri-facilities-complete.csv](data/dfw-epa-tri-facilities-complete.csv) | Fixed, 300-record TRI-associated EPA extract |
| [data/dfw-epa-tri-facilities-sample.csv](data/dfw-epa-tri-facilities-sample.csv) | Archived 75-record development sample; **not** used by the live map |
| [scripts/fetch_epa_echo.py](scripts/fetch_epa_echo.py) | Reproducible EPA data extraction and validation |
| [PROJECT_PLAN.md](PROJECT_PLAN.md) | Implementation checklist and remaining QA |

## Verification status

**Confirmed:** A live browser previously verified the fixed TRI snapshot at **300/300** records, the 64-cell spatial grid, and the coordinate-accuracy filter reducing records to **248/300**.

**Still to confirm:** End-to-end testing of the **latest inspection-year view on the currently deployed website**, including its count, map markers, year switching, and source connections. The year-based EPA query was validated separately, but the new browser workflow should not be called verified until observed. This is a portfolio project, not a production environmental reporting service.

## Limits, ethics, and attribution

This is a **rectangular geographic subset**, not the official Dallas–Fort Worth metropolitan area or every regulated facility. Inclusion in ECHO or TRI is not evidence of pollution, exposure, a legal violation, or a public-health threat. EPA source records can contain missing or outdated locations and compliance classifications. Approximate grid squares show record concentration only.

The app began as a fork of [DataMade's MIT-licensed Searchable Map Template](https://github.com/datamade/searchable-map-template-csv), which credits Derek Eder. Its original [LICENSE](LICENSE) is preserved. The project customizes the frontend, data integration, analysis, quality filters, and research documentation. Map data © OpenStreetMap contributors; regulatory source U.S. EPA. Not affiliated with or endorsed by EPA.
