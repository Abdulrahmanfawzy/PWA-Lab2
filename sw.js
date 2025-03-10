const CACHE_NAME = "pwa-cache-v2";
const FILES_TO_CACHE = [
  "/",
  "/index.html",
  "/style.css",
  "/script.js",
  "/manifest.json",
  "/icons/icon-192x192.png",
  "/icons/icon-512x512.png",
  "/offline.html",
];

// Install event: Cache static assets and offline page
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(FILES_TO_CACHE);
    })
  );
});

// Activate event: Clean up old caches
self.addEventListener("activate", (event) => {
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (!cacheWhitelist.includes(cacheName)) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

// Fetch event: Serve offline page when offline and sync form data in the background
self.addEventListener("fetch", (event) => {
  if (event.request.url.includes("/static/")) {
    event.respondWith(
      caches.match(event.request).then((cachedResponse) => {
        return (
          cachedResponse ||
          fetch(event.request).then((response) => {
            return caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, response.clone());
              return response;
            });
          })
        );
      })
    );
  }

  // Handle API requests for form submission or other requests
  else if (event.request.method === "POST") {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          return response;
        })
        .catch(() => {
          // Save POST requests for sync when back online
          event.waitUntil(saveRequestForSync(event.request));
          return caches.match("/offline.html");
        })
    );
  }

  // If no network, serve offline page for any other requests
  else {
    event.respondWith(
      fetch(event.request).catch(() => {
        return caches.match("/offline.html");
      })
    );
  }
});

// Background Sync: Save user data while offline and sync when back online
async function saveRequestForSync(request) {
  const cloneRequest = request.clone();
  const body = await cloneRequest.json();

  // Store the data in IndexedDB for later submission
  const db = await openIndexedDB();
  const transaction = db.transaction("formSubmissions", "readwrite");
  const store = transaction.objectStore("formSubmissions");
  store.put(body);

  // Register a sync event to send data when the network is available
  self.registration.sync.register("syncFormData");
}

// IndexedDB for storing form submissions while offline
function openIndexedDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open("PWA", 1);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);

    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains("formSubmissions")) {
        db.createObjectStore("formSubmissions", { autoIncrement: true });
      }
    };
  });
}

// Background sync event handler: Sync the stored form data
self.addEventListener("sync", (event) => {
  if (event.tag === "syncFormData") {
    event.waitUntil(syncFormData());
  }
});

// Sync form data by sending it to the server
async function syncFormData() {
  const db = await openIndexedDB();
  const transaction = db.transaction("formSubmissions", "readonly");
  const store = transaction.objectStore("formSubmissions");
  const allRequests = await store.getAll();

  allRequests.forEach(async (request) => {
    // Send the stored form data to the server
    try {
      await fetch("/api/submit", {
        method: "POST",
        body: JSON.stringify(request),
        headers: { "Content-Type": "application/json" },
      });
      // Remove the request from IndexedDB after successful sync
      store.delete(request.id);
    } catch (error) {
      console.error("Error syncing form data", error);
    }
  });
}
