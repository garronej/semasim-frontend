const child_process = require("child_process");
const path = require("path");

const { dependencies, devDependencies } = require("./package.json");

Object.assign(dependencies, devDependencies);

Object.keys(dependencies)
    .filter(key => !!dependencies[key].match(/^file\:/))
    .forEach(module_name => {

        console.log("\n\n" + module_name);

        const node_modules_dir_path = path.join(".", "node_modules");
        const module_installation_dir_path = path.join(node_modules_dir_path, module_name);
        const module_dir_path = dependencies[module_name].match(/^file\:(.*)$/)[1];
        const tmp_dir = path.join(node_modules_dir_path, `tmp_${module_name}_${Date.now()}`);

        [
            `rm -rf ${module_installation_dir_path}`,
            `rsync  ${module_dir_path} ${tmp_dir} -a --copy-links -v`,
            `mv ${path.join(tmp_dir, path.basename(module_dir_path))} ${module_installation_dir_path}`,
            `rm -r ${tmp_dir}`
        ].forEach(cmd => {

            console.log(cmd);

            child_process.execSync(cmd);

        });

    })
    ;

console.log("DONE");









