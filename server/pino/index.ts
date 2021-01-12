import logger from "pino-http";
import pino from "pino";

// https://cloud.google.com/logging/docs/reference/v2/rest/v2/LogEntry#logseverity
const PinoLevelToSeverityLookup = {
    trace: "DEBUG",
    debug: "DEBUG",
    info: "INFO",
    warn: "WARNING",
    error: "ERROR",
    fatal: "CRITICAL",
};

const defaultPinoConf = {
    messageKey: "message",
    formatters: {
        level(label: any, number: any) {
            return {
                // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                // @ts-ignore
                severity: PinoLevelToSeverityLookup[label] || PinoLevelToSeverityLookup["info"],
                level: number,
            };
        },
        log(message: any) {
            return {message};
        },
    },
    serializers: {
        err: pino.stdSerializers.err,
        req: (req: any) => ({
            method: req.method,
            url: req.url,
            user: req.raw.user,
            // other: req.raw
        }),
    },
};

export default function createLogger(options: any = {autoLogging: false}) {
    return logger(Object.assign({}, options, defaultPinoConf));
}
