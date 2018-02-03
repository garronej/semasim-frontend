/** E164 number if FIXED LINE or MOBILE or RAW with only [*#+0-9] */
export type phoneNumber = string;

export namespace phoneNumber {

	/** Throw error if malformed */
	export function build(
		rawInput: string, 
		iso: string | undefined
	): phoneNumber {

		let shouldFormatToE164: boolean = (() => {

			if( !iso ){ 
				return false;
			}

			let numberType: intlTelInputUtils.numberType =
				(intlTelInputUtils as any).getNumberType(rawInput, iso);

			switch (numberType) {
				case intlTelInputUtils.numberType.FIXED_LINE:
				case intlTelInputUtils.numberType.FIXED_LINE_OR_MOBILE:
				case intlTelInputUtils.numberType.MOBILE:
					return true;
				default:
					return false;
			}

		})();


		if (shouldFormatToE164) {

			return (intlTelInputUtils as any).formatNumber(
				rawInput,
				iso,
				intlTelInputUtils.numberFormat.E164
			);

		} else {

			if (rawInput.match(/[^*+#\ \-\(\)0-9]/)) {
				throw new Error("Malformed");
			}

			let phoneNumber= rawInput.replace(/[\ \-\(\)]/g, "");

			if( !phoneNumber.length ){
				throw new Error("Void Phone Number");
			}

			return phoneNumber;


		}

	}


	export function prettyPrint(
		phoneNumber: phoneNumber,
		simIso: string | undefined
	): string {

		if ( !simIso || phoneNumber[0] !== "+") {
			return phoneNumber;
		}

		let pnNational = (intlTelInputUtils as any).formatNumber(
			phoneNumber,
			null,
			intlTelInputUtils.numberFormat.NATIONAL
		);

		let pnBackToE164 = (intlTelInputUtils as any).formatNumber(
			pnNational,
			simIso,
			intlTelInputUtils.numberFormat.E164
		);

		if (pnBackToE164 === phoneNumber) {

			return pnNational;

		} else {

			return (intlTelInputUtils as any).formatNumber(
				phoneNumber,
				simIso,
				intlTelInputUtils.numberFormat.INTERNATIONAL
			);

		}

	}

	export function areSame(
		phoneNumber: phoneNumber,
		rawInput: string
	): boolean {

		let rawInputDry = rawInput.replace(/[^*#+0-9]/g, "");

		if (rawInputDry === phoneNumber) {
			return true;
		}

		if (phoneNumber[0] === "+") {

			let pnNationalDry = (intlTelInputUtils as any).formatNumber(
				phoneNumber,
				null,
				intlTelInputUtils.numberFormat.NATIONAL
			).replace(/[^*#+0-9]/g, "");

			if( rawInputDry === pnNationalDry ){
				return true;
			}

		}

		return false;

	}

}