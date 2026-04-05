import { precacheAndRoute } from 'workbox-precaching'

// Précaching Workbox (liste injectée par vite-plugin-pwa)
precacheAndRoute(self.__WB_MANIFEST)

// Réception d'une notification push depuis le backend
self.addEventListener('push', (event) => {
  if (!event.data) return
  const { titre, message, logo, pro_nom } = event.data.json()

  // Utiliser le logo du commerce si disponible, sinon l'icône de l'app
  const icon = logo || '/web-app-manifest-192x192.png'

  // Ajouter le nom du commerce au titre si disponible
  const titre_affiche = pro_nom ? `${pro_nom} — ${titre}` : titre

  event.waitUntil(
    self.registration.showNotification(titre_affiche, {
      body: message,
      icon: icon,
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
