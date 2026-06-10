import { config as loadEnv } from 'dotenv';
import { resolve } from 'node:path';
import type { NextConfig } from 'next';
import { serviceUrl } from './src/config/service-url';

loadEnv({ path: resolve(__dirname, '../config/.env') });

function requireConfigEnv(name: string): string {
    const value = process.env[name];
    if (!value) {
        throw new Error(`config/.env: falta la variable ${name}`);
    }
    return value;
}

const appHost = requireConfigEnv('APP_HOST');
const backendPort = requireConfigEnv('BACKEND_PORT');

const nextConfig: NextConfig = {
    reactCompiler: true,
    turbopack: {
        root: resolve(__dirname),
    },
    env: {
        NEXT_PUBLIC_API_URL: serviceUrl(appHost, backendPort),
    },
};

export default nextConfig;
