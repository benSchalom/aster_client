import { precacheAndRoute } from 'workbox-precaching'

// Précaching Workbox (liste injectée par vite-plugin-pwa)
precacheAndRoute(self.__WB_MANIFEST)

// Réception d'une notification push depuis le backend
self.addEventListener('push', (event) => {
  if (!event.data) return
  const { titre, message } = event.data.json()
  event.waitUntil(
    self.registration.showNotification(titre, {
      body: message,
      icon: '/web-app-manifest-192x192.png',
      badge: '/web-app-manifest-192x192.png',
      vibrate: [200, 100, 200],
    })
  )
})

// Clic sur la notification → ouvre le portail
self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  event.waitUntil(clients.openWindow('/cartes'))
})
