import { config as loadEnv } from 'dotenv';
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import type { NextConfig } from 'next';
import { serviceUrl } from './src/config/service-url';

const envPath = resolve(__dirname, '../config/.env');
if (existsSync(envPath)) {
    loadEnv({ path: envPath });
}

function resolvePublicApiUrl(): string | undefined {
    if (process.env.NEXT_PUBLIC_API_URL) {
        return process.env.NEXT_PUBLIC_API_URL;
    }

    const host = process.env.APP_HOST;
    const port = process.env.BACKEND_PORT;
    if (host && port) {
        return serviceUrl(host, port);
    }

    return undefined;
}

const publicApiUrl = resolvePublicApiUrl();

const nextConfig: NextConfig = {
    reactCompiler: true,
    turbopack: {
        root: resolve(__dirname),
    },
    ...(publicApiUrl
        ? { env: { NEXT_PUBLIC_API_URL: publicApiUrl } }
        : {}),
};

export default nextConfig;
