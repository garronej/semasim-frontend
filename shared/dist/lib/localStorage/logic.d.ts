import * as types from "./types";
export declare type JustRegistered = types.JustRegistered;
export declare namespace JustRegistered {
    function store(justRegistered: types.JustRegistered): void;
    function retreave(): types.JustRegistered | undefined;
}
export declare type TowardUserKeys = types.TowardUserKeys;
export declare namespace TowardUserKeys {
    function stringify(towardUserKeys: types.TowardUserKeys): string;
    function parse(towardUserKeysStr: string): types.TowardUserKeys;
    function store(towardUserKeys: types.TowardUserKeys): void;
    function retrieve(): types.TowardUserKeys | undefined;
}
