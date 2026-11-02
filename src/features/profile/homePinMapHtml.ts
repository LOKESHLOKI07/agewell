/** Leaflet map for Zepto-style center pin; parent listens to user moveend center. */
export const HOME_PIN_MAP_HTML = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" />
  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
  <style>
    html, body, #map { margin: 0; width: 100%; height: 100%; background: #e8eaed; }
  </style>
</head>
<body>
  <div id="map"></div>
  <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
  <script>
    (function () {
      var ignoreProgrammatic = false;
      var map = L.map('map', {
        zoomControl: false,
        attributionControl: false,
      }).setView([19.0760, 72.8777], 16);
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
      }).addTo(map);
      L.control.zoom({ position: 'bottomright' }).addTo(map);

      function post(payload) {
        var raw = JSON.stringify(payload);
        if (window.ReactNativeWebView && window.ReactNativeWebView.postMessage) {
          window.ReactNativeWebView.postMessage(raw);
        } else if (window.parent && window.parent !== window) {
          window.parent.postMessage(raw, '*');
        }
      }

      function postCenter(reason) {
        var c = map.getCenter();
        post({ type: 'center', lat: c.lat, lng: c.lng, reason: reason || 'move' });
      }

      map.on('dragstart', function () {
        post({ type: 'user-drag' });
      });
      map.on('moveend', function () {
        if (ignoreProgrammatic) {
          ignoreProgrammatic = false;
          postCenter('programmatic');
          return;
        }
        postCenter('user');
      });
      map.whenReady(function () {
        post({ type: 'ready' });
        postCenter('ready');
      });

      window.setHomePin = function (lat, lng, zoom) {
        if (!Number.isFinite(lat) || !Number.isFinite(lng)) return;
        ignoreProgrammatic = true;
        map.setView([lat, lng], zoom || Math.max(map.getZoom(), 17), { animate: true });
      };
    })();
  </script>
</body>
</html>`;
