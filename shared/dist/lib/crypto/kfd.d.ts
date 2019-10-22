export declare type KfdFn = (password: string, salt: Uint8Array, iterations: number) => Promise<Uint8Array>;
export declare const kfd: KfdFn;
