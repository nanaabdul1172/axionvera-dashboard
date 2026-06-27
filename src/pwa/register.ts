export type SWRegistrationConfig = {
  onSuccess?: (registration: ServiceWorkerRegistration) => void;
  onUpdate?: (registration: ServiceWorkerRegistration) => void;
};

/**
 * Registers the service worker to enable offline support and caching.
 */
export function register(config?: SWRegistrationConfig) {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
    return;
  }

  // Next.js hot module replacement can trigger multiple loads, register safely
  const registerSW = () => {
    const swUrl = '/sw.js';

    navigator.serviceWorker
      .register(swUrl)
      .then((registration) => {
        // Check for updates on register
        if (registration.waiting) {
          if (config && config.onUpdate) {
            config.onUpdate(registration);
          }
        }

        registration.onupdatefound = () => {
          const installingWorker = registration.installing;
          if (!installingWorker) {
            return;
          }

          installingWorker.onstatechange = () => {
            if (installingWorker.state === 'installed') {
              if (navigator.serviceWorker.controller) {
                // New content is pre-cached, old worker still controls page
                console.log('[PWA] New version is available and ready to activate.');
                if (config && config.onUpdate) {
                  config.onUpdate(registration);
                }
              } else {
                // Initial content is cached
                console.log('[PWA] Content cached successfully for offline use.');
                if (config && config.onSuccess) {
                  config.onSuccess(registration);
                }
              }
            }
          };
        };
      })
      .catch((error) => {
        console.error('[PWA] Service worker registration failed:', error);
      });
  };

  if (document.readyState === 'complete') {
    registerSW();
  } else {
    window.addEventListener('load', registerSW);
  }
}

/**
 * Sends SKIP_WAITING to the waiting service worker to force activate it,
 * then reloads the page to load fresh assets.
 */
export function activateWaitingWorker(registration: ServiceWorkerRegistration) {
  const waitingWorker = registration.waiting;
  if (!waitingWorker) {
    return;
  }

  // Create channel or send message
  waitingWorker.postMessage({ type: 'SKIP_WAITING' });
  
  // Reload all tabs controlled by this service worker
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    window.location.reload();
  });
}

/**
 * Unregisters any active service workers.
 */
export function unregister() {
  if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
    navigator.serviceWorker.ready
      .then((registration) => {
        registration.unregister();
      })
      .catch((error) => {
        console.error('[PWA] Service worker unregistration failed:', error);
      });
  }
}
