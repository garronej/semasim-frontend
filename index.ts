import { declaration as webApiDeclaration } from "./api";

declare const require: (path: string)=>any;
const fs= require("fs");
const path= require("path");

const pagesHtml= {
    "login": fs.readFileSync("./pages/login/login.html", "utf8") as string,
    "manager": fs.readFileSync("./pages/manager/manager.html", "utf8") as string,
    "register": fs.readFileSync("./pages/register/register.html", "utf8") as string
};

const pathToStatic: string= path.join("./static");

export { webApiDeclaration, pagesHtml, pathToStatic };
