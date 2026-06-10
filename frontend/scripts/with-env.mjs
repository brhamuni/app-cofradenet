import { spawn } from 'node:child_process';
import { createRequire } from 'node:module';
import { config } from 'dotenv';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const frontendDir = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const require = createRequire(import.meta.url);
const nextBin = require.resolve('next/dist/bin/next');

config({ path: resolve(frontendDir, '../config/.env') });

function requireVar(name) {
    const value = process.env[name];
    if (!value) {
        console.error(`Falta ${name} en config/.env`);
        process.exit(1);
    }
    return value;
}

if (!process.env.NEXT_PUBLIC_API_URL) {
    const host = requireVar('APP_HOST');
    const backendPort = requireVar('BACKEND_PORT');
    process.env.NEXT_PUBLIC_APP_HOST = host;
    process.env.NEXT_PUBLIC_BACKEND_PORT = backendPort;
    process.env.NEXT_PUBLIC_API_URL = `http://${host}:${backendPort}`;
}

const frontendPort = requireVar('FRONTEND_PORT');

const subcommand = process.argv[2] ?? 'dev';
const extraArgs = process.argv.slice(3);

const nextArgs =
    subcommand === 'dev' || subcommand === 'start'
        ? [subcommand, '-p', frontendPort, ...extraArgs]
        : [subcommand, ...extraArgs];

const child = spawn(process.execPath, [nextBin, ...nextArgs], {
    cwd: frontendDir,
    stdio: 'inherit',
    env: process.env,
});

child.on('exit', (code) => process.exit(code ?? 0));
