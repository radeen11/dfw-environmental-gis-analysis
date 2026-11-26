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


## Optional live all-ECHO search mode (added Nov 26, 2026)

The web app now offers two data scopes:

1. **TRI-associated snapshot:** complete 300-record EPA query in the geographic rectangle, saved as CSV and fully represented in charts.
2. **All ECHO-listed facilities:** a **live** remote ArcGIS API query with `where=1=1` plus filters, for the same rectangle. EPA reported **34,152** records for the unfiltered rectangle in a live `returnCountOnly=true` request on November 26, 2026. That total may change on later visits.

**Performance and disclosure:** In all-ECHO mode, the site displays the **first 300 matching records sorted by `registry_id`** to keep browser memory and map rendering reasonable; the counter reports the full matching EPA record count. The map and dashboard charts for this mode show **only the displayed preview records**, NOT a statistically representative sample of all matching facilities. Filter by city, name, environmental program, compliance status, or source coordinate accuracy to narrow the live query. The browser requires Internet access to EPA's ArcGIS feature service and will show an error if the service is unavailable or its cross-origin policy prevents access. No all-facility raw dataset is stored in the repository.

The all-ECHO scope includes a wider range of regulated facilities, potentially construction projects, schools, small operations and industrial facilities; **ECHO-listed does not mean industrial, toxic, violating, or unsafe**. ECHO data is incomplete for programs not tracked by the service.
