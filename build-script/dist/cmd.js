"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const buildTools = require("frontend-build-tools");
const path = require("path");
const fs = require("fs");
const repl = require("repl");
const scriptTools = require("scripting-tools");
if (require.main === module) {
    process.once("unhandledRejection", error => { throw error; });
    process.setMaxListeners(70);
    Promise.resolve().then(() => require("commander")).then((program) => __awaiter(this, void 0, void 0, function* () {
        program
            .command("build_page")
            .description("Build a specific page, to be called from the page root dir")
            .option("-w, --watch", "Watch input files")
            .action(options => program_action_build_page(options));
        program
            .command("build_pages")
            .description("Build all pages")
            .option("-w, --watch", "Watch input files")
            .action(options => program_action_build_pages(options));
        program
            .command("install_pages")
            .description("npm install everywhere")
            .action(() => program_action_install_pages());
        program.parse(process.argv);
    }));
}
const startExitRepl = () => {
    console.log("enter exit for graceful termination");
    const replInstance = repl.start({
        "terminal": true,
        "prompt": "> "
    });
    const { context } = replInstance;
    Object.defineProperty(context, "exit", {
        "get": () => process.exit(0)
    });
};
const build_page = (target_module_dir_path, watch) => {
    const page_version = require(path.join(target_module_dir_path, "package.json"))["version"];
    {
        const page_file_path = path.join(target_module_dir_path, "page.ejs");
        fs.writeFileSync(page_file_path, Buffer.from([
            `<%`,
            `//Automatically generated by build-script`,
            `const version= "${page_version}";`,
            `%>`,
            ``,
            (() => {
                const page = fs.readFileSync(page_file_path)
                    .toString("utf8");
                return page.substring(page.match(/<\!DOCTYPE\ html>/i).index);
            })()
        ].join("\n"), "utf8"));
    }
    (() => __awaiter(this, void 0, void 0, function* () {
        yield buildTools.tsc(path.join(target_module_dir_path, "tsconfig.json"), watch);
        const bundle_file_path = path.join(__dirname, "..", "..", "static.semasim.com", `${path.basename(target_module_dir_path)}-${page_version}.js`);
        yield buildTools.browserify(["--entry", path.join(target_module_dir_path, "dist", "main.js")], ["--outfile", bundle_file_path], undefined, watch);
        yield buildTools.minify(bundle_file_path, watch);
    }))();
};
function program_action_build_page(options) {
    return __awaiter(this, void 0, void 0, function* () {
        const watch = !!options["watch"] ? "WATCH" : undefined;
        if (!!watch) {
            startExitRepl();
        }
        const target_module_dir_path = process.cwd();
        build_page(target_module_dir_path, watch);
    });
}
const frontend_root_dir_path = path.join(__dirname, "..", "..");
const pages_dir_path = path.join(frontend_root_dir_path, "pages");
function program_action_build_pages(options) {
    return __awaiter(this, void 0, void 0, function* () {
        const watch = !!options["watch"] ? "WATCH" : undefined;
        if (!!watch) {
            startExitRepl();
        }
        console.log(path.join(frontend_root_dir_path, "shared", "tsconfig.json"));
        yield buildTools.tsc(path.join(frontend_root_dir_path, "shared", "tsconfig.json"), watch);
        for (const page_name of fs.readdirSync(pages_dir_path)
            .filter(entry => fs.statSync(path.join(pages_dir_path, entry))
            .isDirectory())) {
            build_page(path.join(pages_dir_path, page_name), watch);
        }
    });
}
function program_action_install_pages() {
    return __awaiter(this, void 0, void 0, function* () {
        yield Promise.all([
            "shared",
            ...fs.readdirSync(pages_dir_path)
                .map(page_name => path.join("pages", page_name))
        ]
            .map(relative_path => path.join(frontend_root_dir_path, relative_path))
            .map((target_module_dir_path) => __awaiter(this, void 0, void 0, function* () {
            const module_name = path.basename(target_module_dir_path);
            console.log(`START ${module_name}`);
            yield scriptTools.exec(`rm -f ${path.join(target_module_dir_path, "package-lock.json")}`);
            yield scriptTools.exec(`npm install`, { "cwd": target_module_dir_path });
            console.log(`${module_name} DONE`);
        })));
    });
}