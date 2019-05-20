var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var __values = (this && this.__values) || function (o) {
    var m = typeof Symbol === "function" && o[Symbol.iterator], i = 0;
    if (m) return m.call(o);
    return {
        next: function () {
            if (o && i >= o.length) o = void 0;
            return { value: o && o[i++], done: !o };
        }
    };
};
var _this = this;
/*
NOTE: If we impory with typescypt the whole module is considered
as a node modules ( all @types/node are imported ) and we don't
want that.
*/
var build_script = require("../../../build-script/dist/lib");
var path = require("path");
var fs = require("fs");
(function () { return __awaiter(_this, void 0, void 0, function () {
    var e_1, _a, test_dir_path, _b, _c, name_1, entry_point_file_path, bundled_file_path, html_file_path, e_1_1;
    return __generator(this, function (_d) {
        switch (_d.label) {
            case 0:
                test_dir_path = path.join(__dirname, "..", "..", "dist", "test");
                _d.label = 1;
            case 1:
                _d.trys.push([1, 6, 7, 8]);
                _b = __values(["crypto", "encoding"]), _c = _b.next();
                _d.label = 2;
            case 2:
                if (!!_c.done) return [3 /*break*/, 5];
                name_1 = _c.value;
                entry_point_file_path = path.join(test_dir_path, name_1 + ".js");
                bundled_file_path = path.join(test_dir_path, "bundled-" + name_1 + ".js");
                return [4 /*yield*/, build_script.browserify(entry_point_file_path, bundled_file_path)];
            case 3:
                _d.sent();
                console.log(entry_point_file_path + " -> browserify -> " + bundled_file_path);
                html_file_path = path.join(test_dir_path, name_1 + ".html");
                fs.writeFileSync(html_file_path, Buffer.from([
                    "<!DOCTYPE html>",
                    "<html lang=\"en\">",
                    "  <head>",
                    "    <meta charset=\"utf-8\">",
                    "    <title>title</title>",
                    "",
                    "    <script src=\"./" + path.basename(bundled_file_path) + "\"></script>",
                    "  </head>",
                    "  <body>",
                    "    <h1>running " + name_1 + ".js (CTRL + MAJ + i)</h1>",
                    "  </body>",
                    "</html>"
                ].join("\n"), "utf8"));
                console.log(html_file_path + " created/updated");
                _d.label = 4;
            case 4:
                _c = _b.next();
                return [3 /*break*/, 2];
            case 5: return [3 /*break*/, 8];
            case 6:
                e_1_1 = _d.sent();
                e_1 = { error: e_1_1 };
                return [3 /*break*/, 8];
            case 7:
                try {
                    if (_c && !_c.done && (_a = _b.return)) _a.call(_b);
                }
                finally { if (e_1) throw e_1.error; }
                return [7 /*endfinally*/];
            case 8: return [2 /*return*/];
        }
    });
}); })();
