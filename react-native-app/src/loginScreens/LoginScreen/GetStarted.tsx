import * as React from "react";
import * as rn from "react-native";
import { percentageOfDiagonalDp } from "../../lib/dimensions";

export type Props = {
  click: () => void;
  isAwaitingLoginResponse: boolean;
} & typeof defaultProps;

const defaultProps= {
    "style": {} as rn.StyleProp<rn.ViewStyle>
};

export class GetStarted extends React.Component<Props> {

  static readonly defaultProps = defaultProps;

  render() {
    return (
      <rn.TouchableOpacity
        onPress={() => this.props.click()}
        style={[styles.TouchableOpacity, this.props.style]}
        activeOpacity={0.6}
      >
        {
          this.props.isAwaitingLoginResponse ?
            <rn.ActivityIndicator size="large" color="white" />
            :
            <rn.Text style={styles.Text} >GET STARTED </rn.Text>
        }
      </rn.TouchableOpacity>
    );
  }

}

const styles = rn.StyleSheet.create({
  "TouchableOpacity": {
    "borderRadius": percentageOfDiagonalDp(4.7),
    "width": "100%",
    //NOTE: This mean that it will have the same size in portrait and landscape will display differently on different screen ratio.
    "height": percentageOfDiagonalDp(7), 
    "justifyContent": "center", //NOTE: Vertical center
    "alignItems": "center", //NOTE: Horizontal center
  },
  "Text": {
    "color": "white",
    "fontWeight": "600",
    "fontSize": percentageOfDiagonalDp(1.9)
  }
});
