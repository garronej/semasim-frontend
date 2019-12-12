
const { name: appName } = require("../../../app.json");
import { AppRegistry } from "react-native";
import { componentProvider } from "../../RootComponent";

import "./impl";

AppRegistry.registerComponent(appName, componentProvider);