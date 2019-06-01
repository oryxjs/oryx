const Oryx = require('../lib');


describe('Oryx service', () => {
  beforeEach(async () => {
    class TestService extends Oryx.Service {
      get(id) {
        return { value: id };
      }
    }

    this.testService = new TestService();
  });

  test('should be able to register middleware', async () => {
    const fn = jest.fn();

    const testMw = async (context, next) => {
      fn('before');
      await next();
      fn('after');
    };

    this.testService.use(testMw);

    await this.testService.get(123);

    expect(fn).toBeCalledTimes(2);
    expect(fn).toBeCalledWith('before');
    expect(fn).toBeCalledWith('after');
  });
});
