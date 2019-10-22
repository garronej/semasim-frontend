
import * as React from "react";
import * as rn from "react-native";
import { VoidSyncEvent, SyncEvent } from "frontend-shared/node_modules/ts-events-extended";
import { InputField } from "../genericComponents/InputField";
import { w, h, percentageOfDiagonalDp, getOrientation } from "../lib/dimensions";
import * as imageAssets from "../lib/imageAssets";
import { baseTypes as types, provideCustomImplementationOfBaseApi } from "frontend-shared/dist/tools/modal/dialog";

const log: typeof console.log = false ? console.log.bind(console) : () => { };


const evtRef = new SyncEvent<Dialog | undefined>();
const evtNewAppState= new SyncEvent<rn.AppStateStatus>();

let ref: Dialog | undefined = undefined;

evtRef.attach(newRef => ref = newRef);

const api: types.Api = {
    "create": (dialogType, options) => createModal(dialogType, options),
    "createLoading": message => api.create(
        "dialog",
        {
            "message": `LOADING: ${message}`,
            "closeButton": false,
            "onEscape": false,
            "animate": false,
            "show": false
        }
    )
};

provideCustomImplementationOfBaseApi(api);

function createModal<T extends types.Type>(dialogType: T, options: types.Options<T>): types.Modal {

    log("==================> create modal");

    if (options.show !== false) {
        throw new Error("options.show other than false not implemented");
    }

    const modal: types.Modal = {
        "evtHide": new VoidSyncEvent(),
        "evtShown": new VoidSyncEvent(),
        "evtHidden": new VoidSyncEvent(),
        "show": () => {

            currentModal = modal;

            Promise.all<unknown>([
                //NOTE: It's probably unnecessary, ref should always be defined.
                ref ||
                evtRef.waitFor(),
                rn.AppState.currentState === "active" ||
                evtNewAppState.attachOnce(newAppState => newAppState === "active", modal, () => { })
            ]).then(() => ref!.setState({
                "isVisible": true,
                dialogType,
                options
            }, () => modal.evtShown.post()));

        },
        "hide": () => {

            evtNewAppState.detach(modal);

            ref!.setState(
                { "isVisible": false },
                () => modal.evtHidden.post()
            );

            modal.evtHide.post();

        },
        "removeFromDom": () => {

            if (modal.evtHide.postCount !== 0) {
                return;
            }

            modal.hide();

        }

    };

    return modal;

};


export type Props = {};

//export type State = State.Generic<DialogType>;
export type State =
    State.Generic<"alert"> |
    State.Generic<"confirm"> |
    State.Generic<"prompt"> |
    State.Generic<"dialog">;

export declare namespace State {

    export type Generic<T extends types.Type> = {
        isVisible: boolean;
        dialogType: T;
        options: types.Options<T>;
    };

}

log("[Dialog] imported");

let savedState: State = {
    "isVisible": false,
    "dialogType": "alert",
    "options": { "message": "" }
};

let currentModal: types.Modal;

export class Dialog extends React.Component<Props, State> {

    public setState<K extends keyof State>(
        state: Pick<State, K>,
        callback?: () => void
    ): void {

        Object.assign(savedState, state);

        super.setState(state, callback);

    }

    public readonly state: Readonly<State> = { ...savedState };


    constructor(props: any) {
        super(props);

        log("[Dialog] constructor");

    }

    public componentDidMount = () => {

        log("[Dialog] componentDidMount");

        evtRef.post(this);

        rn.AppState.addEventListener("change", this.handleAppStateChange);

    };

    public componentWillUnmount = () => {

        log("[Dialog] componentWillUnmount");

        evtRef.post(undefined);

        rn.AppState.removeEventListener("change", this.handleAppStateChange);

    };

    private handleAppStateChange = (nextAppState: rn.AppStateStatus) => evtNewAppState.post(nextAppState);


    private onRequestClose = () => {

        const { options } = this.state;

        if (options.onEscape === false) {
            return;
        }

        this.onPressCross();

    };

    private onPressCross = () => {

        const { state } = this;

        switch (state.dialogType) {
            case "alert": {

                const { callback } = state.options;

                if (callback === undefined) {
                    break;
                }

                callback();

            } break;
            case "confirm":
                state.options.callback(false);
                break;
            case "prompt":
                state.options.callback(null);
                break;
            case "dialog": {

                if (!state.options.closeButton) {
                    throw new Error("assert");
                }

                state.options.onEscape();

            } break;
        }

        currentModal.hide();

    };

    private inputText = "";

    public render = () => {

        return (
            <rn.Modal
                animationType={this.state.options.animate === false ? "none" : "fade"}
                transparent={true}
                visible={this.state.isVisible}
                onRequestClose={this.onRequestClose}
            >
                <rn.View style={{
                    flex: 1,
                    justifyContent: "center",
                    alignItems: "center",
                    backgroundColor: `rgba(0,0,0,${this.state.options.backdrop !== false ? 0.5 : 0})`
                }}
                >
                    <rn.View style={{
                        width: "90%",
                        flexDirection: "column",
                        overflow: "hidden",
                        borderRadius: percentageOfDiagonalDp(2),
                        backgroundColor: "rgba(255,255,255,0.97)",
                        shadowColor: "#000",
                        shadowOffset: {
                            width: 0,
                            height: 2,
                        },
                        shadowOpacity: 0.25,
                        shadowRadius: 3.84,

                        elevation: 5,
                    }}>
                        <Header
                            options={this.state.options}
                            onPressCross={this.onPressCross} />
                        <Body
                            dialogType={this.state.dialogType}
                            options={this.state.options}
                            onChangeText={text => this.inputText = text} />
                        <Buttons
                            dialogType={this.state.dialogType}
                            options={this.state.options}
                            getInput={() => this.inputText}
                            onPress={() => currentModal.hide()} />
                    </rn.View>
                </rn.View>
            </rn.Modal>
        );
    };

}

