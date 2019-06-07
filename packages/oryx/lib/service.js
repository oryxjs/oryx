const { attachMiddleware } = require('./utils');


class Service {
  constructor() {
    this.serviceMethods = [
      'get', 'post', 'put', 'patch', 'delete', 'getMany', 'putMany', 'patchMany', 'deleteMany',
    ].filter(method => typeof this[method] === 'function');

    this.createMiddlewareContext = (originalMethod, args) => {
      // Prepare context
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

      return context;
    };

    // Add use method to all existing methods
    for (const method of this.serviceMethods) {
      this[method].use = (methodMiddleware) => {
        this[method] = attachMiddleware(this[method], methodMiddleware, this.createMiddlewareContext);
      };
    }
  }

  use(middleware) {
    for (const method of this.serviceMethods) {
      this[method] = attachMiddleware(this[method], middleware, this.createMiddlewareContext);
    }
  }
}


module.exports = Service;
