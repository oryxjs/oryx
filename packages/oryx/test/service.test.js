const Oryx = require('../lib');


describe('Oryx service', () => {
  beforeEach(async () => {
    class TestService extends Oryx.Service {
      constructor() {
        super('test');
      }

      get(id) {
        return { value: id };
      }

      post({ data }) {
        return data;
      }
    }

    this.testService = new TestService();
  });

  test('should run registered middleware upon calling the method', async () => {
    const fn = jest.fn();

    const middleware = async (context, next) => {
      fn('before');
      await next();
      fn('after');
    };

    this.testService.use(middleware);

    await this.testService.get(123);

    expect(fn).toBeCalledTimes(2);
    expect(fn).toBeCalledWith('before');
    expect(fn).toBeCalledWith('after');
  });

  test('should run registered middleware in the same order', async () => {
    const fn = jest.fn();

    const middleware1 = async (context, next) => {
      fn('middleware1 before');
      await next();
      fn('middleware1 after');
    };

    const middleware2 = async (context, next) => {
      fn('middleware2 before');
      await next();
      fn('middleware2 after');
    };

    this.testService.use(middleware1);
    this.testService.use(middleware2);

    await this.testService.get(123);

    expect(fn).toHaveBeenNthCalledWith(1, 'middleware1 before');
    expect(fn).toHaveBeenNthCalledWith(2, 'middleware2 before');
    expect(fn).toHaveBeenNthCalledWith(3, 'middleware2 after');
    expect(fn).toHaveBeenNthCalledWith(4, 'middleware1 after');
  });

  test('should call middleware with context containing id and params', async () => {
    const fn = jest.fn();

    const middleware1 = async (context, next) => {
      fn(context.id);
      fn(context.method);
      fn(context.query);
      await next();
      fn(context.response);
    };

    this.testService.use(middleware1);

    const finalResult = await this.testService.get(100);

    expect(fn).toHaveBeenNthCalledWith(1, 100);
    expect(fn).toHaveBeenNthCalledWith(2, 'get');
    expect(fn).toHaveBeenNthCalledWith(3, {});
    expect(fn).toHaveBeenNthCalledWith(4, { value: 100 });
    expect(finalResult).toStrictEqual({ value: 100 });
  });

  test('should preserve context across middleware', async () => {
    const fn = jest.fn(a => ({ ...a }));

    const middleware1 = async (context, next) => {
      await next();
      fn(context.response);
      context.response.value -= 10;
    };

    const middleware2 = async (context, next) => {
      await next();
      fn(context.response);
      context.response.value += 20;
    };

    this.testService.use(middleware1);
    this.testService.use(middleware2);

    const finalResult = await this.testService.get(100);

    expect(fn).toHaveNthReturnedWith(1, { value: 100 }); // from middleware2
    expect(fn).toHaveNthReturnedWith(2, { value: 120 }); // from middleware1
    expect(finalResult).toStrictEqual({ value: 110 });
  });

  test('should run middleware registered for specific method', async () => {
    const fn = jest.fn(a => ({ ...a }));

    const middleware = async (context, next) => {
      fn({ middleware: 'all', method: context.method });
      await next();
    };

    const postMiddleware = async (context, next) => {
      fn({ middleware: 'post', method: context.method });
      await next();
    };

    this.testService.post.use(postMiddleware);
    this.testService.use(middleware);

    await this.testService.post({ value: 100 });
    await this.testService.get({ value: 100 });

    expect(fn).toHaveNthReturnedWith(1, { middleware: 'post', method: 'post' });
    expect(fn).toHaveNthReturnedWith(2, { middleware: 'all', method: 'post' });
    expect(fn).toHaveNthReturnedWith(3, { middleware: 'all', method: 'get' });
    expect(fn).toHaveBeenCalledTimes(3); // Ensure postMiddleware not called for get()
  });

  test('should not call original method if context.response is set', async () => {
    const middleware1 = async (context, next) => {
      context.response = { value: 10 };
      await next();
    };

    this.testService.use(middleware1);
    const finalResult = await this.testService.get(100);

    expect(finalResult).toStrictEqual({ value: 10 });
  });
});
