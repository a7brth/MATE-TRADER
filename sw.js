/* Mate Trader service worker — caches the app shell so it installs & works offline. */
var CACHE = "mate-trader-v1";
var ASSETS = [
  "./",
  "./index.html",
  "./manifest.webmanifest",
  "./icon-192.png",
  "./icon-512.png",
  "./icon-maskable.png"
];

self.addEventListener("install", function (e) {
  self.skipWaiting();
  e.waitUntil(
    caches.open(CACHE).then(function (c) {
      return c.addAll(ASSETS).catch(function () { /* ignore individual failures */ });
    })
  );
});

self.addEventListener("activate", function (e) {
  e.waitUntil(
    caches.keys().then(function (keys) {
      return Promise.all(keys.map(function (k) { if (k !== CACHE) return caches.delete(k); }));
    }).then(function () { return self.clients.claim(); })
  );
});

self.addEventListener("fetch", function (e) {
  var req = e.request;
  if (req.method !== "GET") return;
  var url = new URL(req.url);

  // Never cache Firebase / Google APIs — always go to network (needs live data)
  if (/gstatic\.com|googleapis\.com|firebaseio\.com|firebase|identitytoolkit|firestore/.test(url.href)) {
    return; // let the browser handle it normally
  }

  // App shell: network-first for the HTML (so updates arrive), cache fallback for offline.
  if (req.mode === "navigate" || url.pathname.endsWith("index.html") || url.pathname.endsWith("/")) {
    e.respondWith(
      fetch(req).then(function (resp) {
        var copy = resp.clone();
        caches.open(CACHE).then(function (c) { c.put("./index.html", copy); });
        return resp;
      }).catch(function () {
        return caches.match("./index.html").then(function (r) { return r || caches.match("./"); });
      })
    );
    return;
  }

  // Other same-origin assets: cache-first, then network.
  if (url.origin === self.location.origin) {
    e.respondWith(
      caches.match(req).then(function (cached) {
        return cached || fetch(req).then(function (resp) {
          var copy = resp.clone();
          caches.open(CACHE).then(function (c) { c.put(req, copy); });
          return resp;
        }).catch(function () { return cached; });
      })
    );
  }
});
