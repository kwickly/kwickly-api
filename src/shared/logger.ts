import pino from 'pino';

// Define the transport for pretty logging in development, standard JSON in production
const transport =
  process.env.NODE_ENV !== 'production'
    ? {
        target: 'pino-pretty',
        options: {
          colorize: true,
          ignore: 'pid,hostname',
          translateTime: 'SYS:standard',
        },
      }
    : undefined;

// Create the global logger instance
export const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
  formatters: {
    level: (label) => {
      return { level: label };
    },
  },
  timestamp: pino.stdTimeFunctions.isoTime,
}, transport ? pino.transport(transport) : undefined);

// Elysia middleware to inject trace_id and user_id context into logs
export const loggerPlugin = (app: any) =>
  app.derive(({ request, set }: any) => {
    // Generate a trace_id for this request if not provided
    const traceId = request.headers.get('x-trace-id') || crypto.randomUUID();
    
    // Make sure we pass the trace_id forward
    if (set && set.headers) {
      set.headers['x-trace-id'] = traceId;
    }

    // Create a child logger that will append traceId to all logs from this request
    const reqLogger = logger.child({ trace_id: traceId });

    return {
      log: reqLogger,
      traceId,
    };
  }).onBeforeHandle(({ log, request }: any) => {
    const url = new URL(request.url);
    log.info({ method: request.method, path: url.pathname }, 'Incoming Request');
  }).onError(({ log, error, code }: any) => {
    log.error({ err: error, code }, 'Request Error');
  });
