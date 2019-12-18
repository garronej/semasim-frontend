//NOTE: Assert cwd is project root.

const child_process = require("child_process");
const path = require("path");

const project_root_path = process.cwd();

const node_modules_dir_path = path.join(project_root_path, "node_modules");

const { dependencies, devDependencies } = require(path.join(project_root_path,"package.json"));

Object.assign(dependencies, devDependencies);

function doModule(module_name) {

    console.log("\n\n" + module_name);

    const module_installation_dir_path = path.join(node_modules_dir_path, module_name);
    const module_dir_path = path.join(project_root_path,dependencies[module_name].match(/^file\:(.*)$/)[1]);
    const tmp_dir = path.join(node_modules_dir_path, `tmp_${module_name}_${Date.now()}`);

    [
        `rm -rf ${module_installation_dir_path}`,
        `rsync  ${module_dir_path} ${tmp_dir} -a --copy-links -v`,
        `mv ${path.join(tmp_dir, path.basename(module_dir_path))} ${module_installation_dir_path}`,
        `rm -r ${tmp_dir}`,
        ...Object.keys(require(path.join(module_dir_path, "package.json")).peerDependencies || {})
            .map(peer_dep_module_name => `rm -r ${path.join(module_installation_dir_path, "node_modules", peer_dep_module_name)}`),
        `rm -rf ${path.join(module_installation_dir_path,".git")}`
    ].forEach(cmd => {

        console.log(cmd);

        child_process.execSync(cmd);

    });

}

if (require.main === module) {

    const target_module_name = process.env["MODULE_NAME"];


    Object.keys(dependencies)
        .filter(key => !!dependencies[key].match(/^file\:/))
        .filter(target_module_name === undefined ? (() => true) : (module_name => module_name === target_module_name))
        .forEach(module_name => doModule(module_name))
        ;

    console.log("DONE");

}










