/*
declare const require: any;
let EventEmitter = require("events");

export namespace Object_ {

    export function getAllPropertyNames(obj: Object): string[] {

        let props: string[] = [];

        do {
            Object.getOwnPropertyNames(obj).forEach(function (prop) {
                if (props.indexOf(prop) === -1) {
                    props.push(prop);
                }
            });
        } while (obj = Object.getPrototypeOf(obj));

        return props;

    }

    export function getAllPropertyNamesLayer(obj: Object) {

        let out: any[] = [];

        let props = out;

        let tmp;

        do {

            tmp = [];

            props.push(tmp);

            props = tmp;

            Object.getOwnPropertyNames(obj).forEach(function (prop) {
                if (props.indexOf(prop) === -1) {

                    props.push(prop);
                }
            });

        } while (obj = Object.getPrototypeOf(obj));

        return out[0];

    }

    //Proto extension

    export function assignPrivate(
        targetObj: any,
        prop: string,
        value: any
    ): any {

        Object.defineProperty(targetObj, prop, {
            "value": value,
            "writable": true,
            "configurable": true
        });

        return value;

    }

    export function hideAllProperties(
        targetObj: any
    ) {

        Object.keys(targetObj).forEach(function (prop) {

            var propDesc = Object.getOwnPropertyDescriptor(this, prop)!;

            propDesc.enumerable = false;

            Object.defineProperty(this, prop, propDesc);

        }.bind(targetObj));

    }

}

export namespace Function_ {

    //Proto extension

    const funProps = Object.getOwnPropertyNames(Function);

    export function implementsClass(
        srcFunction: Function,
        constructor: Function
    ) {

        for (let prop of Object.getOwnPropertyNames(constructor.prototype)) {

            if (prop === "constructor") continue;

            Object.defineProperty(srcFunction.prototype, prop,
                Object.getOwnPropertyDescriptor(constructor.prototype, prop)!
            );


        }

        for (let prop of Object.getOwnPropertyNames(constructor)) {

            if (funProps.indexOf(prop) !== -1) {
                continue;
            }

            Object.defineProperty(srcFunction, prop,
                Object.getOwnPropertyDescriptor(constructor, prop)!
            );

        }

    }

    export function extendsClass(srcFunction: Function, constructor: Function){

                srcFunction.prototype = Object.create(constructor.prototype, {
                    "constructor": {
                        "value": srcFunction,
                        "configurable": true
                    }
                });


        for (let prop of Object.getOwnPropertyNames(constructor)) {


            if (funProps.indexOf(prop) !== -1) {
                continue;
            }

            Object.defineProperty(srcFunction, prop,
                Object.getOwnPropertyDescriptor(constructor, prop)!
            );

        }

        srcFunction["__super__"] = constructor;


    }

}

export namespace JSON_ {


    export function stringify(obj, replacer, space) {

        replacer = replacer || function (key, value) { return value; };

        return JSON.stringify(obj, function (key, value) {

            var desc = Object.getOwnPropertyDescriptor(this, key);

            if (desc!.enumerable === false || key.match(/^_(.*)$/)) {

                return replacer(key, undefined);

            } else if (key === "date") {

                return replacer(key, Date.parse(value));

            } else {

                return replacer(key, value);

            }

        }, space);

    }

    export const parse: typeof JSON.stringify= (obj, reviver)=> {

        reviver = reviver || function (key, value) { return value; };

        return JSON.parse(obj, function( key, value) {

                    if (key === "date") {
                        return reviver(key, new Date(value));
                    } else {
                        return reviver(key, value);
                    }

        });

    }

}

export namespace String_ {

    //Proto extension

    export function lt(srcString: String, str: string | undefined): boolean{

        if (srcString.valueOf() === "undefined") {
            if (typeof (str) === "string") {
                return false;
            } else {
                return true;
            }
        } else if (typeof (str) !== "string") {
            return true;
        }

        if (srcString.valueOf() === "") {
            return true;
        } else if (str == "") {
            return false;
        }

        var f = function (s) {
            let v = s.charAt(0).toLowerCase().charCodeAt(0);
            if (!(96 < v && v < 123)) {
                return 123;
            }
            return v;
        };

        var v1 = f(srcString.valueOf()),
            v2 = f(str);

        if (v1 === v2) {
            return String_.lt(
                new String(srcString.valueOf().substr(1)),
                str.substr(1)
            );
        }

        return v1 < v2;


    }

}

export namespace EventEmitter_ {

    export function setEventHandlers(
        eventEmitter, 
        eventHandlers: { [eventName: string]: Function }
    ){

        for( let eventName in eventHandlers || {} ){

            eventEmitter.on(eventName, eventHandlers[eventName]);

        }

    }

}
*/


