export function parseJwtPayload<T = Record<string, unknown>>(token: string): T | null {
    try {
        const base64 = token.split('.')[1];
        if (!base64) return null;
        const json = atob(base64.replace(/-/g, '+').replace(/_/g, '/'));
        return JSON.parse(json) as T;
    } catch {
        return null;
    }
}

export function parseTokenFromStorage(): { id: number; rol: string } | null {
    if (typeof window === 'undefined') return null;
    const token = localStorage.getItem('token');
    if (!token) return null;
    return parseJwtPayload<{ id: number; rol: string }>(token);
}
