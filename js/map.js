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
    $('#count').text(chosen.length + ' of ' + records.length + ' EPA facilities shown');
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
  $('#grid-toggle').on('change',function(){updateGrid(filtered());});

  $('#search').on('input',render);
  $('#city,#program,#status,#accuracy-filter').on('change',render);
  $('#reset').on('click',function(){ $search.val('');$city.val('');$program.val('');$status.val('');$('#accuracy-filter').prop('checked',false);render();fit();});
  $('#fit').on('click',fit);
  $.ajax({url:'data/dfw-epa-tri-facilities-complete.csv?v=20261126-full300-a',dataType:'text',cache:false})
    .done(load)
    .fail(function(){
      $('#count').text('Unable to load the EPA dataset.');
      $('#table-explainer').after($('<p class="error">').text('CSV data could not be fetched. Open the site using GitHub Pages or a local web server, not file://.'));
    });
})();
