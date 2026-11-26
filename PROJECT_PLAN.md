# DFW Industrial Facilities GIS — Project Plan

**Status:** Interactive map code and first EPA data sample are committed. GitHub Pages publication and browser testing are pending. No environmental risk assessment has been made.

## Research question

Where are EPA-listed industrial facilities located in the Dallas–Fort Worth region, and what documented facility attributes can be compared spatially? Facility presence or proximity alone must **not** be interpreted as proof of exposure, contamination, or health risk.

## Proposed sources

- U.S. EPA [ECHO Data Downloads](https://echo.epa.gov/tools/data-downloads)
- U.S. EPA [Facility Registry Service](https://www.epa.gov/frs)
- U.S. Census Bureau geographic boundaries, if needed

## Tasks

- [x] Fork and review the original open-source mapping template.
- [x] Download a reproducible subset of EPA facility records for the DFW area.
- [x] Document the dataset's extraction date, columns, geographic filters, and limitations.
- [x] Replace the Chicago sample dataset with the cleaned DFW EPA dataset.
- [x] Configure map location, labels, tables, search, and facility popups.
- [x] Remove or replace the template's Google API dependency to avoid requiring a billed API key.
- [ ] Test map functionality and accessibility.
- [ ] Publish via GitHub Pages.
- [ ] Add a final methodology, results, limitations, and screenshots.

## Attribution

Based on [DataMade's Searchable Map Template – CSV](https://github.com/datamade/searchable-map-template-csv), itself based on work by Derek Eder. The original software is MIT-licensed; preserve the repository's LICENSE and required copyright notice.

## Portfolio classification

Independent GIS portfolio project, using an attributed open-source web mapping template and official public data. Do not represent it as employer work or an official EPA risk assessment.
