import { P } from "pino";

export interface Logger {
    debug: P.LogFn;
    info: P.LogFn;
    warn: P.LogFn;
    error: P.LogFn;
}
