import CommerceApp from './app';
import './styles/main.scss';

const isLocalHost = window.location.hostname === 'localhost';

if ('serviceWorker' in navigator && !isLocalHost) {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/service-worker.js')
      .then((registration) => {
        console.log('SW registered: ', registration);
      })
      .catch((registrationError) => {
        console.log('SW registration failed: ', registrationError);
      });
  });
}

CommerceApp.start();
