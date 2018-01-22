
const bootbox= window["bootbox"];

export function getURLParameter(sParam: string): string | undefined {

    let sPageURL = window.location.search.substring(1);

    let sURLVariables = sPageURL.split("&");

	for (var i = 0; i < sURLVariables.length; i++) {

        let sParameterName = sURLVariables[i].split("=");

		if (sParameterName[0] == sParam) {

			return sParameterName[1];
		}
	}
}

export function loadingDialog(
	message: string,
	delayBeforeShow = 700
): () => void {

	let dialog: any = undefined;

	let timer= setTimeout(
		() => dialog = bootbox.dialog({
			"message": [
				'<p class="text-center">',
				'<i class="fa fa-spin fa-spinner"></i>&nbsp;&nbsp;',
				`${message}</p>`
			].join(""),
			"closeButton": false
		}), 
		delayBeforeShow
	);

	return ()=> dialog?dialog.modal("hide"):clearTimeout(timer);

}
