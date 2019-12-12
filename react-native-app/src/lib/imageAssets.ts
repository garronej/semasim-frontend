
export type ImageSourcePropType = import("react-native").ImageSourcePropType;

export const [email, password, repeat, person, close, semasimLogo, semasimLogo1, semasimLogo2, semasimLogo3] = [
    require("../../assets/email.png"),
    require("../../assets/password.png"),
    require("../../assets/repeat.png"),
    require("../../assets/person.png"),
    require("../../assets/close.png"),
    require("../../assets/semasim_logo.png"),
    require("../../assets/semasim_logo_1.png"),
    require("../../assets/semasim_logo_2.png"),
    require("../../assets/semasim_logo_3.png")
] as ImageSourcePropType[];
