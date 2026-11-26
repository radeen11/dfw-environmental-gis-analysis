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
      '<b>Last recorded inspection:</b> ' + escapeHtml(record.last_inspection||'Not recorded') + '<br>' +
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
    chosen.slice(0, chosen.length<=maxMarkers ? chosen.length : maxTableRows).forEach(function (r, index) {
      var cat = classification(r.compliance_status);
      var marker = L.circleMarker([r.latitude, r.longitude], {
        radius: 7, color: '#243549', weight: 1.2, fillColor: color(cat), fillOpacity: 0.87
      }).bindPopup(description(r), {maxWidth: 300});
      if(chosen.length<=maxMarkers){
        marker.addTo(markerLayer);
        markers.set(r.registry_id, marker);
      }
      var tr = document.createElement('tr');
      var nameCell = document.createElement('td');
      var button = document.createElement('button');
      button.type = 'button'; button.className = 'focus-record'; button.textContent = r.facility_name;
      button.addEventListener('click', function () {
        map.setView([r.latitude,r.longitude], 13);
        if(!markerLayer.hasLayer(marker))marker.addTo(markerLayer);
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
      if(index<maxTableRows)frag.appendChild(tr);
    });
    tbody.appendChild(frag);
    if(chosen.length>maxTableRows)$('#table-explainer').text('Showing '+maxTableRows+' of '+chosen.length.toLocaleString('en-US')+' matching records in this table; charts and grid include all matches.');
    else $('#table-explainer').text('Showing all '+chosen.length.toLocaleString('en-US')+' matching records. Select a name to locate it on the map.');
    $('#count').text(allMode
      ? (chosen.length.toLocaleString('en-US')+' of '+allTotal.toLocaleString('en-US')+' facilities last inspected in '+$('#inspection-year').val()+' match your filters')
      : (chosen.length+' of '+records.length+' TRI-associated facility records match your filters'));
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
    if (!toggle.checked && chosen.length<=maxMarkers) {
      gridStatus.textContent = 'Grid off';
      return;
    }
    var cells = {};
    if(chosen.length>maxMarkers && !toggle.checked)toggle.checked=true;
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
    gridStatus.textContent = (chosen.length>maxMarkers?'All '+chosen.length.toLocaleString('en-US')+' records aggregated; ':'') + 'Grid on: ' + Object.keys(cells).length +
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

  // Load every ECHO record in the rectangle, not a 300-record preview.
  // 1000 records per page; abort presentation if any page is missing.
  var allRecords=null;
  var loadedYear=null;
  var loadPromise=null;
  var maxMarkers=1500;
  var maxTableRows=250;
  var PAGE_SIZE=1000;
  var wantedFields='OBJECTID,registry_id,fac_name,fac_street,fac_city,fac_state,fac_zip,fac_county,fac_lat,fac_long,tri_flag,air_flag,npdes_flag,rcra_flag,fac_active_flag,fac_compliance_status,fac_accuracy_meters,fac_date_last_inspection';

  function epaFetch(params) {
    var p=new URLSearchParams(Object.assign({
      where:'1=1',geometry:studyRectangle,geometryType:'esriGeometryEnvelope',
      spatialRel:'esriSpatialRelIntersects',inSR:'4326',outSR:'4326',f:'json'
    },params));
    return fetch(API+'?'+p.toString()).then(function(response){
      if(!response.ok)throw new Error('EPA service returned HTTP '+response.status);
      return response.json();
    }).then(function(value){
      if(value.error)throw new Error(value.error.message||'EPA service error');
      return value;
    });
  }
  function normalizeFeature(feature){
    var a=feature.attributes||{};
    var lat=Number(a.fac_lat),lon=Number(a.fac_long),id=String(a.registry_id||'');
    if(!id || !Number.isFinite(lat) || !Number.isFinite(lon) ||
       lat<32.55||lat>33.35||lon< -97.55||lon> -96.40)return null;
    return {
      registry_id:id,facility_name:a.fac_name||'Unnamed facility',
      street:a.fac_street||'',city:a.fac_city||'',state:a.fac_state||'',zip:a.fac_zip||'',
      county:a.fac_county||'',latitude:lat,longitude:lon,
      tri_flag:a.tri_flag||'',air_flag:a.air_flag||'',npdes_flag:a.npdes_flag||'',
      rcra_flag:a.rcra_flag||'',active_flag:a.fac_active_flag||'',
      compliance_status:a.fac_compliance_status||'',
      coordinate_accuracy_meters:a.fac_accuracy_meters==null?'':String(a.fac_accuracy_meters),
      last_inspection:a.fac_date_last_inspection ? new Date(a.fac_date_last_inspection).toISOString().slice(0,10) : '',
      epa_report_url:'https://echo.epa.gov/detailed-facility-report?fid='+encodeURIComponent(id)
    };
  }
  function loadAll(){
    var year=$('#inspection-year').val();
    if(allRecords && loadedYear===year){records=allRecords; updateCities();render();fit();return;}
    var ticket=++querySequence;
    var yearWhere="fac_date_last_inspection >= DATE '"+year+"-01-01' AND fac_date_last_inspection < DATE '"+(Number(year)+1)+"-01-01'";
    $('#count').text('Checking EPA records for latest inspection year '+year+'…');
    loadPromise=epaFetch({where:yearWhere,returnCountOnly:'true'}).then(function(result){
      allTotal=result.count;
      if(!Number.isSafeInteger(allTotal)||allTotal<0)throw new Error('Invalid EPA record total');
      if(allTotal===0){allRecords=[];loadedYear=year;return;}
      var pageCount=Math.ceil(allTotal/PAGE_SIZE);
      var pages=new Array(pageCount), next=0,completed=0;
      var workers=Array.from({length:Math.min(4,pageCount)},function(){
        return (async function(){
          while(next<pageCount){
            var idx=next++;
            var data=await epaFetch({
              where:yearWhere,outFields:wantedFields,returnGeometry:'false',
              orderByFields:'OBJECTID ASC',resultRecordCount:String(PAGE_SIZE),
              resultOffset:String(idx*PAGE_SIZE)
            });
            var expected=Math.min(PAGE_SIZE,allTotal-idx*PAGE_SIZE);
            if(!Array.isArray(data.features)||data.features.length!==expected){
              throw new Error('Incomplete EPA page '+(idx+1)+' (expected '+expected+', got '+(data.features||[]).length+')');
            }
            pages[idx]=data.features;
            completed++;
            if(allMode&&ticket===querySequence)
              $('#count').text('Loading '+year+' latest-inspection cohort: '+completed+' / '+pageCount+' data pages ('+allTotal.toLocaleString('en-US')+' records)…');
          }
        })();
      });
      return Promise.all(workers).then(function(){
        var seen=new Set(),valid=[],bad=0;
        pages.forEach(function(page){
          page.forEach(function(f){
            var r=normalizeFeature(f);
            if(!r||seen.has(r.registry_id)){bad++;return;}
            seen.add(r.registry_id);
            valid.push(r);
          });
        });
        if(bad || valid.length!==allTotal) {
          throw new Error('EPA record validation mismatch: '+valid.length+' unique valid of '+allTotal+' returned; '+bad+' invalid/duplicate');
        }
        allRecords=valid;
        loadedYear=year;
      });
    }).then(function(){
      loadPromise=null;
      if(!allMode || $('#inspection-year').val()!==year)return;
      records=allRecords;
      updateCities();
      // All-ECHO overview defaults to a complete counts grid, not tens of thousands of overlapping markers.
      $('#grid-toggle').prop('checked',records.length>maxMarkers);
      render();
      map.setView([32.93,-96.98],9);
    }).catch(function(e){
      loadPromise=null;
      if(!allMode || $('#inspection-year').val()!==year)return;
      records=[];
      markerLayer.clearLayers();
      gridLayer.clearLayers();
      $('#count').text('EPA inspection-year records could not be loaded completely: '+e.message+'. Switch datasets and try again.');
    });
  }
  function updateCities(){
    var prior=$city.val();
    var cities=Array.from(new Set(records.map(function(r){return r.city;}))).filter(Boolean).sort();
    $city.empty().append($('<option>').val('').text('All cities'));
    cities.forEach(function(c){$city.append($('<option>').val(c).text(c));});
    $city.val(cities.indexOf(prior)>=0?prior:'');
  }
  function changeScope(){
    allMode=$('#dataset-mode').val()==='all';
    ++querySequence;
    $search.val('');$city.val('');$program.val('');$status.val('');
    $('#accuracy-filter').prop('checked',false);
    $('#all-mode-notice').prop('hidden',!allMode);
    $('#inspection-year-wrap').prop('hidden',!allMode);
    $('#accuracy-explanation').text(allMode
      ? 'Only include records whose EPA-reported location accuracy is 100 m or better. This reduces the current year cohort, not pollution or violation levels.'
      : 'Only include locations with EPA-reported accuracy of 100 m or better. In this 300-record TRI snapshot, 52 records are excluded (248 remain before other filters).');
    $('#scope-description').text(allMode
      ? 'Records whose latest EPA-reported inspection occurred in '+$('#inspection-year').val()+'. This is not a count of inspections or operating facilities in that year.'
      : '300 TRI-associated facility records in the study rectangle, retrieved November 26, 2026. This is not an emissions inventory.');
    $('#analysis-scope').text(allMode
      ? 'Summary counts include all matching facilities whose latest recorded inspection was in the selected year—not all facilities active or inspected that year.'
      : 'This TRI-associated snapshot includes records within the defined study rectangle. Counts are not pollution, exposure, or population-adjusted measures.');
    if(allMode){records=[];markerLayer.clearLayers();gridLayer.clearLayers();loadAll();}
    else {records=triRecords;updateCities();$('#grid-toggle').prop('checked',false);render();fit();}
  }
  $('#dataset-mode').on('change',changeScope);
  $('#inspection-year').on('change',function(){
    allRecords=null;loadedYear=null;
    records=[];markerLayer.clearLayers();gridLayer.clearLayers();
    $search.val('');$city.val('');$program.val('');$status.val('');
    $('#accuracy-filter').prop('checked',false);
    $('#scope-description').text('Records whose latest EPA-reported inspection occurred in '+$('#inspection-year').val()+'. This is not a count of all inspections that year.');
    loadAll();
  });

  $('#grid-toggle').on('change',function(){updateGrid(filtered());});

  $('#search').on('input',render);
  $('#city,#program,#status,#accuracy-filter').on('change',render);
  $('#reset').on('click',function(){
    $search.val('');$city.val('');$program.val('');$status.val('');
    $('#accuracy-filter').prop('checked',false);
    render();fit();
  });
  $('#fit').on('click',function(){if(markerLayer.getLayers().length)fit();else map.setView([32.93,-96.98],9);});
  $.ajax({url:'data/dfw-epa-tri-facilities-complete.csv?v=20261126-full300-b',dataType:'text',cache:false})
    .done(load)
    .fail(function(){
      $('#count').text('Unable to load the EPA dataset.');
      $('#table-explainer').after($('<p class="error">').text('CSV data could not be fetched. Open the site using GitHub Pages or a local web server, not file://.'));
    });
})();
