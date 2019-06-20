

export function buildUrl<T extends Record<string, string | undefined>>(urlPath: string, params: T) {

	return urlPath + "?" + Object.keys(params)
		.filter(key => params[key] !== undefined)
		.map(key => `${key}=${encodeURIComponent(params[key]!)}`)
		.join("&")
		;

}

export function parseUrl<T extends Record<string, string | undefined>>(url: string = location.href): T {

	const sPageURL = url.split("?")[1];

	if( sPageURL === undefined ){
		return {} as any;
	}

	const sURLVariables = sPageURL.split("&");

	const out: any = {};

	for (let i = 0; i < sURLVariables.length; i++) {

		const sParameterName = sURLVariables[i].split("=");

		out[sParameterName[0]] = decodeURIComponent(sParameterName[1]);

	}

	return out;

}

