'use strict';
const MANIFEST = 'flutter-app-manifest';
const TEMP = 'flutter-temp-cache';
const CACHE_NAME = 'flutter-app-cache';
const RESOURCES = {
  "assets/AssetManifest.json": "6d3fb33e3e0d5c1e59c58c4311b06092",
"assets/assets/fuentes/FredokaOne-Regular.ttf": "4a2f2ea45a0bb1abe81b47d0afde4aae",
"assets/assets/fuentes/ReemKufi-Regular.ttf": "2e981d24acae70b64ca4bd957c21819b",
"assets/assets/fuentes/TitanOne-Regular.ttf": "cbb4d15b35ec11cb0638570c275fdf9d",
"assets/assets/globos.jpg": "56e526c423be725e20d97e471ea2a429",
"assets/assets/iglesia.jpg": "1cfeb925ad9c669cc7a3124ef6ea7291",
"assets/assets/ImagenApp/BannerInicio.jpg": "85ac94f8a49824f495dc9313785080a0",
"assets/assets/ImagenApp/ImagenApp1.jpg": "85ac94f8a49824f495dc9313785080a0",
"assets/assets/ImagenApp/logosinfondo.jpg": "486c381296285b53c2e643407984a42a",
"assets/assets/ImagenApp/rosario.png": "2dbf33800a94cc4ad9869031cf521a85",
"assets/assets/imagenGrupos/PJ.jpeg": "39806b4b4267925e8f2c8347e2c90de4",
"assets/assets/logo.png": "2fbc477d806b81f9fee756dd9808d443",
"assets/assets/logoAplicacion.png": "991391b339f6d5a1192da977d987649a",
"assets/assets/pastel.jpg": "87df8e715218211214db84a19d4d6935",
"assets/assets/paz.jpg": "5738563290e76113dd6895ee50cf6ce5",
"assets/assets/publicaciones/1.jpg": "1cfeb925ad9c669cc7a3124ef6ea7291",
"assets/assets/publicaciones/2.jpg": "336d3ca4a954fdbb41870d7c36e26ad2",
"assets/assets/steve2.jpg": "70d9bb66803e5d8fa05f0224897dac5e",
"assets/assets/steveCumple.jpg": "a2388df374d051c5f6752db5d56d63d6",
"assets/FontManifest.json": "6bb46d326532b9c834310fec2e216d48",
"assets/fonts/MaterialIcons-Regular.otf": "1288c9e28052e028aba623321f7826ac",
"assets/NOTICES": "4b206514be23b09fed754adb05e05e40",
"assets/packages/cupertino_icons/assets/CupertinoIcons.ttf": "115e937bb829a890521f72d2e664b632",
"favicon.png": "8f1d26cf1b93bf71af198365819d1884",
"icons/Icon-192.png": "0ddcdcc872f742d276813f855e0d07d3",
"icons/Icon-512.png": "805896c266a78b4c3ca4cfc6dc35b21e",
"index.html": "b58c3f7e5ca63e89b0d2f034da89d1a1",
"/": "b58c3f7e5ca63e89b0d2f034da89d1a1",
"main.dart.js": "12337d3cd0babb747b4958239f6df355",
"manifest.json": "7db4d5376322356caab0329e7b44f78f",
"version.json": "deb7db0b854011cd7f8725964d3eb166"
};

// The application shell files that are downloaded before a service worker can
// start.
const CORE = [
  "/",
"main.dart.js",
"index.html",
"assets/NOTICES",
"assets/AssetManifest.json",
"assets/FontManifest.json"];
// During install, the TEMP cache is populated with the application shell files.
self.addEventListener("install", (event) => {
  self.skipWaiting();
  return event.waitUntil(
    caches.open(TEMP).then((cache) => {
      return cache.addAll(
        CORE.map((value) => new Request(value + '?revision=' + RESOURCES[value], {'cache': 'reload'})));
    })
  );
});

