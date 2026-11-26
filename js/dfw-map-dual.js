/* DFW EPA ECHO GIS portfolio map — original customization of the DataMade template.
 * Data provenance: ../DATA_SOURCE.md. Leaflet and OpenStreetMap, no Google API key.
 */
(function () {
  'use strict';
  var map = L.map('map', {scrollWheelZoom: true}).setView([32.88, -97.0], 9);
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    maxZoom: 19
  }).addTo(map);
  var markerLayer = L.featureGroup().addTo(map);
  var records = [];
  var triRecords = [];
  var allMode = false;
  var allTotal = 0;
  var querySequence = 0;
  var refreshTimer;
  var API = 'https://services.arcgis.com/cJ9YHowT8TU7DUyn/arcgis/rest/services/ECHO_All_Media_Facilities/FeatureServer/0/query';
  var studyRectangle = '-97.55,32.55,-96.40,33.35';
  var markers = new Map();
  var $search = $('#search'), $city = $('#city'), $program = $('#program'), $status = $('#status');

  function text(value) { return String(value == null ? '' : value); }
  function escapeHtml(value) {
    return text(value).replace(/[&<>"']/g, function (c) {
      return {'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'}[c];
    });
  }
  function classification(status) {
    var s = text(status).trim().toLowerCase();
    if (s.indexOf('significant') !== -1) return 'significant';
    if (s === 'no violation identified') return 'no';
    if (s.indexOf('violation') !== -1) return 'violation';
    return 'unknown';
  }
  function color(category) {
    return {no:'#397b63', violation:'#dd9845', significant:'#d64b52', unknown:'#758ba7'}[category];
  }
  function description(record) {
    var status = record.compliance_status || 'Not reported';
    var acc = record.coordinate_accuracy_meters || 'Not reported';
    var address = [record.street, record.city, record.state, record.zip].filter(Boolean).join(', ');
    var detailUrl = /^https:\/\/echo\.epa\.gov\//.test(record.epa_report_url) ?
      record.epa_report_url : 'https://echo.epa.gov/detailed-facility-report?fid=' + encodeURIComponent(record.registry_id);
    return '<strong>' + escapeHtml(record.facility_name) + '</strong>' +
      '<p>' + escapeHtml(address) + '</p>' +
      '<p><b>Registry ID:</b> ' + escapeHtml(record.registry_id) + '<br>' +
      '<b>Reported status:</b> ' + escapeHtml(status) + '<br>' +
      '<b>Air / NPDES / RCRA:</b> ' + [record.air_flag,record.npdes_flag,record.rcra_flag].map(escapeHtml).join(' / ') + '<br>' +
      '<b>EPA coordinate accuracy:</b> ' + escapeHtml(acc) + ' m</p>' +
      '<a href="' + escapeHtml(detailUrl) + '" target="_blank" rel="noopener noreferrer">View original EPA facility record</a>';
  }
  function filtered() {
    if (allMode) return records; // All-ECHO filters are evaluated by the EPA query server.
    var needle = $search.val().trim().toLowerCase(), city = $city.val(), program = $program.val(), status = $status.val();
    return records.filter(function (r) {
      var haystack = [r.facility_name, r.street, r.city, r.registry_id].join(' ').toLowerCase();
      return (!needle || haystack.indexOf(needle) >= 0) &&
        (!city || r.city === city) &&
        (!program || r[program] === 'Y') &&
        (!status || classification(r.compliance_status) === status) &&
        (!document.getElementById('accuracy-filter').checked ||
         (r.coordinate_accuracy_meters !== '' && Number(r.coordinate_accuracy_meters) <= 100));
    });
  }
  function render() {
    markerLayer.clearLayers();
    markers.clear();
    var chosen = filtered();
    var tbody = document.getElementById('results');
    tbody.textContent = '';
    var frag = document.createDocumentFragment();
    chosen.forEach(function (r) {
      var cat = classification(r.compliance_status);
      var marker = L.circleMarker([r.latitude, r.longitude], {
        radius: 7, color: '#243549', weight: 1.2, fillColor: color(cat), fillOpacity: 0.87
      }).bindPopup(description(r), {maxWidth: 300});
      marker.addTo(markerLayer);
      markers.set(r.registry_id, marker);
      var tr = document.createElement('tr');
      var nameCell = document.createElement('td');
      var button = document.createElement('button');
      button.type = 'button'; button.className = 'focus-record'; button.textContent = r.facility_name;
      button.addEventListener('click', function () {
        map.setView([r.latitude,r.longitude], 13);
        marker.openPopup();
        document.getElementById('map').scrollIntoView({behavior:'smooth',block:'start'});
      });
      nameCell.appendChild(button); tr.appendChild(nameCell);
      var cityCell = document.createElement('td'); cityCell.textContent = r.city; tr.appendChild(cityCell);
      var statusCell = document.createElement('td'); statusCell.textContent = r.compliance_status || 'Not reported'; tr.appendChild(statusCell);
      var linkCell = document.createElement('td');
      var sourceLink = document.createElement('a');
      sourceLink.href = /^https:\/\/echo\.epa\.gov\//.test(r.epa_report_url) ? r.epa_report_url : 'https://echo.epa.gov/detailed-facility-report?fid=' + encodeURIComponent(r.registry_id);
      sourceLink.target = '_blank'; sourceLink.rel = 'noopener noreferrer'; sourceLink.textContent = 'ECHO record';
      linkCell.appendChild(sourceLink); tr.appendChild(linkCell);
      frag.appendChild(tr);
    });
    tbody.appendChild(frag);
    $('#count').text(allMode
      ? ('Showing '+chosen.length+' of '+allTotal.toLocaleString('en-US')+' matching ECHO records (first '+chosen.length+' only)')
      : (chosen.length + ' of ' + records.length + ' TRI-associated EPA facilities shown'));
    updateAnalysis(chosen);
    if (chosen.length === 0) {
      var tr = document.createElement('tr'), td = document.createElement('td');
      td.colSpan = 4; td.textContent = 'No matching facilities. Try different filters.';
      tr.appendChild(td); tbody.appendChild(tr);
    }
  }
  function fit() {
    if (markerLayer.getLayers().length) map.fitBounds(markerLayer.getBounds(), {padding:[30,30], maxZoom:12});
    else map.setView([32.88,-97.0], 9);
  }
  function load(raw) {
    var rows = $.csv.toObjects(raw);
    var seen = new Set();
    records = rows.map(function (r) {
      var lat = Number(r.latitude), lon = Number(r.longitude);
      if (!r.registry_id || seen.has(r.registry_id) || !Number.isFinite(lat) || !Number.isFinite(lon) ||
          lat < 32.55 || lat > 33.35 || lon < -97.55 || lon > -96.40) return null;
      seen.add(r.registry_id);
      r.latitude = lat; r.longitude = lon;
      return r;
    }).filter(Boolean);
    records.sort(function (a,b) {return a.facility_name.localeCompare(b.facility_name);});
    var cities = Array.from(new Set(records.map(function(r){return r.city;}))).filter(Boolean).sort();
    cities.forEach(function(city){ $city.append($('<option>').val(city).text(city));});
    triRecords = records;
    render(); fit();
  }

  // Spatial count overlay on an approximate 10 km equirectangular local grid.
  // Not a distance-to-pollution or exposure model. Origin and constants are fixed for reproducibility.
  // Draw polygons in a separate visible pane above the marker SVG pane.
  // pointer-events:none preserves clicking facility circles below the grid.
  map.createPane('facilityGrid');
  map.getPane('facilityGrid').style.zIndex = 450;
  map.getPane('facilityGrid').style.pointerEvents = 'none';
  var gridLayer = L.layerGroup().addTo(map);
  var gridOriginLat = 32.55, gridOriginLon = -97.55;
  var gridLatSpan = 10 / 111.2;
  var gridLonSpan = 10 / (111.32 * Math.cos(32.95 * Math.PI / 180));

  function gridKey(r) {
    return [Math.floor((r.latitude-gridOriginLat)/gridLatSpan),
            Math.floor((r.longitude-gridOriginLon)/gridLonSpan)].join(',');
  }
  function updateGrid(chosen) {
    gridLayer.clearLayers();
    var toggle = document.getElementById('grid-toggle');
    var gridStatus = document.getElementById('grid-status');
    if (!toggle.checked) {
      gridStatus.textContent = 'Grid off';
      return;
    }
    var cells = {};
    chosen.forEach(function(r) {
      var key = gridKey(r);
      if (!cells[key]) cells[key] = 0;
      cells[key]++;
    });
    Object.keys(cells).forEach(function(key) {
      var xy = key.split(',').map(Number), count = cells[key];
      var s = gridOriginLat+xy[0]*gridLatSpan, w = gridOriginLon+xy[1]*gridLonSpan;
      L.rectangle([[s,w],[s+gridLatSpan,w+gridLonSpan]], {
        pane:'facilityGrid', color:'#bb5cfa', weight:2.4, opacity:1,
        fillColor:'#9853dc', fillOpacity:Math.min(.30 + count*.09,.78),
        interactive:false
      }).addTo(gridLayer);
    });
    gridStatus.textContent = 'Grid on: ' + Object.keys(cells).length +
      ' occupied cells (approx. 10 km each)';
  }
  function renderBars(target, entries, maxRows) {
    var root = document.getElementById(target);
    root.textContent = '';
    if (!entries.length) { root.textContent = 'No matching records'; return; }
    var highest = Math.max.apply(null,entries.map(function(x){return x[1];})) || 1;
    entries.slice(0,maxRows).forEach(function(entry) {
      var row = document.createElement('div');row.className='bar-row';
      var label = document.createElement('span'); label.textContent=entry[0];
      var track = document.createElement('div');track.className='bar-track';
      var fill = document.createElement('div');fill.className='bar-fill';
      fill.style.width=(100*entry[1]/highest)+'%';track.appendChild(fill);
      var count = document.createElement('span');count.className='bar-count';count.textContent=entry[1];
      row.appendChild(label);row.appendChild(track);row.appendChild(count);root.appendChild(row);
    });
  }
  function updateAnalysis(chosen) {
    var cities = {};
    chosen.forEach(function(r){cities[r.city]=(cities[r.city]||0)+1;});
    var cityCounts=Object.keys(cities).sort(function(a,b){return cities[b]-cities[a] || a.localeCompare(b);})
      .map(function(k){return [k,cities[k]];});
    var flags=[['Air (CAA)','air_flag'],['Water (NPDES)','npdes_flag'],['Waste (RCRA)','rcra_flag']]
      .map(function(pair){return [pair[0],chosen.filter(function(r){return r[pair[1]]==='Y';}).length];});
    $('#stat-facilities').text(chosen.length);
    $('#stat-cities').text(Object.keys(cities).length);
    $('#stat-accuracy').text(chosen.filter(function(r){return r.coordinate_accuracy_meters !== '' && Number(r.coordinate_accuracy_meters)>100;}).length);
    renderBars('chart-cities',cityCounts,7);
    renderBars('chart-programs',flags,3);
    updateGrid(chosen);
  }

  function quoteSql(value) {
    return "'" + String(value).replace(/'/g, "''") + "'";
  }
  function allWhere() {
    var clauses=["1=1"];
    var city=$city.val(), prog=$program.val(), status=$status.val();
    var needle=$search.val().trim();
    if (city) clauses.push("fac_city = "+quoteSql(city));
    if (prog) clauses.push(prog+" = 'Y'");
    if (status === 'no') clauses.push("fac_compliance_status = 'No Violation Identified'");
    if (status === 'significant') clauses.push("fac_compliance_status = 'Significant Violation'");
    if (status === 'violation') clauses.push("fac_compliance_status IN ('Violation', 'Violation Identified')");
    if (status === 'unknown') clauses.push("(fac_compliance_status IS NULL OR fac_compliance_status = 'Unknown' OR fac_compliance_status = '')");
    if (document.getElementById('accuracy-filter').checked) clauses.push("fac_accuracy_meters <= 100");
    if (needle) {
      var v=quoteSql('%'+needle.toUpperCase().replace(/[%_]/g,'')+'%');
      clauses.push("(UPPER(fac_name) LIKE "+v+" OR UPPER(fac_city) LIKE "+v+" OR UPPER(fac_street) LIKE "+v+")");
    }
    return clauses.join(' AND ');
  }
  function epaRequest(where, countOnly) {
    var p=new URLSearchParams({
      where:where,geometry:studyRectangle,geometryType:'esriGeometryEnvelope',
      spatialRel:'esriSpatialRelIntersects',inSR:'4326',outSR:'4326',f:'json'
    });
    if(countOnly) p.set('returnCountOnly','true');
    else {
      p.set('outFields','registry_id,fac_name,fac_street,fac_city,fac_state,fac_zip,fac_county,fac_lat,fac_long,tri_flag,air_flag,npdes_flag,rcra_flag,fac_active_flag,fac_compliance_status,fac_accuracy_meters');
      p.set('orderByFields','registry_id ASC');
      p.set('resultRecordCount','300');
      p.set('returnGeometry','true');
    }
    return fetch(API+'?'+p.toString()).then(function(response){
      if(!response.ok) throw new Error('EPA request returned '+response.status);
      return response.json();
    }).then(function(data){
      if(data.error) throw new Error(data.error.message || 'EPA query failed');
      return data;
    });
  }
  function loadAll() {
    var ticket=++querySequence;
    var where=allWhere();
    $('#count').text('Querying live EPA ECHO database…');
    Promise.all([epaRequest(where,true),epaRequest(where,false)]).then(function(parts){
      if(ticket!==querySequence || !allMode) return;
      allTotal=parts[0].count;
      var seen=new Set();
      records=(parts[1].features||[]).map(function(feature){
        var a=feature.attributes||{};
        var lat=Number(a.fac_lat),lon=Number(a.fac_long),id=String(a.registry_id||'');
        if(!id || seen.has(id)||!Number.isFinite(lat)||!Number.isFinite(lon)||
            lat<32.55||lat>33.35||lon< -97.55||lon> -96.40)return null;
        seen.add(id);
        return {
          registry_id:id,facility_name:a.fac_name||'Unnamed facility',
          street:a.fac_street||'',city:a.fac_city||'',state:a.fac_state||'',zip:a.fac_zip||'',
          county:a.fac_county||'',latitude:lat,longitude:lon,
          tri_flag:a.tri_flag||'',air_flag:a.air_flag||'',npdes_flag:a.npdes_flag||'',
          rcra_flag:a.rcra_flag||'',active_flag:a.fac_active_flag||'',
          compliance_status:a.fac_compliance_status||'',
          coordinate_accuracy_meters:a.fac_accuracy_meters===null?'':String(a.fac_accuracy_meters),
          epa_report_url:'https://echo.epa.gov/detailed-facility-report?fid='+encodeURIComponent(id)
        };
      }).filter(Boolean);
      render();
      fit();
    }).catch(function(error){
      if(ticket!==querySequence || !allMode) return;
      $('#count').text('EPA live query failed: '+error.message);
    });
  }
  function scheduleAll() {
    clearTimeout(refreshTimer);
    refreshTimer=setTimeout(loadAll,350);
  }
  function changeScope() {
    allMode=$('#dataset-mode').val()==='all';
    ++querySequence;
    clearTimeout(refreshTimer);
    $search.val('');$city.val('');$program.val('');$status.val('');
    $('#accuracy-filter').prop('checked',false);
    $('#all-mode-notice').prop('hidden',!allMode);
    $('#scope-description').text(allMode
      ? 'All ECHO facility records in the study rectangle: live EPA query, with up to 300 locations displayed per filtered request.'
      : 'Complete 300-record TRI-flagged point extract for the study rectangle, collected November 26, 2026.');
    $('#analysis-scope').text(allMode
      ? 'Preview charts summarize only the first 300 matching records returned by EPA, NOT the full all-ECHO total. Filter to a smaller area or selection before comparing categories.'
      : 'Counts represent all TRI-associated points in the defined study rectangle. Geographic counts are not normalized by population or area.');
    if(allMode) loadAll();
    else { records=triRecords;allTotal=0;render();fit(); }
  }
  $('#dataset-mode').on('change',changeScope);

  $('#grid-toggle').on('change',function(){updateGrid(filtered());});

  $('#search').on('input',function(){if(allMode)scheduleAll();else render();});
  $('#city,#program,#status,#accuracy-filter').on('change',function(){if(allMode)loadAll();else render();});
  $('#reset').on('click',function(){
    $search.val('');$city.val('');$program.val('');$status.val('');
    $('#accuracy-filter').prop('checked',false);
    if(allMode) loadAll(); else {render();fit();}
  });
  $('#fit').on('click',fit);
  $.ajax({url:'data/dfw-epa-tri-facilities-complete.csv?v=20261126-full300-b',dataType:'text',cache:false})
    .done(load)
    .fail(function(){
      $('#count').text('Unable to load the EPA dataset.');
      $('#table-explainer').after($('<p class="error">').text('CSV data could not be fetched. Open the site using GitHub Pages or a local web server, not file://.'));
    });
})();
