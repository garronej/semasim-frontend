import { client as api, declaration } from "../../../api";
import Types = declaration.Types;
import { simRegistrationProcess, validateSimShareProcess } from "../../../shared";
import { ButtonBar } from "./ButtonBar";
import { SimRow } from "./SimRow";


import * as testJsSIP from "./testJsSip";

declare const require: (path: string)=> any;
const bootbox: any = window["bootbox"];

async function loadMainWidget(
	previousState: { selectedSim: string; areDetailsShown: boolean; } | undefined
){

	await simRegistrationProcess.start();

	let useableUserSims= await validateSimShareProcess.start();

	if( !useableUserSims.length ){

		let structure = $(require("../templates/welcome.html"));

		structure.find("#jumbotron-refresh").click(
			() => loadMainWidget(undefined)
		);

		$("#page-payload").html("").append(structure);

		return;

	}


	let structure = $(require("../templates/wrapper.html"));

	$("#page-payload").html("").append(structure);

	let buttonBar = new ButtonBar();

	structure.find("#_1").append(buttonBar.structure);

	let simRows: SimRow[] = [];

	for (let userSim of useableUserSims) {

		let simRow = new SimRow(userSim);

		structure.find("#_1").append(simRow.structure);

		simRows.push(simRow);

		simRow.evtSelected.attach(() => {

			if( buttonBar.state.isSimRowSelected ){

				simRows.filter(
					simRow_ => ( 
						simRow_ !== simRow &&
						simRow_.isSelected
					)
				)[0].unselect();

			}

			buttonBar.setState({
				"isSimRowSelected": true,
				"isSimSharable": Types.UserSim.Owned.match(userSim)
			});

		});

	}

	buttonBar.evtClickDetail.attach(() => {

		for( let simRow of simRows ){

			if( simRow.isSelected ){
				simRow.setDetailsVisibility("SHOWN");
			}else{
				simRow.setVisibility("HIDDEN");
			}

		}
			
	});

	buttonBar.evtClickBack.attach(() =>{

		for( let simRow of simRows ){

			if( simRow.isSelected ){
				simRow.setDetailsVisibility("HIDDEN");
			}else{
				simRow.setVisibility("SHOWN");
			}

		}

	});

	buttonBar.evtClickDelete.attach(
		async () => {

			let userSim= simRows.filter(({ isSelected })=> isSelected)[0].userSim;

			let shouldProceed = await new Promise<boolean>(
				resolve => bootbox.confirm({
					"title": "Unregister SIM",
					"message": `Do you really want to unregister ${userSim.friendlyName}?`,
					callback: result => resolve(result)
				})
			);

			if( shouldProceed ){

				await api.unregisterSim(userSim.sim.imsi);

				buttonBar.evtClickRefresh.post();

			}


		}
	);

	buttonBar.evtClickRename.attach(
		async ()=> {

			let userSim= simRows.filter(({ isSelected })=> isSelected)[0].userSim;

			let friendlyNameSubmitted = await new Promise<string | null>(
				resolve => bootbox.prompt({
					"title": "Friendly name for this sim?",
					"value": userSim.friendlyName,
					"callback": result => resolve(result),
				})
			);

			if( friendlyNameSubmitted ){

				await api.setSimFriendlyName(userSim.sim.imsi, friendlyNameSubmitted);

				buttonBar.evtClickRefresh.post();

			}

		}
	);

	buttonBar.evtClickRefresh.attach(
		async () => {

			structure.remove();

			await loadMainWidget({
				"selectedSim": simRows.filter(
					({ isSelected }) => isSelected
				)[0].userSim.sim.imsi,
				"areDetailsShown": buttonBar.state.areDetailsShown
			});

		}
	);

	if( !previousState ){

		previousState= {
			"selectedSim": useableUserSims[0].sim.imsi,
			"areDetailsShown": false
		};

	}

	simRows.filter(
		({ userSim })=> userSim.sim.imsi === previousState!.selectedSim 
	)[0].structure.click();

	if( previousState.areDetailsShown ){

		buttonBar.btnDetail.click();

	}

}

$(document).ready(()=>{

	console.log("Start...");

	$("#logout").click(async ()=>{

		await api.logoutUser();

		window.location.href = "/login";

	});


	loadMainWidget(undefined);

});