// During activate, the cache is populated with the temp files downloaded in
// install. If this service worker is upgrading from one with a saved
// MANIFEST, then use this to retain unchanged resource files.
self.addEventListener("activate", function(event) {
  return event.waitUntil(async function() {
    try {
      var contentCache = await caches.open(CACHE_NAME);
      var tempCache = await caches.open(TEMP);
      var manifestCache = await caches.open(MANIFEST);
      var manifest = await manifestCache.match('manifest');
      // When there is no prior manifest, clear the entire cache.
      if (!manifest) {
        await caches.delete(CACHE_NAME);
        contentCache = await caches.open(CACHE_NAME);
        for (var request of await tempCache.keys()) {
          var response = await tempCache.match(request);
          await contentCache.put(request, response);
        }
        await caches.delete(TEMP);
        // Save the manifest to make future upgrades efficient.
        await manifestCache.put('manifest', new Response(JSON.stringify(RESOURCES)));
        return;
      }
      var oldManifest = await manifest.json();
      var origin = self.location.origin;
      for (var request of await contentCache.keys()) {
        var key = request.url.substring(origin.length + 1);
        if (key == "") {
          key = "/";
        }
        // If a resource from the old manifest is not in the new cache, or if
        // the MD5 sum has changed, delete it. Otherwise the resource is left
        // in the cache and can be reused by the new service worker.
        if (!RESOURCES[key] || RESOURCES[key] != oldManifest[key]) {
          await contentCache.delete(request);
        }
      }
      // Populate the cache with the app shell TEMP files, potentially overwriting
      // cache files preserved above.
      for (var request of await tempCache.keys()) {
        var response = await tempCache.match(request);
        await contentCache.put(request, response);
      }
      await caches.delete(TEMP);
      // Save the manifest to make future upgrades efficient.
      await manifestCache.put('manifest', new Response(JSON.stringify(RESOURCES)));
      return;
    } catch (err) {
      // On an unhandled exception the state of the cache cannot be guaranteed.
      console.error('Failed to upgrade service worker: ' + err);
      await caches.delete(CACHE_NAME);
      await caches.delete(TEMP);
      await caches.delete(MANIFEST);
    }
  }());
});

// The fetch handler redirects requests for RESOURCE files to the service
// worker cache.
self.addEventListener("fetch", (event) => {
  if (event.request.method !== 'GET') {
    return;
  }
  var origin = self.location.origin;
  var key = event.request.url.substring(origin.length + 1);
  // Redirect URLs to the index.html
  if (key.indexOf('?v=') != -1) {
    key = key.split('?v=')[0];
  }
  if (event.request.url == origin || event.request.url.startsWith(origin + '/#') || key == '') {
    key = '/';
  }
  // If the URL is not the RESOURCE list then return to signal that the
  // browser should take over.
  if (!RESOURCES[key]) {
    return;
  }
  // If the URL is the index.html, perform an online-first request.
  if (key == '/') {
    return onlineFirst(event);
  }
  event.respondWith(caches.open(CACHE_NAME)
    .then((cache) =>  {
      return cache.match(event.request).then((response) => {
        // Either respond with the cached resource, or perform a fetch and
        // lazily populate the cache.
        return response || fetch(event.request).then((response) => {
          cache.put(event.request, response.clone());
          return response;
        });
      })
    })
  );
});

self.addEventListener('message', (event) => {
  // SkipWaiting can be used to immediately activate a waiting service worker.
  // This will also require a page refresh triggered by the main worker.
  if (event.data === 'skipWaiting') {
    self.skipWaiting();
    return;
  }
  if (event.data === 'downloadOffline') {
    downloadOffline();
    return;
  }
});

// Download offline will check the RESOURCES for all files not in the cache
// and populate them.
async function downloadOffline() {
  var resources = [];
  var contentCache = await caches.open(CACHE_NAME);
  var currentContent = {};
  for (var request of await contentCache.keys()) {
    var key = request.url.substring(origin.length + 1);
    if (key == "") {
      key = "/";
    }
    currentContent[key] = true;
  }
  for (var resourceKey in Object.keys(RESOURCES)) {
    if (!currentContent[resourceKey]) {
      resources.push(resourceKey);
    }
  }
  return contentCache.addAll(resources);
}

// Attempt to download the resource online before falling back to
// the offline cache.
function onlineFirst(event) {
  return event.respondWith(
    fetch(event.request).then((response) => {
      return caches.open(CACHE_NAME).then((cache) => {
        cache.put(event.request, response.clone());
        return response;
      });
    }).catch((error) => {
      return caches.open(CACHE_NAME).then((cache) => {
        return cache.match(event.request).then((response) => {
          if (response != null) {
            return response;
          }
          throw error;
        });
      });
    })
  );
}
