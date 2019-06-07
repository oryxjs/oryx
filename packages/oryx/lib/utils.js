const compose = require('koa-compose');


const MIDDLEWARE = Symbol('@oryx/middleware');
const ORIGINAL = Symbol('@oryx/method');

function attachMiddleware(method, middleware, getContext) {
  if (typeof method !== 'function') {
    throw new Error(`Method parameter should be a function. Got ${method}`);
  }

  if (typeof getContext !== 'function') {
    throw new Error(`getContext parameter should be a function. Got ${getContext}`);
  }

  const originalMethod = method[ORIGINAL] || method;
  const existingMiddleware = method[MIDDLEWARE] || [];
  const newMiddleware = Array.isArray(middleware) ? middleware : [middleware];

  // Create new function with middleware wrapped
  async function methodWithMiddleware(...args) {
    const context = getContext(originalMethod, args);

    // Create a middleware wrapper
    const originalMethodAsMiddleware = async (ctx, next) => {
      // If response is already set, no need to run the original method
      if (typeof ctx.response === 'undefined') {
        ctx.response = await originalMethod.call(this, ...args);
      }

      next();
    };

    // Compose all middleware in to a single middleware
    const composedMiddleware = compose([
      ...existingMiddleware,
      ...newMiddleware,
      originalMethodAsMiddleware, // Original method as last middleware
    ]);

    // Wait for all middleware to run
    await new Promise((resolve) => {
      composedMiddleware(context, resolve);
    });

    // Return the response
    return context.response;
  }

  return Object.assign(methodWithMiddleware, {
    [MIDDLEWARE]: [...existingMiddleware, ...newMiddleware], // Save existing middleware
    [ORIGINAL]: originalMethod, // Save original method
  });
}

module.exports = {
  attachMiddleware,
};
