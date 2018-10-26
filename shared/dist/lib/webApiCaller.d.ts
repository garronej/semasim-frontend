import * as apiDeclaration from "../web_api_declaration";
export declare function registerUser(email: string, password: string): Promise<apiDeclaration.registerUser.Response>;
export declare function validateEmail(email: string, activationCode: string): Promise<boolean>;
export declare function loginUser(email: string, password: string): Promise<apiDeclaration.loginUser.Response>;
export declare function logoutUser(): Promise<undefined>;
/** Return true if email has account */
export declare function sendRenewPasswordEmail(email: string): Promise<boolean>;
export declare function renewPassword(email: string, newPassword: string, token: string): Promise<boolean>;
