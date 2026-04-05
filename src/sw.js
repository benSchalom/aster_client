import { precacheAndRoute } from 'workbox-precaching'

// Précaching Workbox (liste injectée par vite-plugin-pwa)
precacheAndRoute(self.__WB_MANIFEST)

// Force l'activation immédiate du nouveau service worker sans attendre
self.addEventListener('install', () => self.skipWaiting())
self.addEventListener('activate', (event) => event.waitUntil(clients.claim()))

// Réception d'une notification push depuis le backend
self.addEventListener('push', (event) => {
  if (!event.data) return
  const { titre, message, logo, pro_nom } = event.data.json()

  // Utiliser le logo du commerce si disponible, sinon l'icône de l'app
  const icon = (logo && logo.startsWith('http')) ? logo : '/web-app-manifest-192x192.png'

  // Ajouter le nom du commerce au titre si disponible
  const titre_affiche = pro_nom ? `${pro_nom} — ${titre}` : titre

  // Tag basé sur le contenu : si la notif arrive en double, la 2e remplace la 1ère
  const tag = 'annonce-' + (pro_nom || '') + '-' + titre.slice(0, 20)

  event.waitUntil(
    self.registration.showNotification(titre_affiche, {
      body: message,
      icon: icon,
      badge: '/web-app-manifest-192x192.png',
      vibrate: [200, 100, 200],
      tag: tag,
      renotify: false,
    })
  )
})

// Clic sur la notification → ouvre le portail
self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  event.waitUntil(clients.openWindow('/cartes'))
})
