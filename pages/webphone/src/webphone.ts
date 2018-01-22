import { client as api, declaration } from "../../../api";
import Types = declaration.Types;
import { simRegistrationProcess, validateSimShareProcess } from "../../../shared";

declare const require: (path: string)=> any;
const bootbox: any = window["bootbox"];

async function loadMainWidget(
){

	await simRegistrationProcess.start();

	let useableUserSims= await validateSimShareProcess.start();

	if( !useableUserSims.length ){

		window.location.href = "/manager";

		return;

	}


	let structure = $(require("../templates/wrapper.html"));

	$("#page-payload").html("").append(structure);


}

$(document).ready(()=>{

	console.log("Start...");

	$("#logout").click(async ()=>{

		await api.logoutUser();

		window.location.href = "/login";

	});

	loadMainWidget();

});
