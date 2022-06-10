
export interface IAsyncInit {
	init(): Promise<void>;

	start(): Promise<void>;

	stop(): Promise<void>;
}
