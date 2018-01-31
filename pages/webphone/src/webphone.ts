import { client as api, declaration } from "../../../api";
import Types = declaration.Types;
import { simRegistrationProcess, validateSimShareProcess } from "../../../shared";
import { UiWebphone } from "./UiWebphone";

declare const require: (path: string) => any;
const bootbox: any = window["bootbox"];

async function loadPageContent() {

	await simRegistrationProcess.start();

	let useableUserSims = await validateSimShareProcess.start();

	if (!useableUserSims.length) {

		window.location.href = "/manager";

		return;

	}

	let userSim= useableUserSims.pop()!;

	let uiWebphone= new UiWebphone(userSim);

	$(".page-content-inner").append(uiWebphone.structure);

}

$(document).ready(() => {

	console.log("Start...x");

	$("#logout").click(async () => {

		await api.logoutUser();

		window.location.href = "/login";

	});

	loadPageContent();

});


export namespace phoneNumber {

	function format(
		number: string,
		numberFormat: "NATIONAL" | "INTERNATIONAL" | "E164",
		iso?: string
	): string {

		console.log("telFormat", { number, numberFormat, iso });

		let numberFormatCode = (() => {

			switch (numberFormat) {
				case "NATIONAL": return intlTelInputUtils.numberFormat.NATIONAL;
				case "INTERNATIONAL": return intlTelInputUtils.numberFormat.INTERNATIONAL;
				case "E164": return intlTelInputUtils.numberFormat.E164;
			}

		})();

		return (intlTelInputUtils as any).formatNumber(
			number,
			iso || null,
			numberFormatCode
		)

	}

	export function toNational(numberE164: string){
		return format(numberE164, "E164");
	}

	/** if already e164 identity */
	export function toE164(numberAsStored: string, iso: string){

	}

	export function areSame(
		numberE164: string,
		numberAsStored: string
	): string{
		return "";
	}

}