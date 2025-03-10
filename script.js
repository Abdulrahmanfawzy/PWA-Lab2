// Check if the browser supports Service Workers and Notifications
if ('serviceWorker' in navigator && 'Notification' in window) {
	// Register Service Worker
	navigator.serviceWorker
	  .register('sw.js')
	  .then((registration) => {
		console.log('Service Worker Registered:', registration);
  
		// Listen for updates to the service worker
		registration.onupdatefound = () => {
		  const newWorker = registration.installing;
		  newWorker.onstatechange = () => {
			if (newWorker.state === 'installed') {
			  console.log('New Service Worker installed! Reload to activate.');
			}
		  };
		};
	  })
	  .catch((error) => {
		console.error('Service Worker Registration Failed:', error);
	  });
  
	// Request Notification Permission
	Notification.requestPermission().then((permission) => {
	  if (permission === 'granted') {
		console.log('Permission is Granted for Notification');
	  } else {
		console.log('Permission is Denied for Notification');
	  }
	});
  } else {
	console.log('Service Workers or Notifications are not supported in this browser.');
  }
  
  let deferredPrompt; // Global variable to store beforeinstallprompt event
  
  // Show custom install button
  const id_btn_show_notification = document.getElementById('id_btn_show_notification');
  window.addEventListener('beforeinstallprompt', (event) => {
	event.preventDefault(); // Prevent automatic prompt
	deferredPrompt = event;
	id_btn_show_notification.style.display = 'block'; // Show custom install button
  });
  
  // Handle custom install button click
  id_btn_show_notification.addEventListener('click', () => {
	if (deferredPrompt) {
	  deferredPrompt.prompt(); // Show the install prompt
	  deferredPrompt.userChoice.then((choiceResult) => {
		if (choiceResult.outcome === 'accepted') {
		  console.log('User accepted PWA installation');
		} else {
		  console.log('User dismissed PWA installation');
		}
		id_btn_show_notification.style.display = 'none'; // Hide install button after prompt
		deferredPrompt = null; // Reset the deferredPrompt
	  });
	}
  });
  
  // Send Push Notification
  // eslint-disable-next-line no-unused-vars
  function sendNotification() {
	if (Notification.permission === 'granted' && 'serviceWorker' in navigator) {
	  navigator.serviceWorker.ready.then((registration) => {
		registration.showNotification('MEARN', {
		  body: 'Welcome from My First PWA',
		  icon: 'icons/icon-192x192.png',
		  badge: 'icons/icon-192x192.png',
		  vibrate: [200, 100, 200], // Vibration pattern
		  actions: [{ action: 'open_app', title: 'Open App' }],
		});
	  });
	} else {
	  console.log('Notification permission not granted or serviceWorker is not available.');
	}
  }
  