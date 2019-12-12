
import * as localStorageApi from "./localStorageApi";

const key = "declaredPushNotificationToken";

export async function get(): Promise<string | undefined> {

    const value = await localStorageApi.getItem(key);

    if (value === null) {
        return undefined;
    }

    return value;

}

export async function set(value: string): Promise<void> {

    await localStorageApi.setItem(
        key,
        value
    );

}

export async function remove() {

    if (null === await get()) {
        return;
    }

    await localStorageApi.removeItem(key);

}



