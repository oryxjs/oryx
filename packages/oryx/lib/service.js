const { attachMiddleware } = require('./utils');


class Service {
  constructor() {
    this.serviceMethods = [
      'get', 'post', 'put', 'patch', 'delete', 'getMany', 'putMany', 'patchMany', 'deleteMany',
    ].filter(method => typeof this[method] === 'function');

    // Add use method to all existing methods
    for (const method of this.serviceMethods) {
      this[method].use = (methodMiddleware) => {
        this[method] = attachMiddleware(this[method], methodMiddleware);
      };
    }
  }

  use(middleware) {
    for (const method of this.serviceMethods) {
      this[method] = attachMiddleware(this[method], middleware);
    }
  }
}


module.exports = Service;
