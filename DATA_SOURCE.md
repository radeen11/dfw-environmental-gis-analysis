# DFW EPA TRI-flagged facility extract — data notes

**Acquired:** 2026-11-26 (UTC date; live public ECHO ArcGIS FeatureServer)  
**Original data:** U.S. EPA Enforcement and Compliance History Online (ECHO), *All ECHO Facilities* layer.  
**Endpoint:** https://services.arcgis.com/cJ9YHowT8TU7DUyn/arcgis/rest/services/ECHO_All_Media_Facilities/FeatureServer/0/query

## Extract scope

This CSV contains **75 distinct EPA Facility Registry Service (FRS) registry IDs** from one point-in-polygon *bounding-box* query (not actual county boundaries), limited to **75 returned records** sorted by `registry_id ASC`. It is an **illustrative, capped sample**, NOT a complete inventory of all facilities in DFW.

- Bounding rectangle: longitude -97.55 to -96.40, latitude 32.55 to 33.35, spatial reference EPSG:4326
- EPA filter: `tri_flag = 'Y'` as reported by ECHO, regardless of current activity flag; does not assert a TRI report in the latest year
- Fields: facility ID, name, address, point coordinates, media flags, active flag, reported compliance status, coordinate accuracy, EPA Detailed Facility Report URL
- Excluded returned rows: duplicate FRS IDs, missing/invalid coordinates, or values outside the specified bounding box
- Coordinates may be generalized or inaccurate; review `coordinate_accuracy_meters`. Do not treat them as exact plant, discharge or exposure locations.
- The `tri_flag` marks association with EPA's Toxics Release Inventory program and **does not establish violations, unsafe conditions, actual exposure, or health risk**. Compliance fields can be null, incomplete or temporally stale.

## Reproduce the extract

ArcGIS query URL:

https://services.arcgis.com/cJ9YHowT8TU7DUyn/arcgis/rest/services/ECHO_All_Media_Facilities/FeatureServer/0/query?where=tri_flag%20%3D%20'Y'&geometry=-97.55%2C32.55%2C-96.40%2C33.35&geometryType=esriGeometryEnvelope&inSR=4326&spatialRel=esriSpatialRelIntersects&outFields=registry_id%2Cfac_name%2Cfac_street%2Cfac_city%2Cfac_state%2Cfac_zip%2Cfac_county%2Cfac_lat%2Cfac_long%2Cfac_active_flag%2Cfac_compliance_status%2Ctri_flag%2Cair_flag%2Cnpdes_flag%2Crcra_flag%2Cdfr_url%2Cfac_accuracy_meters&orderByFields=registry_id%20ASC&resultRecordCount=75&outSR=4326&f=geojson

To refresh the CSV, rerun the query, retain the mapped fields above and normalize one FRS registry ID per record. A full regional inventory would require pagination and a documented county or geographic-region selection strategy, rather than this first-page sample.

Sources: [EPA ECHO map services](https://echo.epa.gov/tools/map-service), [EPA TRI reporting](https://www.epa.gov/toxics-release-inventory-tri-program/reporting-tri-facilities), [EPA TRI limitations](https://www.epa.gov/trinationalanalysis/tri-data-considerations).

**Status:** Map is published on GitHub Pages. Baseline controls were user-tested November 26, 2026. Newly added dashboard/grid features need a fresh check. See [ANALYSIS.md](ANALYSIS.md) for descriptive counts and spatial methods.
