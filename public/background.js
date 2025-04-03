self.addEventListener('install', event => {
    console.log('JARVIS Background Service Installed');
    self.skipWaiting();
});

self.addEventListener('activate', event => {
    console.log('JARVIS Background Service Activated');
    return self.clients.claim();
});

self.addEventListener('fetch', event => {
    event.respondWith(fetch(event.request));
});

self.addEventListener('message', event => {
    if (event.data === 'keepAlive') {
        console.log('Keeping JARVIS alive in the background');
    }
});
