# DFW EPA ECHO: Spatial Facility Analysis

**Published project:** https://radeen11.github.io/dfw-environmental-gis-analysis/  
**Data snapshot:** November 26, 2026  
**Data selection:** All 300 ECHO records with `tri_flag = 'Y'` returned within the defined study rectangle, fetched across **three paginated results** (100 + 100 + 100).  
**Question:** Where are TRI-associated, EPA-regulated facilities in the bounded DFW study area, and what spatial patterns and data-quality issues are visible?

## Executive summary

The completed selection includes **300 distinct FRS registry IDs** and valid point coordinates in the study rectangle. The dashboard provides a searchable Leaflet map, city and regulatory-program counts, optional approximate 10 km grid aggregation, and a positional-accuracy screen.

This is a **complete extract for that query and bounding rectangle**, not all industrial facilities in DFW and not the legal definition of the DFW metropolitan statistical area. TRI program association does not establish chemical releases in a particular year, environmental exposure, violations, or risk.

### Results from the CSV (snapshot values)

| Metric | Count |
| --- | ---: |
| Records returned by EPA | 300 |
| Valid coordinate rows | 300 |
| Unique FRS registry IDs | 300 |
| Distinct EPA-reported city labels | 53 |
| No Violation Identified | 197 |
| Violation | 6 |
| Violation Identified | 1 |
| Significant Violation | 6 |
| Unknown | 3 |
| Blank / not reported compliance status | 87 |
| Air (CAA) program flag = Y | 69 |
| NPDES/water program flag = Y | 206 |
| RCRA/waste program flag = Y | 150 |
| EPA coordinate accuracy greater than 100 m | 52 |
| EPA coordinate accuracy greater than 1 km | 47 |
| Approximate 10 km grid cells containing ≥1 point | 64 |
| Largest sampled grid-cell count | 23 |

Most represented reported cities within this rectangle: **Fort Worth 52**, **Dallas 46**, **Garland 18**, **Grand Prairie 18**, **Arlington 13**, **Irving 11**, **Carrollton 10**, **Denton 10**. These are *raw counts of matching records within the selected rectangle*, not normalized citywide comparisons or pollution measurements.

Program categories overlap; a facility may have several program flags. For reported compliance status, 'Unknown' and a blank are not synonyms for compliant.

## Study design and methods

### 1. Spatial selection and program scope

Use the ECHO *All ECHO Facilities* FeatureServer point layer, filter `tri_flag = 'Y'`, intersect an **EPSG:4326 geographic bounding rectangle**:

- West/east longitude: **-97.55 / -96.40**
- South/north latitude: **32.55 / 33.35**

The EPA endpoint returned a query count of **300**. We paginated with `resultOffset=0,100,200`, `resultRecordCount=100`, sorted by `registry_id ASC`. All 300 returned points passed ID/coordinate checks. The committed CSV is an auditable, time-specific snapshot. For full request arguments see [DATA_SOURCE.md](DATA_SOURCE.md) and [scripts/fetch_epa_echo.py](scripts/fetch_epa_echo.py).

A rectangular geographic selection does not coincide with city limits or the Dallas–Fort Worth metropolitan statistical area. Some cities are partially included or have facilities outside the rectangle. Thus raw city counts are **not comparable measures of facilities per resident or square kilometer**.

### 2. Cleaning and record keys

Retained one record per FRS `registry_id` with EPA-reported name, address, latitude/longitude, `tri_flag`, other ECHO program flags, active status, compliance status, stated coordinate accuracy, and detailed facility report link. Validated nonempty IDs, numeric point coordinates, and geographic containment. Did not silently normalize EPA-reported city labels (which may include variants or historical labels).

The service is a **snapshot refreshed by EPA**, so future reruns may differ. Data includes potentially legacy/inactive names even when active flag indicates a current record.

### 3. Dynamic city and regulatory-program summaries

The dashboard computes counts for whatever records pass user filters. City bars are ranked by the **observed number of extracted records within the rectangle**. CAA/air, NPDES/water, and RCRA/waste are independently counted and are not mutually exclusive. Neither metric is an environmental-impact indicator.

### 4. Spatial aggregation into approximate 10 km grid cells

