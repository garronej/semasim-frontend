import * as React from "react";
import * as rn from "react-native";
import { w, h, percentageOfDiagonalDp, getOrientation } from "../lib/dimensions";
import * as imageAssets from "../lib/imageAssets";

export type Props = {
    placeholder: string;
} & typeof defaultProps;


const defaultProps = {
    "icon": undefined as  (rn.ImageSourcePropType | undefined),
    "onSubmitEditing": (()=>{}) as (text: string)=> void,
    "style": {} as rn.StyleProp<rn.ViewStyle>,
    "blurOnSubmit": false,
    "returnKeyType": "next" as rn.TextInputProps["returnKeyType"],
    "error": false,
    "keyboardType": undefined as rn.TextInputProps["keyboardType"],
    "secureTextEntry": false,
    "autoCapitalize": "none" as rn.TextInputProps["autoCapitalize"],
    "onChangeText": (()=> {}) as (text: string)=> void
};

export interface State {
    text: string;
    error: boolean;
}


export class InputField extends React.Component<Props, State> {

    public static defaultProps = defaultProps;

    //TODO: See when class is re instantiated.
    //TODO: See if states are preserved.
    public readonly state: Readonly<State> = {
        "text": "",
        "error": this.props.error
    };

    private input: rn.TextInput | null = null;

    public focus() {
        this.input!.focus();
    }

    public getInputValue() {
        return this.state.text;
    }

    public setInputValue = (text: string) => this.setState({ text }); 

    public UNSAFE_componentWillReceiveProps= (nextProps: Props)=>
        this.setState({
            "error": nextProps.error
        });

    public render() {

        return (
            <rn.View
                style={[
                    styles.view,
                    {
                        "height": h( getOrientation() === "PORTRAIT" ? 8.25: 12 ),
                        "paddingHorizontal": w(  getOrientation() === "PORTRAIT" ? 2.77 : 1.5)
                    },
                    this.props.style,
                    ...this.state.error ? [styles.viewError] : []
                ]
                }
            >
                {this.props.icon !== undefined &&
                <rn.Image
                    style={[styles.imageCustom, { "width": w(getOrientation() === "PORTRAIT" ? 7 : 5) }]}
                    resizeMode="contain"
                    source={this.props.icon}
                />}

                <rn.TextInput
                    style={[styles.textInput, { "marginLeft": w(getOrientation() === "PORTRAIT" ? 3 : 1.5) }]}
                    value={this.state.text}
                    selectionColor="white"
                    autoCapitalize={this.props.autoCapitalize}
                    ref={ref => this.input = ref}
                    autoCorrect={false}
                    underlineColorAndroid="transparent"
                    secureTextEntry={this.props.secureTextEntry}
                    blurOnSubmit={this.props.blurOnSubmit}
                    keyboardType={this.props.keyboardType}
                    returnKeyType={this.props.returnKeyType}
                    placeholder={this.props.placeholder}
                    onSubmitEditing={() => this.props.onSubmitEditing(this.state.text)}
                    placeholderTextColor="black"
                    onChangeText={ text => { 
                        this.setState({ text });
                        this.props.onChangeText(text);
                    }}
                />
                {!!this.state.text &&
                    <rn.TouchableOpacity
                        style={[styles.touchableOpacity, { "width": w(getOrientation() === "PORTRAIT" ? 7 : 3) }]}
                        activeOpacity={0.0}
                        onPress={() => {

                            this.focus();

                            this.setState({
                                "text": "",
                                "error": false
                            });
                        }}
                    >
                        <rn.Image
                            style={styles.imageClose}
                            resizeMode="contain"
                            source={imageAssets.close}
                        />

                    </rn.TouchableOpacity>
                }
            </rn.View>
        );

    }
}

const styles = rn.StyleSheet.create({
    "view": {
        "backgroundColor": "lightgrey",
        "height": h(8.25),
        "width": "100%",
        "flexDirection": "row",
        "borderRadius": percentageOfDiagonalDp(35),
        "borderColor": "#ddd",
        "borderWidth": percentageOfDiagonalDp(0.1),
    },
    "viewError": {
        "backgroundColor": "#EF9A9A88",
        "borderColor": '#E57373'
    },
    "imageCustom": {
        "height": "100%",

    },
    "textInput": {
        "flex": 1,
        "height": "100%"
    },
    "touchableOpacity": {
        "height": "100%"
    },
    "imageClose": {
        "height": "100%",
        "width": "100%"
    }
});

