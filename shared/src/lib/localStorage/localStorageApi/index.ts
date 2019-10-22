
import asyncOrSyncLocalStorage from "./asyncOrSyncLocalStorage";

export async function getItem(key: string): Promise<string | null>{
    return asyncOrSyncLocalStorage.getItem(key);
}

export async function setItem(key: string, value: string): Promise<void> {
    return asyncOrSyncLocalStorage.setItem(key, value);
}

export async function removeItem(key: string): Promise<void> {
    return asyncOrSyncLocalStorage.removeItem(key);
}