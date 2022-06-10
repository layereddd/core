"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.method = void 0;
require("reflect-metadata");
function method(methodData) {
    return function (target, propertyKey, descriptor) {
        Reflect.defineMetadata('method:data', methodData, target, propertyKey);
    };
}
exports.method = method;
