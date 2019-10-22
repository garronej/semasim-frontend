export declare function buildUrl<T extends Record<string, string | undefined>>(urlPath: string, params: T): string;
export declare function parseUrl<T extends Record<string, string | undefined>>(url?: string): T;
