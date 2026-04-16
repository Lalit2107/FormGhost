import { defineConfig } from 'wxt';

// See https://wxt.dev/api/config.html
export default defineConfig({
  modules: ['@wxt-dev/module-react'],
  manifest: {
    name: 'FormGhost',
    description: 'AI-powered intelligent form auto-filler',
    version: '0.1.0',
    permissions: ['activeTab', 'storage', 'contextMenus', 'scripting'],
    host_permissions: ['<all_urls>'],
  },
});
