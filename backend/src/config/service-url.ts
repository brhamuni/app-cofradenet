export function serviceUrl(host: string, port: string | number): string {
    return `http://${host}:${port}`;
}
