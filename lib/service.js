const compose = require('koa-compose');


function attachMiddleware(method, middleware = []) {
  if (typeof method !== 'function') {
    throw new Error(`Method parameter is not a function. Got ${method}`);
  }

  if (!Array.isArray(middleware)) {
    throw new Error(`Middleware parameter middleware is not an array. Got ${middleware}`);
  }

  // Save original method
  const originalMethod = method;

  // Create a middleware wrapper
  const methodMiddleware = async (ctx, next) => {
    const { result, ...restContext } = ctx;

    if (!ctx.result) {
      ctx.result = await originalMethod(restContext);
    }

    next();
  };

  // Return new function with middleware wrapped
  return async (context) => {
    const composedMiddleware = compose([...middleware, methodMiddleware]);

    await new Promise((resolve, reject) => {
      composedMiddleware(context, resolve);
    });

    return context.result;
  };
}


class Service {
  constructor() {
    const serviceMethods = ['get', 'getMany', 'post', 'put', 'patch', 'delete'];
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
