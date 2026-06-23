import { serviceUrl } from '@/config/service-url';

function resolveApiUrl(): string {
    const direct = process.env.NEXT_PUBLIC_API_URL;
    if (direct) return direct;

    const host = process.env.NEXT_PUBLIC_APP_HOST;
    const port = process.env.NEXT_PUBLIC_BACKEND_PORT;
    if (host && port) return serviceUrl(host, port);

    throw new Error(
        'NEXT_PUBLIC_API_URL no está definida. Arranca el frontend con: npm run dev',
    );
}

export const API = resolveApiUrl();

export function resolveImg(src: string | null | undefined): string | undefined {
    if (!src) return undefined;
    if (src.startsWith('http')) return src;
    return `${API}/${src}`;
}
