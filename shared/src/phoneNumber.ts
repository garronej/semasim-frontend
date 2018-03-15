export type phoneNumber = string;

export namespace phoneNumber {

	/**
	 * This function will try to convert a raw string as a E164 formated phone number.
	 * 
	 * If the rawInput is already a E164 it will remain untouched regardless of the iso
	 * ex: +33636786385, it => +33636786385
	 * 
	 * In case the number can not be converted to E164:
	 * -If the number contain any character that is not a digit or ( ) [space] - # * +
	 * then the number will be considered not dialable and remain untouched.
	 * e.g: SFR => SFR | Error
	 * 
	 * -If the number contain only digits ( ) [space] - # * or +
	 * then ( ) [space] and - will be removed.
	 * e.g: +00 (111) 222-333 => +00111222333
	 * (if after the number is "" we return rawInput and it's not dialable )
	 * e.g: ()()-=> ()()- | Error
	 * e.g: [""] => | Error
	 * 
	 * @param rawInput raw string provided as phone number by Dongle or intlInput
	 * @param iso 
	 * country of the number ( lowercase ) e.g: fr, it... 
	 * - If we use intlInput the iso is provided.
	 * - If it's a incoming SMS/Call from Dongle the iso to provide is the one of the SIM
	 * as we will ether have an E164 formated number not affected by the iso
	 * or if we have a locally formated number it's formated it mean that the number is from the same 
	 * country of the sim card.
	 * @param mustBeDialable: throw if the number is not dialable.
	 * 
	 */
	export function build(
		rawInput: string, 
		iso: string | undefined,
		mustBeDialable: "MUST BE DIALABLE" | undefined = undefined
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

			/** If any char other than *+# () and number is present => match  */
			if (rawInput.match(/[^*+#\ \-\(\)0-9]/)) {

				if( mustBeDialable ){
					throw new Error("unauthorized char, not dialable");
				}

				return rawInput;

			} else {

				/** 0 (111) 222-333 => 0111222333 */
				let phoneNumber = rawInput.replace(/[\ \-\(\)]/g, "");

				if (!phoneNumber.length) {

					if (mustBeDialable) {
						throw new Error("void, not dialable");
					}

					return rawInput;

				}

				return phoneNumber;

			}

		}

	}

	/** let us test if we should allow the number to be dialed */
	export function isDialable(phoneNumber: phoneNumber): boolean {

		try {

			build(phoneNumber, undefined, "MUST BE DIALABLE");

		} catch{

			return false;

		}

		return true;

	}

	function isValidE164(phoneNumber: phoneNumber): boolean {

		return (
			phoneNumber[0] === "+" &&
			(intlTelInputUtils as any).isValidNumber(phoneNumber)
		);

	}

	/**
	 * Pretty print the phone number in national format if
	 * it is a number from the SIM country,
	 * in international format if it's from an other country
	 * or do nothing if it's not dialable.
	 * 
	 * @param phoneNumber 
	 * @param simIso 
	 */
	export function prettyPrint(
		phoneNumber: phoneNumber,
		simIso: string | undefined
	): string {

		if (!simIso || !isValidE164(phoneNumber)) {
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

		if (phoneNumber === rawInput) {
			return true;
		}

		let rawInputDry = rawInput.replace(/[^*#+0-9]/g, "");

		if (rawInputDry === phoneNumber) {
			return true;
		}

		if (isValidE164(phoneNumber)) {

			let pnNationalDry = (intlTelInputUtils as any).formatNumber(
				phoneNumber,
				null,
				intlTelInputUtils.numberFormat.NATIONAL
			).replace(/[^*#+0-9]/g, "");

			if (rawInputDry === pnNationalDry) {
				return true;
			}

		}

		return false;

	}

}