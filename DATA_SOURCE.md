# Data Provenance and Reproducibility

**EPA data snapshot:** November 26, 2026  
**Dataset:** 300 TRI-flagged facilities from U.S. EPA [Enforcement and Compliance History Online (ECHO)](https://echo.epa.gov/) — *All ECHO Facilities* ArcGIS FeatureServer.  
**Published CSV:** [data/dfw-epa-tri-facilities-complete.csv](data/dfw-epa-tri-facilities-complete.csv).  
**Repeatable extractor:** [scripts/fetch_epa_echo.py](scripts/fetch_epa_echo.py) (Python 3 standard library).

## Exact query scope

- **Feature layer:** https://services.arcgis.com/cJ9YHowT8TU7DUyn/arcgis/rest/services/ECHO_All_Media_Facilities/FeatureServer/0/query
- **Attribute filter:** `tri_flag = 'Y'`
- **Spatial filter:** EPSG:4326 rectangle, longitude **-97.55 to -96.40**, latitude **32.55 to 33.35**; `geometryType=esriGeometryEnvelope`, `spatialRel=esriSpatialRelIntersects`.
- **Order:** `registry_id ASC`; **page size 100** with offsets **0, 100, 200**.
- **Returned count:** `returnCountOnly=true` returned **300**.
- **Results:** all three pages returned 100 records; 300/300 distinct nonempty FRS IDs; no invalid/out-of-extent coordinates excluded in the committed extract.
- **Coordinate representation:** WGS84 latitude/longitude decimal degrees; point accuracy metadata retained, not individually field-verified.

For a fresh extract, run:

```bash
python3 scripts/fetch_epa_echo.py
```

The script queries the current public service, checks total records and pages, rejects duplicates/invalid points, and writes the CSV. **A rerun may return a different number of facilities** when the EPA service changes. Do not assume it will always be 300.

## CSV fields

`registry_id` (FRS ID), `facility_name`, `street`, `city`, `state`, `zip`, `county`, `latitude`, `longitude`, `tri_flag`, `air_flag`, `npdes_flag`, `rcra_flag`, `active_flag`, `compliance_status`, `coordinate_accuracy_meters`, `epa_report_url`.

## Important scope limitations

This query is **complete only for this TRI-flag and the rectangle, as represented by the November 26, 2026 EPA service snapshot**. It does *not* include all EPA-regulated facilities, all TRI reporters in official DFW metro counties, or all industrial sites. Some facilities may fall just outside the rectangle; some coordinate metadata can be inaccurate or approximate. Names and statuses may be historic; EPA refreshes ECHO regularly, so verify important records on the source site.

An EPA TRI association does **not** identify specific chemicals, release amounts, exposure, harm or violations for the extracted site. Compliance statuses were not independently audited. Source precision values can be very poor; 52 of 300 records have stated positional accuracy worse than 100 m.

For analytical methods, see [ANALYSIS.md](ANALYSIS.md). For full EPA context, see [ECHO Map Services](https://echo.epa.gov/tools/map-service) and [TRI Data Considerations](https://www.epa.gov/trinationalanalysis/tri-data-considerations).

## Original 75-row file

`data/dfw-epa-tri-facilities-sample.csv` remains as an archived first-page pilot extract; **the live map now loads the 300-row complete file**. Use the 300-row file and analysis report for portfolio claims.



## Complete all-ECHO mode (November 26, 2026 revision)

The **All EPA ECHO** selection no longer limits the data to the first 300 records. It requests the current total, then pages through **every record** matching the geographic rectangle from the public EPA ArcGIS FeatureServer, using 1,000 records per request with up to four concurrent requests. All pages must return the expected number of records, and the combined set must have distinct FRS identifiers and valid in-rectangle coordinates. If verification fails, the site shows an error instead of presenting a truncated dataset as complete.

Once loaded, filters, city charts, regulatory-program counts, compliance counts and 10 km grid aggregation operate on **all downloaded ECHO records**. For browser performance, an overview with over 1,500 matches displays an aggregate grid instead of thousands of point icons. Narrower selections render all corresponding markers. The results table is deliberately capped at the first 250 entries while its counts and charts include every matching record. The live ECHO number can differ from the 34,152-record count checked on November 26, 2026.

**Critical scope distinction:** "All ECHO" means all facility records **in the ECHO All Facilities layer that match this rectangular spatial selection at query time**. It does not mean all environmental datasets, all historical violations, all facilities outside this rectangle, or all regulated entities ever recorded. Dates and compliance categories reflect EPA's source, not independently established current legal status. EPA's database may change during a multi-page live query, which can cause validation failure and require retry.


## Last-inspection-year timeline (November 26, 2026)

The All ECHO interface now filters by **EPA's `fac_date_last_inspection` calendar year**, not by an invented Census-year snapshot or a fixed 300-record output cap. The live ECHO query returns all records in the study rectangle whose *most recent recorded inspection* falls within the chosen year (2017–2026). For example, direct EPA count queries on Nov 26, 2026 returned **129** for 2024, **131** for 2025, and **169** for 2026 year to date. Counts may change as EPA updates ECHO.

The UI downloads the entire year-specific result set with pagination and uses the downloaded results for charts and map markers. This does **not** answer how many facilities existed, operated, were inspected at least once, or violated a rule during the year: a facility inspected in 2025 and again in 2026 appears under **2026** only because this field stores the **latest** inspection date. Facilities without that date are absent from every year view. For historical events and true time-series analyses, separate ECHO inspection and enforcement history datasets are required.

The TRI-associated scope retains its distinct **300-record snapshot** (all TRI-flagged facilities in the rectangle at the extraction date, not selected by inspection year). The historical documentation describing all-ECHO unrestricted loading reflects an earlier implementation; the live interface prioritizes meaningful year-scoped inspection cohorts.
