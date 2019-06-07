const Router = require('koa-tree-router');


function getServiceMethod(httpMethod, isMany) {
  switch (httpMethod) {
    case 'GET': {
      return isMany ? 'getMany' : 'get';
    }
    case 'POST': {
      return 'post';
    }
    case 'PUT': {
      return isMany ? 'putMany' : 'put';
    }
    case 'PATCH': {
      return isMany ? 'patchMany' : 'patch';
    }
    case 'DELETE': {
      return isMany ? 'deleteMany' : 'delete';
    }

    default: {
      return null;
    }
  }
}


function createMiddleware(app) {
  if (!app || typeof app.start !== 'function') {
    throw new Error(`Parameter should be an oryx app. Got ${app}`);
  }

  const router = new Router();

  // Register routes
  for (const serviceName of Object.keys(app.services)) {
    const path = `/${serviceName}`;
    const idPath = `/${serviceName}/:id`;
    const service = app.services[serviceName];

    router.all(path, async (ctx) => {
      const { method: httpMethod } = ctx;
      const serviceMethod = getServiceMethod(httpMethod, true);

      const params = {
        query: ctx.query,
        route: ctx.params,
        body: ctx.request.body,
      };

      ctx.body = await service[serviceMethod](params);
    });

    router.all(idPath, async (ctx) => {
      const { method: httpMethod } = ctx;
      const serviceMethod = getServiceMethod(httpMethod, false);

      const params = {
        query: ctx.query,
        route: ctx.params,
        body: ctx.request.body,
      };

      const result = await service[serviceMethod](ctx.params.id, params);
      ctx.body = result;

      if (typeof result === 'undefined') {
        if (httpMethod === 'GET') {
          ctx.status = 404;
        }
      }
    });
  }

  return router.routes();
}


module.exports = createMiddleware;
