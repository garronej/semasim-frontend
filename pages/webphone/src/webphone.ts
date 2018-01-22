import { client as api, declaration } from "../../../api";
import Types = declaration.Types;

import * as testJsSIP from "./testJsSip";

declare const require: (path: string)=> any;
const bootbox: any = window["bootbox"];

$(document).ready(()=> {

	console.log("Ready");

});
