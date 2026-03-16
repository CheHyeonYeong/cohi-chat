import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
    plugins: [react()],
    resolve: {
        alias: {
            '~': path.resolve(__dirname, 'src'),
        },
    },
    test: {
        globals: true,
        environment: 'happy-dom',
        setupFiles: ['./src/test/setup.ts'],
        include: ['src/**/*.test.{ts,tsx}'],
        server: {
            deps: {
                inline: ['random-korean-nickname'],
            },
        },
        coverage: {
            provider: 'istanbul',
            reporter: ['text', 'html', 'lcov'],
            reportsDirectory: './coverage',
            exclude: [
                '**/node_modules/**',
                '**/test/**',
                '**/*.test.{ts,tsx}',
                '**/index.ts',
                '**/types/**',
                '**/types.ts',
                '**/*.d.ts',
                '**/vite-env.d.ts',
                '**/routeTree.gen.ts',
                '**/main.tsx',
            ],
            thresholds: {
                statements: 50,
                branches: 50,
                functions: 50,
                lines: 50,
            },
        },
    },
});
