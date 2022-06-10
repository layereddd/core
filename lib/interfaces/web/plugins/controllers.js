"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerControllers = void 0;
const controllers_helper_1 = require("./controllers-helper");
// import {registerSwagger} from '../plugins/swagger-helper';
function registerControllers(app, authList, controllersList) {
    app.locals.auth = authList;
    app.locals.controllers = controllersList;
    (0, controllers_helper_1.processControllers)(app);
    // registerSwagger(app); // temporary switched off
}
exports.registerControllers = registerControllers;
