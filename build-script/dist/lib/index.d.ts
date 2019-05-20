/// <reference types="node" />
import * as child_process from "child_process";
export declare const module_dir_path: string;
export declare const fork: (modulePath: string, args: string[], options?: child_process.ForkOptions | undefined) => Promise<number>;
export declare function tsc(tsconfig_path: string, watch?: undefined | "WATCH"): Promise<number | undefined>;
export declare function browserify(entry_point_file_path: string, dst_file_path: string, watch?: undefined | "WATCH"): Promise<number | undefined>;
export declare function tsc_browserify_minify(tsconfig_path: string, entry_point_file_path: string, out_file_path: string, watch?: undefined | "WATCH"): Promise<void>;
