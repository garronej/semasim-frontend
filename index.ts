import { declaration as webApiDeclaration } from "./api";

declare const require: (path: string)=>any;
declare const __dirname: string;

const fs= require("fs");
const path= require("path");

const pagesHtml= { 
    "login": "",
    "manager": "",
    "register": "",
    "webphone": ""
};

for( let pageName in pagesHtml ){

    /*
    pagesHtml[pageName]= fs.readFileSync(
        path.join(__dirname, "pages", pageName, `${pageName}.html`),
        "utf8"
    );
    */

    //ONLY for dev so the server does not have to be restarted
    Object.defineProperty(pagesHtml, pageName, {
        "get": ()=> fs.readFileSync(
            path.join(__dirname, "pages", pageName, `${pageName}.html`),
            "utf8"
        )
    });

}

const pathToStatic: string= path.join(__dirname,"static");

export { webApiDeclaration, pagesHtml, pathToStatic };
