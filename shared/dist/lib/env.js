"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/** semasim.com or dev.semasim.com */
exports.baseDomain = window.location.href.match(/^https:\/\/web\.([^\/]+)/)[1];
exports.assetsRoot = window["assets_root"];
exports.isProd = exports.assetsRoot !== "/";
