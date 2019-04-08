

if (typeof ArrayBuffer.isView !== "function" ) {

    Object.defineProperty(
        ArrayBuffer,
        "isView", 
        { "value": function isView() { return false; } }
    );

}

if (typeof String.prototype.startsWith !== "function") {

    String.prototype.startsWith = function startsWith(str){
      return this.indexOf(str) === 0;
    };

}