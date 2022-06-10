import {Express} from 'express';
import {processControllers} from './controllers-helper';

// import {registerSwagger} from '../plugins/swagger-helper';

export function registerControllers (app: Express, authList: any[], controllersList: any[]): void {
	app.locals.auth = authList;
	app.locals.controllers = controllersList;

	processControllers(app);

	// registerSwagger(app); // temporary switched off
}
