const colors = {
  info: '\x1b[36m',  // Cyan
  warn: '\x1b[33m',  // Yellow
  error: '\x1b[31m', // Red
  debug: '\x1b[90m', // Gray
  reset: '\x1b[0m'
};

const formatMessage = (level, message, meta) => {
  const timestamp = new Date().toISOString();
  const isProduction = process.env.NODE_ENV === 'production';

  // Handle error objects inside meta or message
  let parsedMeta = meta;
  if (meta instanceof Error) {
    parsedMeta = {
      message: meta.message,
      stack: meta.stack,
      ...meta
    };
  } else if (meta && typeof meta === 'object' && meta.error instanceof Error) {
    parsedMeta = {
      ...meta,
      error: {
        message: meta.error.message,
        stack: meta.error.stack
      }
    };
  }

  if (isProduction) {
    // Structured JSON logging for ELK/Datadog/CloudWatch
    return JSON.stringify({
      timestamp,
      level,
      message: message instanceof Error ? message.message : message,
      stack: message instanceof Error ? message.stack : undefined,
      ...(parsedMeta && typeof parsedMeta === 'object' ? parsedMeta : { meta: parsedMeta })
    });
  }

  // Readable, colorized console logging for local development
  const color = colors[level] || colors.reset;
  
  let metaStr = '';
  if (parsedMeta) {
    if (parsedMeta.stack) {
      metaStr = `\n${parsedMeta.stack}`;
    } else {
      metaStr = ` ${JSON.stringify(parsedMeta, null, 2)}`;
    }
  }
  
  const displayMsg = message instanceof Error ? message.stack : message;
  return `[${timestamp}] ${color}${level.toUpperCase()}${colors.reset}: ${displayMsg}${metaStr}`;
};

const logger = {
  info: (message, meta) => console.log(formatMessage('info', message, meta)),
  warn: (message, meta) => console.warn(formatMessage('warn', message, meta)),
  error: (message, meta) => console.error(formatMessage('error', message, meta)),
  debug: (message, meta) => {
    if (process.env.NODE_ENV !== 'production' || process.env.LOG_LEVEL === 'debug') {
      console.log(formatMessage('debug', message, meta));
    }
  }
};

module.exports = logger;
