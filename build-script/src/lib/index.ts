
import * as path from "path";
import * as child_process from "child_process";
import * as fs_watch from "node-watch";

export const module_dir_path = path.join(__dirname, "..", "..");

export const fork = (modulePath: string, args: string[], options?: child_process.ForkOptions) =>
    new Promise<number>(
        (resolve, reject) => {

            const childProcess = child_process.fork(
                modulePath,
                args,
                options
            );

            const onExit = () => childProcess.kill();

            process.once("exit", onExit);

            childProcess.once(
                "exit",
                code => {

                    process.removeListener("exit", onExit);

                    if (code === 0) {
                        resolve(0);
                    } else {
                        reject(new Error(`exited with ${code}`));
                    }

                }
            );
        }
    );

export async function tsc(
    tsconfig_path: string,
    watch?: undefined | "WATCH"
) {

    console.log("tsc");

    if (!!watch) {
        await tsc(tsconfig_path);
    }

    const target_module_dir_path = path.dirname(tsconfig_path);

    const args: string[] = ["-p", tsconfig_path];

    if (!!watch) {

        args.push("-w");

    }

    const pr = fork(
        path.join(target_module_dir_path, "node_modules", "typescript", "bin", "tsc"),
        args,
        { "cwd": target_module_dir_path }
    );

    if (!watch) {
        return pr;
    }

}

export async function browserify(
    entry_point_file_path: string,
    dst_file_path: string,
    watch?: undefined | "WATCH"
) {

    console.log("browserify");

    if (!!watch) {
        await browserify(
            entry_point_file_path,
            dst_file_path
        );
    }

    //NOTE: If lessify is required it must be in the page dev-dependencies.
    const pr = fork(
        path.join(module_dir_path, "node_modules", !!watch ? "watchify" : "browserify", "bin", "cmd"),
        [
            "-e", path.resolve(entry_point_file_path),
            "-t", "html2js-browserify",
            "-t", "lessify",
            "-t", "brfs",
            "-o", path.resolve(dst_file_path)
        ],
        { "cwd": module_dir_path }
    );

    if (!watch) {
        return pr;
    }

}

async function minify(
    file_path: string,
    watch?: undefined | "WATCH"
) {

    console.log("minify");

    if (!!watch) {
        await minify(file_path);
    }

    const run = () => fork(
        path.join(module_dir_path, "node_modules", "uglify-js", "bin", "uglifyjs"),
        [
            file_path,
            "-o",
            path.join(
                path.dirname(file_path),
                `${path.basename(file_path, ".js")}.min.js`
            )
        ]
    );


    if (!!watch) {

        fs_watch(file_path, ()=> run());

    }

    const pr = run();

    if (!watch) {
        return pr;
    }

}

export async function tsc_browserify_minify(
    tsconfig_path: string,
    entry_point_file_path: string,
    out_file_path: string,
    watch?: undefined | "WATCH"
) {

    await tsc(
        tsconfig_path,
        watch
    );

    await browserify(
        entry_point_file_path,
        out_file_path,
        watch
    );

    await minify(
        out_file_path,
        watch
    );

}

