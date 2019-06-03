const compose = require('koa-compose');


function attachMiddleware(method, middleware = []) {
  if (typeof method !== 'function') {
    throw new Error(`Method parameter should be a function. Got ${method}`);
  }

  if (!Array.isArray(middleware)) {
    throw new Error(`Middleware parameter should be an array. Got ${middleware}`);
  }

  // Save original method
  const originalMethod = method;


  // Return new function with middleware wrapped
  return async (...args) => {
    const methodName = originalMethod.name;

    const context = {
      method: methodName,
    };

    let id;
    let requestParams;
    if (['get', 'put', 'patch', 'delete'].includes(methodName)) {
      [id, requestParams] = args;
    } else if (['post', 'getMany', 'putMany', 'patchMany', 'deleteMany'].includes(methodName)) {
      [requestParams] = args;
    }

    const { body, query = {} } = requestParams || {};
    Object.assign(context, {
      id,
      body,
      query,
    });

    // Create a middleware wrapper
    const originalMethodAsMiddleware = async (ctx, next) => {
      // If response is already set, no need to run the original method
      if (typeof ctx.response === 'undefined') {
        ctx.response = await originalMethod(...args);
      }

      next();
    };

    // Compose all middleware in to a single middleware
    const composedMiddleware = compose([
      ...middleware,
      originalMethodAsMiddleware, // Original method as last middleware
    ]);

    // Wait till all middleware is ran
    await new Promise((resolve) => {
      composedMiddleware(context, resolve);
    });

    // Return the response
    return context.response;
  };
}


class Service {
  constructor() {
    const serviceMethods = ['get', 'getOne', 'post', 'put', 'putOne', 'patch', 'patchOne', 'delete', 'deleteOne'];
    this.middleware = [];


    for (const method of serviceMethods) {
      if (typeof this[method] === 'function') {
        this[method] = attachMiddleware(this[method], this.middleware);
      }
    }
  }

  use(middleware) {
    this.middleware.push(middleware);
  }
}


module.exports = Service;
