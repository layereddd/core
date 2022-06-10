"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Timer = void 0;
class Timer {
    constructor(logger, config, tickersList) {
        this.logger = logger;
        this.config = config;
        this.tickersList = tickersList;
        this.cfg = this.config.timer;
        this.isStopped = false;
    }
    async init() {
        // do nothing
    }
    async start() {
        setTimeout(async () => {
            await this.process();
        }, this.cfg.interval).unref();
    }
    async stop() {
        this.isStopped = true;
    }
    async process() {
        if (this.isStopped) {
            return;
        }
        try {
            for (const ticker of this.tickersList) {
                await ticker.tick();
            }
        }
        catch (err) {
            this.logger.error('Timer process error');
            this.logger.error(err.toString());
        }
        setTimeout(async () => {
            await this.process();
        }, this.cfg.interval).unref();
    }
}
exports.Timer = Timer;
