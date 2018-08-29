import { ExpressHttpLoggerOptions } from './interfaces/express-http-logger-options.interface';
import { ExpressMiddleware } from './interfaces/express-middleware.type';

export class ExpressHttpLogger {
    logger: any;
    ignoreUrls: string[];

    constructor(logger: any, options?: ExpressHttpLoggerOptions) {
        this.logger = logger;
        this.ignoreUrls = options && options.ignoreUrls;
    }

    log(): ExpressMiddleware {
        return (req: any, res: any, next: any) => {
            // check if not ignored
            if (!this.isIgnoredEnpoint(req.originalUrl)) {
                const startedAt = new Date();
                res.once('finish', async () => {
                    const endedAt = new Date();
                    const duration = endedAt.getTime() - startedAt.getTime();

                    const message = `${req.protocol} - ${this.getRemoteAddress(req)} -- "${req.method} ${req.url}" ${res.statusCode} "${req.headers['user-agent']}" -- took ${duration}ms`;

                    // TODO: have option that defaults to "auto" for levels, or they can set what level?
                    if (res.statusCode < 300) {
                        this.logger.info(message);
                    }
                    else if (res.statusCode >= 300 && res.statusCode < 400) {
                        this.logger.warn(message);
                    }
                    else {
                        this.logger.error(message);
                    }
                });
            }

            next();
        }
    }

    private isIgnoredEnpoint(originalUrl: string): boolean {
        if (this.ignoreUrls && this.ignoreUrls.length > 0) {
            return this.ignoreUrls.some((url) => originalUrl.indexOf(url) !== -1);
        }
        return false;
    }

    private getRemoteAddress(req: any): string {
        return req.headers['x-forwarded-for'] ||
            req.ip ||
            req._remoteAddress ||
            (req.socket &&
                (req.socket.remoteAddress ||
                    (req.socket.socket && req.socket.socket.remoteAddress)
                )
            );
    }
}
