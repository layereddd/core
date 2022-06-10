"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Usage = void 0;
class Usage {
    constructor(logger, config) {
        this.logger = logger;
        this.config = config;
        this.cfg = this.config.usage;
        this.cpuUsage = process.cpuUsage();
    }
    async init() {
        // do nothing
    }
    async start() {
        this.timer = setInterval(() => {
            const cpuUsage = process.cpuUsage();
            const memUsage = process.memoryUsage();
            this.logger.info('usage', {
                step: 'data',
                target: 'memory',
                data: {
                    value: Object.keys(memUsage).map((key) => {
                        const val = Math.floor(memUsage[key] / 1024 / 1024);
                        return `${key}: ${val}`;
                    }).join(', '),
                },
            });
            this.logger.info('usage', {
                step: 'data',
                target: 'cpu',
                data: {
                    value: Object.keys(cpuUsage).map((key) => {
                        const val = ((cpuUsage[key] - this.cpuUsage[key]) / 1e4 / this.cfg.interval).toFixed(2);
                        return `${key}: ${val}`;
                    }).join(', '),
                },
            });
            this.cpuUsage = cpuUsage;
        }, this.cfg.interval * 1000);
    }
    async stop() {
        clearInterval(this.timer);
    }
}
exports.Usage = Usage;