An optional rectangular grid uses a local degree-to-kilometer approximation near latitude **32.95° N**. The grid is anchored at `(32.55, -97.55)`:

```text
lat_span = 10 / 111.2 degrees
lon_span = 10 / (111.32 * cos(32.95°)) degrees
row = floor((latitude - 32.55) / lat_span)
column = floor((longitude + 97.55) / lon_span)
```

Each facility is assigned to a single cell (64 nonempty grid cells in the unfiltered extract); color opacity increases with matching record counts. The largest cell contains 23 of the extracted facility points. **Not** an authoritative projected/equal-area gridding, kernel density estimation, chemical release measure, or exposure assessment. Counts change when filters are applied. Grid rectangles sit above the base map but do not intercept clicks on facility markers.

A formally projected ~10 km × 10 km grid should use a locally suitable projected CRS such as UTM zone 14N (EPSG:32614) or an appropriate Texas regional projection and document the projection/distortion characteristics. The browser demo instead uses a transparent approximation, suitable for **visual grouping only**.

### 5. Positional-quality screen

EPA reports `fac_accuracy_meters` for each record. The CSV contains **52 locations with accuracy >100 m**, of which **47 exceed 1 km**. Some source uncertainty values are extremely large; treat them as warnings about unreliable geocoding, not measured distances to sites. The app's **accuracy ≤100 m** checkbox screens out these lower-precision records for sensitive spatial interpretation.

This screen does **not guarantee the remaining facilities are survey-grade or accurately geocoded**. The source accuracy field can reflect reporting metadata rather than independent GPS measurements.

### 6. Data interpretation and cautions

- **TRI flag** means the ECHO record is associated with that regulatory program. It is not a claim of reported releases in 2026 or proof of exposure.
- **Compliance flags** are historical source observations that may be blank, stale, under review, or specific to regulatory programs. A status does not establish environmental health risk.
- **Clustering** of points in the grid reflects the number of selected facility records in that cell, not contamination concentrations or community impact.
- **No comparison to waterbodies, homes, schools or disadvantaged communities** was conducted; such analysis would require validated external spatial datasets, projection-aware buffers and quality sensitivity tests.
- **No area/population normalization** was attempted. A city's raw point count is not a rate or density metric.

Relevant EPA guidance: [ECHO Map Service](https://echo.epa.gov/tools/map-service), [TRI Data Considerations](https://www.epa.gov/trinationalanalysis/tri-data-considerations), and [EPA TRI Risk Considerations](https://www.epa.gov/toxics-release-inventory-tri-program/tri-and-estimating-potential-risk).

## Deliverables and skills demonstrated

- Official EPA ArcGIS REST query, result count verification and pagination.
- Data cleaning and traceable CSV source.
- Quality assurance (ID uniqueness, valid coordinates, source uncertainty screening).
- Leaflet and OpenStreetMap geographic visualization.
- Search and multiple source-attribute filters.
- Responsive filter-aware charts and aggregation grid.
- Public GitHub Pages deployment and maintained methodology.

See [README.md](README.md) for the live website and attribution. The initial map search, filters and popups were user-tested. The completed 300-record live deployment was subsequently browser-tested: map count 300/300, 64 occupied grid cells, and the ≤100 m accuracy screen reduced the map to 248/300 records and 61 occupied cells, with charts updating accordingly.


## 8. Expanded regulatory scope: TRI vs. all-ECHO live mode

The map now offers a **dataset scope selector**. The saved TRI extract comprises 300 matching points in the rectangle. The separate all-ECHO mode queries the authoritative service live, across all ECHO programs, rather than treating the TRI filter as a complete inventory.

The EPA live query returned **34,152 all-ECHO records** in the rectangle at the time of testing. The web browser loads no more than **300 matching records at once** to avoid overload; the full matching count is still reported. Because selection is ordered by FRS registry ID, the preview is **not representative**, and neither charts nor geographic markers in the all-ECHO view can be interpreted as a complete spatial distribution. For meaningful comparisons, first narrow the query until the matching total is 300 or fewer. A future version may use server-side aggregations or vector-tile clustering for genuinely complete regional visualizations.

All-ECHO records include many nonindustrial sites and sites associated with other programs; they do **not** represent violations, emissions, pollution, or public-health threats. EPA's current statuses can differ by program, update cycle and facility identifiers.
