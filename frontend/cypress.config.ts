import { defineConfig } from 'cypress';
import codeCoverageTask from '@cypress/code-coverage/task';

export default defineConfig({
  e2e: {
    // supportFile: false,
    baseUrl: `http://localhost:${process.env.PORT || '3000'}${process.env.NEXT_PUBLIC_BASEPATH || ''}`,
    env: {
      apiUrl: `${process.env.NEXT_PUBLIC_API_URL}`,
      // IMPORTANT
      // The value below is a test email
      mockEmail: 'mail@example.com',
      // The value below is a test phone number from Post- och telestyrelsen, it is not a real phone number
      mockPhoneNumber: '0701740635',
    },
    video: false,
    screenshotOnRunFailure: false,
    chromeWebSecurity: false,
    defaultCommandTimeout: 10000,
    setupNodeEvents(on, config) {
      codeCoverageTask(on, config);
      // It's IMPORTANT to return the config object
      // with any changed environment variables
      return config;
    },
  },

  component: {
    devServer: {
      framework: 'next',
      bundler: 'webpack',
    },
    chromeWebSecurity: false,
    setupNodeEvents(on, config) {
      codeCoverageTask(on, config);
      // It's IMPORTANT to return the config object
      // with any changed environment variables
      return config;
    },
  },
});
