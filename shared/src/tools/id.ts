
/** Return the value passed as argument, helper type for avoiding declaring variable */
export const id: <T>(o: T) => T = o => o;