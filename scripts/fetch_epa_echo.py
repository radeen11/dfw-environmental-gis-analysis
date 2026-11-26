#!/usr/bin/env python3
"""Rebuild the DFW ECHO TRI-flagged facility CSV from the public EPA ArcGIS service.

Requires Python 3.9+; only Python standard library. Outputs a snapshot when run;
results may change because EPA refreshes the service. This is a bounding-rectangle
extract, NOT a Dallas–Fort Worth metropolitan-area administrative boundary.
"""
import csv
import json
from pathlib import Path
from urllib.parse import urlencode
from urllib.request import Request, urlopen

SERVICE = "https://services.arcgis.com/cJ9YHowT8TU7DUyn/arcgis/rest/services/ECHO_All_Media_Facilities/FeatureServer/0/query"
BBOX = (-97.55, 32.55, -96.40, 33.35)
COLUMNS = [
    "registry_id", "facility_name", "street", "city", "state", "zip", "county",
    "latitude", "longitude", "tri_flag", "air_flag", "npdes_flag", "rcra_flag",
    "active_flag", "compliance_status", "coordinate_accuracy_meters", "epa_report_url"
]
OUTFIELDS = (
    "registry_id,fac_name,fac_street,fac_city,fac_state,fac_zip,fac_county,"
    "fac_lat,fac_long,tri_flag,air_flag,npdes_flag,rcra_flag,fac_active_flag,"
    "fac_compliance_status,fac_accuracy_meters"
)

def query(**kwargs):
    base = {
        "where": "tri_flag = 'Y'",
        "geometry": ",".join(map(str, BBOX)),
        "geometryType": "esriGeometryEnvelope",
        "inSR": 4326, "spatialRel": "esriSpatialRelIntersects", "f": "json",
    }
    base.update(kwargs)
    request = Request(SERVICE + "?" + urlencode(base), headers={"User-Agent": "DFW-ECHO-GIS-portfolio/1.0"})
    with urlopen(request, timeout=90) as response:
        data = json.load(response)
    if "error" in data:
        raise RuntimeError(f"EPA service error: {data['error']}")
    return data

def main():
    total = query(returnCountOnly="true")["count"]
    print(f"EPA reports {total} matching records")
    batch_size = 100
    features = []
    for offset in range(0, total, batch_size):
        page = query(
            outFields=OUTFIELDS, resultRecordCount=batch_size,
            resultOffset=offset, orderByFields="registry_id ASC",
            outSR=4326, returnGeometry="true"
        )
        records = page.get("features", [])
        if not records:
            raise RuntimeError(f"No records on expected page {offset}; aborting")
        features.extend(records)
        print(f"Read {len(records)} rows at offset {offset}")

    if len(features) != total:
        raise RuntimeError(f"Expected {total} records, got {len(features)}; not writing partial extract")

    clean = {}
    rejected = []
    for feature in features:
        a = feature["attributes"]
        rid = str(a.get("registry_id") or "").strip()
        lat, lon = a.get("fac_lat"), a.get("fac_long")
        if not rid or lat is None or lon is None:
            rejected.append(rid)
            continue
        lat, lon = float(lat), float(lon)
        if not (BBOX[1] <= lat <= BBOX[3] and BBOX[0] <= lon <= BBOX[2]):
            rejected.append(rid)
            continue
        if rid in clean:
            raise RuntimeError(f"Duplicate registry ID: {rid}")
        def field(name):
            x = a.get(name)
            return "" if x is None else str(x)
        clean[rid] = {
            "registry_id": rid, "facility_name": field("fac_name"),
            "street": field("fac_street"), "city": field("fac_city"),
            "state": field("fac_state"), "zip": field("fac_zip"),
            "county": field("fac_county"), "latitude": round(lat, 6),
            "longitude": round(lon, 6), "tri_flag": field("tri_flag"),
            "air_flag": field("air_flag"), "npdes_flag": field("npdes_flag"),
            "rcra_flag": field("rcra_flag"), "active_flag": field("fac_active_flag"),
            "compliance_status": field("fac_compliance_status"),
            "coordinate_accuracy_meters": field("fac_accuracy_meters"),
            "epa_report_url": "https://echo.epa.gov/detailed-facility-report?fid=" + rid,
        }
    target = Path(__file__).resolve().parent.parent / "data" / "dfw-epa-tri-facilities-complete.csv"
    target.parent.mkdir(parents=True, exist_ok=True)
    with target.open("w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=COLUMNS)
        writer.writeheader()
        writer.writerows(clean[key] for key in sorted(clean))
    print(f"Saved {len(clean)} valid unique records to {target}; excluded {len(rejected)} coordinate/ID problems")
    if rejected:
        print("Excluded registry IDs:", rejected)

if __name__ == "__main__":
    main()
