/// <reference types="jquery" />
/// <reference types="bootstrap" />
export declare function dismissLoading(): void;
export declare function loading(message: string, delayBeforeShow?: number): void;
export declare function dialog(options: object): JQuery;
export declare function alert(...args: any[]): JQuery;
export declare function prompt(options: object): JQuery;
export declare function confirm(options: object): JQuery;