const Header: React.FunctionComponent<{
    options: State["options"];
    onPressCross: () => void;
}> = ({ options, onPressCross }) => {

    const closeButton = options.closeButton !== false;

    if (!options.title && !closeButton) {
        return null;
    }

    return (
        <rn.View style={{
            height: h(7),
            width: "100%",
            flexDirection: "row",
            justifyContent: (() => {

                if (!!options.title && !closeButton) {
                    return "flex-start" as const;
                }

                if (!options.title && closeButton) {
                    return "flex-end" as const;
                }

                return "space-between" as const;

            })(),
            paddingHorizontal: w(2),
            backgroundColor: "rgba(0,0,0,0.1)"
        }}>
            {!!options.title &&
                <rn.View style={{ justifyContent: "center", height: "100%" }}>
                    <rn.Text
                        style={{
                            "fontWeight": "600",
                            "fontSize": percentageOfDiagonalDp(1.9)
                        }}
                    >{options.title}</rn.Text>
                </rn.View>}

            {closeButton &&
                <rn.TouchableOpacity
                    style={[{ "height": "100%" }, { "width": w(getOrientation() === "PORTRAIT" ? 7 : 3) }]}
                    activeOpacity={0.0}
                    onPress={onPressCross}
                >
                    <rn.Image
                        style={{ height: "100%", width: "100%" }}
                        resizeMode="contain"
                        source={imageAssets.close}
                    />
                </rn.TouchableOpacity>}
        </rn.View>
    );


};

const Body: React.FunctionComponent<Omit<State, "isVisible"> & { onChangeText: (text: string) => void }> = props_ => {

    const props = props_ as State & { onChangeText: (text: string) => void };

    if (props.dialogType !== "prompt") {

        if (props.options.message === undefined) {
            return null;
        }

        return (
            <rn.View style={{ marginVertical: h(2), paddingHorizontal: w(1.5), width: "100%", alignItems: "center" }}>
                <rn.Text>{props.options.message.replace(/<br>/g, "\n")}</rn.Text>
            </rn.View>
        );


    }

    return (
        <rn.View style={{ marginVertical: h(2), width: "100%" }}>
            <InputField
                placeholder={props.options.placeholder || ""}
                onChangeText={props.onChangeText}
                keyboardType={(() => {
                    switch (props.options.inputType) {
                        case "email": return "email-address";
                        case "number": return "number-pad";
                        case "password":
                        case "text": return "default";
                        default: throw new Error("not implemented yet");
                    }
                })()}
                ref={ref => {

                    const { value } = props.options;

                    if (value === undefined || ref === null) {
                        return;
                    }

                    ref.setInputValue(value);

                }}
                secureTextEntry={props.options.inputType === "password"}
            />
        </rn.View>
    );

};

const buttonStyle = rn.StyleSheet.create({
    "btn-success": {
        "backgroundColor": "green"
    },
    "btn-default": {
    }

});

const Buttons: React.FunctionComponent<Omit<State, "isVisible"> & { getInput: () => string; onPress: () => void; }> =
    props_ => {

        const props = props_ as State & { getInput: () => string; onPress: () => void; };

        const buttons: {
            label: string;
            className: keyof typeof buttonStyle;
            callback: () => void;
        }[] = (() => {

            switch (props.dialogType) {
                case "alert": return [{
                    "label": "OK",
                    "className": "btn-default" as const,
                    "callback": props.options.callback || (() => { })
                }];
                case "confirm": return [
                    {
                        "label": "Cancel",
                        "className": "btn-default" as const,
                        "callback": () => props.options.callback(false)
                    },
                    {
                        "label": "OK",
                        "className": "btn-default" as const,
                        "callback": () => props.options.callback(true)
                    }
                ];
                case "prompt": return [
                    {
                        "label": "Cancel",
                        "className": "btn-default" as const,
                        "callback": () => props.options.callback(null)
                    },
                    {
                        "label": "OK",
                        "className": "btn-default" as const,
                        "callback": () => props.options.callback(props.getInput())
                    }
                ];
                case "dialog": return (() => {

                    const { buttons } = props.options;

                    if (buttons === undefined) {
                        return [];
                    }

                    return Object.keys(buttons)
                        .map(buttonName => buttons[buttonName])
                        .map(({ label, className, callback }) => ({

                            label,
                            "className": (
                                Object.keys(buttonStyle).indexOf(className || "") >= 0 ?
                                    className : "btn-default"
                            ) as any,
                            callback

                        }));


                })();

            }

        })();

        if (buttons.length === 0) {
            return null;
        }

        return (
            <rn.View style={{
                width: "100%",
                height: h(7.5),
                borderTopWidth: percentageOfDiagonalDp(0.1),
                borderColor: "lightgray",
                flexDirection: "row"
            }} >
                {buttons.map((button, index) => (
                    <rn.TouchableHighlight
                        key={index}
                        underlayColor="rgba(0,0,0,0.05)"
                        style={
                            [
                                {
                                    flex: 1,
                                    height: "100%",
                                    justifyContent: "center",
                                    alignItems: "center",
                                    borderColor: "lightgrey",
                                    borderLeftWidth: index === 0 ? 0 : percentageOfDiagonalDp(0.1)
                                },
                                buttonStyle[button.className]
                            ]
                        }
                        onPress={() => {
                            button.callback();
                            props.onPress();
                        }}
                    >
                        <rn.Text>{button.label}</rn.Text>
                    </rn.TouchableHighlight>
                ))}

            </rn.View>
        );

    };







