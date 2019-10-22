
export type ImageSourcePropType = import("react-native").ImageSourcePropType;

export const [companyLogo, email, password, repeat, person, close, background, semasimLogo] = [
    require("../../assets/companylogo.png"),
    require("../../assets/email.png"),
    require("../../assets/password.png"),
    require("../../assets/repeat.png"),
    require("../../assets/person.png"),
    require("../../assets/close.png"),
    require("../../assets/background.jpeg"),
    require("../../assets/semasim_logo.png")
] as ImageSourcePropType[];
