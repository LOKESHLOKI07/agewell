import { colors } from '@/constants/theme';

/** Offline-first CDN + Carto streets. No Google Maps key required. */
export const LEAFLET_MAP_HTML = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" />
  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
  <style>
    html, body, #map { margin: 0; width: 100%; height: 100%; background: #e8eaed; }
    .aw-place {
      min-width: 52px; height: 28px; padding: 0 8px; border-radius: 14px;
      background: #fff; border: 2px solid ${colors.accent};
      box-shadow: 0 2px 8px rgba(28,31,51,0.2);
      display: flex; align-items: center; justify-content: center;
      font: 600 11px/12px system-ui, sans-serif; color: #1C1F33;
    }
    .aw-place.senior { border-color: ${colors.safe}; }
    .aw-vehicle-wrap { width: 44px; height: 44px; position: relative; }
    .aw-vehicle-pulse {
      position: absolute; inset: 0; border-radius: 22px;
      background: ${colors.primary}; opacity: 0.35;
      animation: aw-pulse 1.6s ease-out infinite;
    }
    .aw-vehicle {
      width: 36px; height: 36px; margin: 4px; border-radius: 18px;
      background: ${colors.primary}; border: 3px solid #fff;
      box-shadow: 0 4px 12px rgba(28,31,51,0.25);
      display: flex; align-items: center; justify-content: center;
    }
    .aw-vehicle-nose {
      width: 0; height: 0;
      border-left: 6px solid transparent;
      border-right: 6px solid transparent;
      border-bottom: 14px solid #fff;
      margin-top: -4px;
    }
    @keyframes aw-pulse {
      from { transform: scale(0.7); opacity: 0.45; }
      to { transform: scale(1.7); opacity: 0; }
    }
  </style>
</head>
<body>
  <div id="map"></div>
  <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
  <script>
    function post(msg) {
      if (window.ReactNativeWebView) window.ReactNativeWebView.postMessage(msg);
    }
    var map, vehicle, home, senior, traveled, remaining, didFit = false, follow = 'follow', lastFitToken = 0;
    function ll(p) { return [p.latitude, p.longitude]; }
    function placeIcon(kind) {
      var label = kind === 'home' ? 'Home' : 'Senior';
      var cls = kind === 'home' ? 'aw-place' : 'aw-place senior';
      return L.divIcon({ className: '', html: '<div class="' + cls + '">' + label + '</div>', iconSize: [56, 28], iconAnchor: [28, 28] });
    }
    function vehicleIcon(heading, live) {
      return L.divIcon({
        className: '',
        html: '<div class="aw-vehicle-wrap">' + (live ? '<div class="aw-vehicle-pulse"></div>' : '') +
          '<div class="aw-vehicle" style="transform:rotate(' + heading + 'deg)"><div class="aw-vehicle-nose"></div></div></div>',
        iconSize: [44, 44],
        iconAnchor: [22, 22]
      });
    }
    window.applyAgeWellMap = function (s) {
      if (!map || !s) return;
      follow = s.followMode || 'follow';
      if (s.home) {
        if (!home) home = L.marker(ll(s.home), { icon: placeIcon('home') }).addTo(map);
        else home.setLatLng(ll(s.home));
      }
      if (s.senior) {
        if (!senior) senior = L.marker(ll(s.senior), { icon: placeIcon('senior'), zIndexOffset: 400 }).addTo(map);
        else senior.setLatLng(ll(s.senior));
      }
      if (s.associate) {
        var ic = vehicleIcon(s.heading || 0, !!s.live);
        if (!vehicle) vehicle = L.marker(ll(s.associate), { icon: ic, zIndexOffset: 600 }).addTo(map);
        else { vehicle.setLatLng(ll(s.associate)); vehicle.setIcon(ic); }
      }
      var t = (s.traveledPath || []).map(ll);
      var r = (s.remainingPath || []).map(ll);
      if (!traveled) traveled = L.polyline(t, { color: '${colors.primary}', weight: 5, opacity: 0.95 }).addTo(map);
      else traveled.setLatLngs(t);
      if (!remaining) remaining = L.polyline(r, { color: '#C5C9D6', weight: 5, dashArray: '8 8', opacity: 0.95 }).addTo(map);
      else remaining.setLatLngs(r);
      var bounds = [];
      if (s.associate) bounds.push(ll(s.associate));
      if (s.senior) bounds.push(ll(s.senior));
      if (s.home) bounds.push(ll(s.home));
      if ((!didFit || (s.fitToken && s.fitToken !== lastFitToken)) && bounds.length) {
        didFit = true;
        lastFitToken = s.fitToken || lastFitToken;
        if (bounds.length > 1) map.fitBounds(bounds, { padding: [48, 48] });
        else map.setView(bounds[0], 16);
      } else if (s.associate && follow === 'follow') {
        map.panTo(ll(s.associate), { animate: true, duration: 0.4 });
      } else if (s.senior && follow === 'follow' && !s.associate) {
        map.panTo(ll(s.senior), { animate: true, duration: 0.4 });
      }
    };
    function start() {
      if (!window.L) { post('error'); return; }
      map = L.map('map', { zoomControl: false, attributionControl: true, zoom: 15, center: [20.5937, 78.9629] });
      L.tileLayer('https://a.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap &copy; CARTO',
        maxZoom: 20
      }).addTo(map);
      map.on('dragstart', function () { post('gesture'); });
      map.whenReady(function () { post('ready'); });
      setTimeout(function () { map.invalidateSize(); }, 80);
    }
    start();
  </script>
</body>
</html>`;
