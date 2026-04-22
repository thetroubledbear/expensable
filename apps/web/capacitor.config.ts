import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.expensable.app',
  appName: 'Expensable',
  webDir: 'out',
  server: {
    url: 'https://expensable-web.vercel.app',
    cleartext: false,
  },
};

export default config;
