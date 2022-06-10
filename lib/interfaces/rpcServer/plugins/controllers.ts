import {Express} from 'express';
import {applyControllers} from './controller-helper';


export async function registerControllers (app: Express, controllersList: any[]) {
	app.locals.controllers = controllersList;

	app.locals.methods = {};

	applyControllers(app);
}
