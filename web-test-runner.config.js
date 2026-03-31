import { playwrightLauncher } from '@web/test-runner-playwright';

export default {
  files: 'src/components/**/*.test.js',
  nodeResolve: true,
  browsers: [
    playwrightLauncher({ product: 'chromium' }),
  ],
};
