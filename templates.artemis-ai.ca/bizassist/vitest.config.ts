import { defineConfig } from 'vitest/config';
import tsconfigPaths from 'vite-tsconfig-paths';

export default defineConfig({
  plugins: [tsconfigPaths()],
  test: {
    globals: true,
    environment: 'node', // For backend testing
    setupFiles: ['./vitest.setup.ts'], // Path to global setup file
    include: ['src/**/*.test.ts'], // Include test files from anywhere in src
    coverage: { // Optional: configure coverage
      provider: 'v8', // or 'istanbul'
      reporter: ['text', 'json', 'html'],
      reportsDirectory: './coverage'
    },
    // To allow mocking of ES Modules (like 'ollama')
    // server: {
    //   deps: {
    //     inline: [/^(?!.*vitest).*$/], // This might be too broad, adjust if needed
    //   },
    // },
    // Vitest 1.x specific for ESM mocking, may need adjustment for Vitest 2.x
    // If issues with ESM mocking persist, specific `vi.mock` for 'ollama' in test files might be needed.
    deps: {
        optimizer: {
            web: {
                // This might be needed if 'ollama' or other deps are pure ESM
                // include: ['ollama'] 
            }
        }
    }
  },
});
