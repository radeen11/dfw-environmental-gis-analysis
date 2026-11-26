# Exploratory GIS Analysis — DFW EPA ECHO TRI-Flagged Facility Sample

**Dataset:** `data/dfw-epa-tri-facilities-sample.csv`  
**Snapshot/extraction date:** November 26, 2026  
**Sample:** 75 distinct EPA Facility Registry Service IDs within an approximately DFW-centered rectangular study extent.  
**Purpose:** Practice environmental GIS, database filtering, exploratory data analysis, and spatial aggregation. This is **not** an EPA assessment, pollution inventory, or environmental justice/exposure study.

## 1. Research questions

1. How are the **75 selected records** distributed among cities?
2. Which environmental regulatory program flags appear in this sample?
3. How complete are reported compliance statuses, and how reliable are point coordinates for fine-scale geography?
4. How do apparent **sample point concentrations** change when points are aggregated into approximately 10 km map grid cells?

## 2. Dataset selection and biases

Facilities came from the publicly available U.S. EPA ECHO *All ECHO Facilities* ArcGIS service, filtered for `tri_flag = 'Y'` and coordinates in the bounding rectangle:

- Longitude -97.55 to -96.40
- Latitude 32.55 to 33.35

The API returned the **first 75 records ordered by ascending FRS registry ID** and indicated that more results existed. This creates **selection and truncation bias**. It is NOT a random, complete, or representative sample of the Dallas–Fort Worth region. The rectangle also does not match legal metropolitan or county boundaries.

**Do not interpret relative counts as citywide facility rankings or as areas of high pollution.** Counts could change substantially if the API query was paginated to include all qualifying facilities.

## 3. Verified descriptive results from this dataset

| Measure | Count |
| --- | ---: |
| EPA ECHO records | 75 |
| Distinct registry IDs | 75 |
| No violation identified (reported status) | 60 |
| Violation or Violation Identified (reported status) | 4 |
| Significant Violation (reported status) | 3 |
| Compliance status not reported | 8 |
| Air program flag (`air_flag=Y`) | 32 |
| NPDES/water program flag (`npdes_flag=Y`) | 59 |
| RCRA/waste program flag (`rcra_flag=Y`) | 61 |
| Records with reported coordinate accuracy **over 100 m** | 5 |

The largest counts **in this capped sample** are Fort Worth (18), Dallas (15), Garland (7), and Carrollton (5). These reflect this extract's ordering and scope, not total facilities in each city.

EPA program flags overlap: for example, a facility can appear in both water and waste program totals, so the three counts must **not** be summed as unique facilities.

## 4. GIS methods implemented

### Geographic points

Facilities use latitude and longitude stored in the CSV (WGS84 / decimal-degree positions). Browser code validates numeric coordinates and enforces the sample's study rectangle. The map uses Leaflet atop OpenStreetMap tiles.

### Approximate 10 km spatial grid

The map's optional grid assigns each filtered point to a fixed cell:

```text
grid_origin = (latitude 32.55, longitude -97.55)
latitude_span_degrees = 10 / 111.2
longitude_span_degrees = 10 / (111.32 × cos(32.95°))
grid_row = floor((latitude - 32.55) / latitude_span_degrees)
grid_col = floor((longitude + 97.55) / longitude_span_degrees)
```

The calculation uses a fixed local latitude approximation, **not** a formal equal-area projection. These are *approximately* 10 km × 10 km cells only near the chosen reference latitude. For publication-quality area/density measurement, transform geographic coordinates to a suitable projected coordinate reference system (e.g. locally suitable UTM) and create a precise grid there.

The overlay displays counts in nonempty cells only. Color intensity reflects relative selected-point counts per cell, **not** measured contamination, emissions, human exposure, or actual industrial density in DFW.

### Dynamic dashboards

- A searchable map and record table both reflect current filters.
- Top-seven city bar chart shows counts by reported city name (not normalized by population or land area).
- Program chart tallies flags separately, permitting overlaps.
- The coordinate-quality indicator counts reported accuracy values above 100 meters among matching records.
- 'Clear filters' restores the full **sample**, not the total universe of DFW EPA facilities.

## 5. Data quality observations

Five records have reported point-accuracy values greater than 100 meters. Some accuracy values in the source are **many kilometers**. This limits fine-scale analyses such as distance to homes, parks, rivers, schools, or environmental exposure. A precise-looking map symbol does not guarantee a precise facility location.

Reported facility name, city, and coordinate fields might contain legacy labels, spelling variants (for example, 'MC KINNEY' vs 'MCKINNEY'), or outdated information. The dashboard preserves EPA-reported city strings and does not silently merge them.

The classifications shown are source-provided ECHO compliance statuses at extraction; they are not independently verified legal findings. A blank status is labeled 'Not reported', rather than 'compliant'.

## 6. Interpretation

The dataset supports **descriptive sample visualization** and demonstrates spatial filtering, aggregation, geospatial coordinate handling, front-end visualization, and methodological caution. It does **not** support a conclusion about community health risks, TRI release quantity, emissions trends, completeness of industrial facilities, city rankings, or causal relationships.

## 7. Recommended next iteration

1. **Paginate** the EPA ArcGIS endpoint to obtain all qualifying facilities, check counts and deduplicate by FRS ID.
2. Replace rectangular selection with explicit DFW metro/county boundaries.
3. Normalize inconsistent city names using an auditable reference table.
4. Transform points into an appropriate **projected CRS** before formal buffer, nearest-neighbor, or area-density analysis.
5. Exclude or stratify poorly located points and document sensitivity of spatial results to point accuracy.
6. If investigating proximity to waterways or vulnerable communities, add actual authoritative waterways and Census spatial layers with dates, CRS, and limitations—not visual guesswork.
7. Recompute results and refresh the document when updating the data.

## Reproducibility

Review [DATA_SOURCE.md](DATA_SOURCE.md) for the exact EPA ArcGIS request and extract parameters. The dashboard's spatial aggregation and filters are implemented in [js/map.js](js/map.js) and compute from the committed CSV in the user's browser. The full project remains attributed to the original MIT-licensed DataMade template.
