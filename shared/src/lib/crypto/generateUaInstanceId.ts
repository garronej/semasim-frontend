import * as uuidv5 from "uuid/v5";

const namespace = "1514baa7-6d21-4eeb-86f5-f7ccd6a85afd";

export const generateUaInstanceId = (seed: string) => `"<urn:uuid:${uuidv5(seed, namespace)}>"`;