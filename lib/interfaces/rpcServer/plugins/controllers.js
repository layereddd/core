"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerControllers = void 0;
const controller_helper_1 = require("./controller-helper");
async function registerControllers(app, controllersList) {
    app.locals.controllers = controllersList;
    app.locals.methods = {};
    (0, controller_helper_1.applyControllers)(app);
}
exports.registerControllers = registerControllers;
