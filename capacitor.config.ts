import type { CapacitorConfig } from '@capacitor/cli';
const config: CapacitorConfig = {
  appId: 'com.base6a92d4567d7a3a8b4ec54b7b.app',
  appName: 'SiteLens Pro',
  webDir: 'dist',
  server: {
  url: 'https://app.sitelens-pro.com',
  cleartext: false
},  
  ios: { contentInset: 'automatic' },
};
export default config;
