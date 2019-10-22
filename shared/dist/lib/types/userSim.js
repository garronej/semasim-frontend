"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var UserSim;
(function (UserSim) {
    var Owned;
    (function (Owned) {
        function match(userSim) {
            return userSim.ownership.status === "OWNED";
        }
        Owned.match = match;
    })(Owned = UserSim.Owned || (UserSim.Owned = {}));
    var Shared;
    (function (Shared) {
        function match(userSim) {
            return Confirmed.match(userSim) || NotConfirmed.match(userSim);
        }
        Shared.match = match;
        var Confirmed;
        (function (Confirmed) {
            function match(userSim) {
                return userSim.ownership.status === "SHARED CONFIRMED";
            }
            Confirmed.match = match;
        })(Confirmed = Shared.Confirmed || (Shared.Confirmed = {}));
        var NotConfirmed;
        (function (NotConfirmed) {
            function match(userSim) {
                return userSim.ownership.status === "SHARED NOT CONFIRMED";
            }
            NotConfirmed.match = match;
        })(NotConfirmed = Shared.NotConfirmed || (Shared.NotConfirmed = {}));
    })(Shared = UserSim.Shared || (UserSim.Shared = {}));
    var Usable;
    (function (Usable) {
        function match(userSim) {
            return Owned.match(userSim) || Shared.Confirmed.match(userSim);
        }
        Usable.match = match;
    })(Usable = UserSim.Usable || (UserSim.Usable = {}));
})(UserSim = exports.UserSim || (exports.UserSim = {}));
