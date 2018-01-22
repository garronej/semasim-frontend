

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
