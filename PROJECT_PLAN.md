# DFW Industrial Facilities GIS — Project Plan

**Status:** Initial setup. The live map currently contains the original Chicago demonstration data; no Dallas–Fort Worth environmental conclusions have been made yet.

## Research question

Where are EPA-listed industrial facilities located in the Dallas–Fort Worth region, and what documented facility attributes can be compared spatially? Facility presence or proximity alone must **not** be interpreted as proof of exposure, contamination, or health risk.

## Proposed sources

- U.S. EPA [ECHO Data Downloads](https://echo.epa.gov/tools/data-downloads)
- U.S. EPA [Facility Registry Service](https://www.epa.gov/frs)
- U.S. Census Bureau geographic boundaries, if needed

## Tasks

- [x] Fork and review the original open-source mapping template.
- [ ] Download a reproducible subset of EPA facility records for the DFW area.
- [ ] Document the dataset's extraction date, columns, geographic filters, and limitations.
- [ ] Replace the Chicago sample dataset with the cleaned DFW EPA dataset.
- [ ] Configure map location, labels, tables, search, and facility popups.
- [ ] Remove or replace the template's Google API dependency to avoid requiring a billed API key.
- [ ] Test map functionality and accessibility.
- [ ] Publish via GitHub Pages.
- [ ] Add a final methodology, results, limitations, and screenshots.

## Attribution

Based on [DataMade's Searchable Map Template – CSV](https://github.com/datamade/searchable-map-template-csv), itself based on work by Derek Eder. The original software is MIT-licensed; preserve the repository's LICENSE and required copyright notice.

## Portfolio classification

Independent GIS portfolio project, using an attributed open-source web mapping template and official public data. Do not represent it as employer work or an official EPA risk assessment.
