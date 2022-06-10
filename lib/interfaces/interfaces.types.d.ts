import {IAsyncInit} from '../IAsyncInit';

export interface IInterface extends IAsyncInit {
	getPort (): number;
}