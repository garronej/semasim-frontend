"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/** semasim.com or dev.semasim.com */
exports.baseDomain = window.location.href.match(/^https:\/\/web\.([^\/]+)/)[1];
//NOTE: Defined at ejs building in templates/head_common.ejs
exports.assetsRoot = window["assets_root"];
exports.isDevEnv = window["isDevEnv"];
