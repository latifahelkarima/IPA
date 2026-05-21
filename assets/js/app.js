/**
 * app.js
 * Core application logic and initialization
 */

const App = {
  version: '1.0.0',
  components: {},
  data: {},

  init() {
    console.log('App initialization started...');
    this.initTheme();
    this.registerServiceWorker();
    this.loadComponents();
    
    // Dispatch event that app is ready
    document.dispatchEvent(new Event('app:ready'));
  },

  initTheme() {
    // Check saved theme or system preference
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme) {
      document.documentElement.setAttribute('data-theme', savedTheme);
    } else {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      document.documentElement.setAttribute('data-theme', prefersDark ? 'dark' : 'light');
    }
  },

  toggleTheme() {
    const currentTheme = document.documentElement.getAttribute('data-theme');
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
  },

  registerServiceWorker() {
    if ('serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker.register('/service-worker.js')
          .then(registration => {
            console.log('SW registered: ', registration);
          })
          .catch(registrationError => {
            console.log('SW registration failed: ', registrationError);
          });
      });
    }
  },

  async loadComponents() {
    // Dynamically load HTML components into elements with data-component attribute
    const elements = document.querySelectorAll('[data-component]');
    for (const el of elements) {
      const componentName = el.getAttribute('data-component');
      try {
        // Find depth for correct relative path
        const depth = window.location.pathname.split('/').length - 2;
        const prefix = depth > 0 ? '../'.repeat(depth) : './';
        const response = await fetch(`${prefix}components/${componentName}.html`);
        if (response.ok) {
          const html = await response.text();
          el.innerHTML = html;
          // Trigger event for component loaded
          el.dispatchEvent(new CustomEvent('component:loaded', { bubbles: true, detail: { name: componentName } }));
        }
      } catch (e) {
        console.error(`Failed to load component ${componentName}`, e);
      }
    }
  }
};

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', () => App.init());
