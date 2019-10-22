
import * as buildTools from "frontend-build-tools";
import * as child_process from "child_process";
import * as path from "path";

const module_dir_path = path.join(__dirname, "..", "..");

export const standalone_script_export_module = "crypto-lib-standalone";

export const standalone_script_path_local = path.join(module_dir_path, "assets", `${standalone_script_export_module}.js`);

if (require.main === module) {

    (async () => {

        const standalone_script_path_android = path.join(module_dir_path, "..", "react-native-app", "android", "app", "src", "main", "assets", `${standalone_script_export_module}.js`);

        await buildTools.browserify(
            ["--require", `${path.join(module_dir_path, "dist", "lib", `${standalone_script_export_module}.js`)}:${standalone_script_export_module}`],
            ["--outfile", standalone_script_path_local]
        );

        child_process.execSync(`cp ${standalone_script_path_local} ${standalone_script_path_android}`);

    })();

}




