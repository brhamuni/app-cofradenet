import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { ConfigService } from '@nestjs/config';
import { serviceUrl } from './service-url';

export function resolveEnvFilePaths(): string[] {
    const candidates = [
        join(process.cwd(), 'config', '.env'),
        join(process.cwd(), '..', 'config', '.env'),
        join(__dirname, '..', '..', '..', 'config', '.env'),
    ];
    return candidates.filter((p) => existsSync(p));
}

export function getListenPort(config: ConfigService): number {
    const fromPlatform = process.env.PORT;
    if (fromPlatform) return parseInt(fromPlatform, 10);
    return parseInt(config.getOrThrow<string>('BACKEND_PORT'), 10);
}

export function getCorsOrigin(
    config: ConfigService,
): string | string[] | boolean {
    const frontendUrl = config.get<string>('FRONTEND_URL');
    if (frontendUrl) return frontendUrl;

    const extra = config.get<string>('CORS_ORIGINS');
    if (extra) {
        return extra.split(',').map((o) => o.trim()).filter(Boolean);
    }

    const host = config.get<string>('APP_HOST');
    const port = config.get<string>('FRONTEND_PORT');
    if (host && port) return serviceUrl(host, port);

    return false;
}
