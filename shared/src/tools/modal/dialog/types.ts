
export type Modal = import("../types").Modal;

export type Type = "alert" | "confirm" | "prompt" | "dialog" ;

export type Options<T extends Type> =
    Partial<{
        message: string | undefined;
        title: string | undefined;
        backdrop: boolean | null; //Default: null. In react native can only be null or false. ( true === null behavior wise )
        animate: boolean; //Default true,
        className: string;
        size: "large" | "small";
        closeButton: boolean; //NOTE: When close button clicked onEscape should be invoked.
        show: boolean; //Default true
    }> &
    (T extends "alert" ? {
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
    } & ({ closeButton: true; onEscape: () => void; } | { closeButton: false; onEscape: false; })) : never);



export type Api= {
    create: <T extends Type>(dialogType: T, options: Options<T>) => Modal;
    createLoading: (message: string)=> Modal; /** Create loading should not be displayed by default */
};


