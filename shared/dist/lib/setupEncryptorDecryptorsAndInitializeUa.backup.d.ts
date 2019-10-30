import * as cryptoLib from "./crypto/cryptoLibProxy";
import * as types from "./types/userSim";
/**
 * ASSERT: User logged.
 *
 * -Pre spawn the crypto workers ( aes and rsa )
 * -Provide an aes encryptor/decryptor to remoteApiCaller so that
 *  the webData api can be used.
 * -Statically provide a rsa decryptor to Ua class ( so that incoming
 * message can be decrypted )
 *
 * pushToken should be undefined for the web ( for now )
 *
 * */
export declare function setupEncryptorDecryptorsAndInitializeUa(pushNotificationToken: string | undefined): Promise<void>;
export declare const getTowardSimEncryptor: (userSim: types.UserSim._Base<types.SimOwnership.Owned | types.SimOwnership.Shared.Confirmed>) => cryptoLib.Encryptor;
