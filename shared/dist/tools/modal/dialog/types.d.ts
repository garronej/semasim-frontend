export declare type Modal = import("../types").Modal;
export declare type Type = "alert" | "confirm" | "prompt" | "dialog";
export declare type Options<T extends Type> = Partial<{
    message: string | undefined;
    title: string | undefined;
    backdrop: boolean | null;
    animate: boolean;
    className: string;
    size: "large" | "small";
    closeButton: boolean;
    show: boolean;
}> & (T extends "alert" ? {
    message: string;
    callback?: () => void;
    onEscape?: boolean; /** Default true */
} : T extends "confirm" ? {
    message: string;
    callback: (result: boolean) => void;
    onEscape?: boolean; /** Default true */
} : T extends "prompt" ? {
    title: string;
    message?: undefined;
    value?: string;
    placeholder?: string; /** Can't have both placeholder and value, placeholder only valid for text input */
    inputType?: "text" | "textarea" | "email" | "date" | "time" | "number" | "password"; /** Default text */
    callback: (value: string | null) => void;
    onEscape?: boolean; /** Default true */
} : T extends "dialog" ? ({
    message: string;
    buttons?: {
        [buttonName: string]: {
            label: string;
            className?: string;
            callback: () => void;
        };
    };
} & ({
    closeButton: true;
    onEscape: () => void;
} | {
    closeButton: false;
    onEscape: false;
})) : never);
export declare type Api = {
    create: <T extends Type>(dialogType: T, options: Options<T>) => Modal;
    createLoading: (message: string) => Modal; /** Create loading should not be displayed by default */
};
