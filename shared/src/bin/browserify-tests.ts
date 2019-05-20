
declare const require: any;
declare const Buffer: any;
/*
NOTE: If we impory with typescypt the whole module is considered
as a node modules ( all @types/node are imported ) and we don't 
want that. 
*/
const build_script= require("../../../build-script/dist/lib");
const path= require("path");
const fs= require("fs");

declare const __dirname: string;

(async () => {

    const test_dir_path = path.join(__dirname, "..", "..", "dist", "test");

    for (const name of ["crypto", "encoding"]) {

        const entry_point_file_path = path.join(test_dir_path, `${name}.js`);
        const bundled_file_path = path.join(test_dir_path, `bundled-${name}.js`);

        await build_script.browserify(
            entry_point_file_path,
            bundled_file_path
        );

        console.log(`${entry_point_file_path} -> browserify -> ${bundled_file_path}`);

        const html_file_path = path.join(test_dir_path, `${name}.html`);

        fs.writeFileSync(
            html_file_path,
            Buffer.from(
                [
                    `<!DOCTYPE html>`,
                    `<html lang="en">`,
                    `  <head>`,
                    `    <meta charset="utf-8">`,
                    `    <title>title</title>`,
                    ``,
                    `    <script src="./${path.basename(bundled_file_path)}"></script>`,
                    `  </head>`,
                    `  <body>`,
                    `    <h1>running ${name}.js (CTRL + MAJ + i)</h1>`,
                    `  </body>`,
                    `</html>`
                ].join("\n"),
                "utf8"
            )
        );

        console.log(`${html_file_path} created/updated`);

    }

})();
