import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

// Check if the browser supports Service Workers
if ('serviceWorker' in navigator) {
	navigator.serviceWorker
		.register('/sw.js')
		.then((registration) => {
			console.log('Service Worker Registered: ', registration);
		})
		.catch((error) => {
			console.log('Service Worker Registration Failed: ', error);
		});
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
