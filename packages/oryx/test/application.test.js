const EventEmitter = require('events');
const Oryx = require('../lib');


describe('Oryx application', () => {
  beforeEach(async () => {
    this.app = new Oryx();
  });

  test('should initialize', async () => {
    expect(this.app).toBeTruthy();
  });


  describe('Logger', () => {
    test('should implement logger methods', async () => {
      expect(typeof this.app.log).toBe('function');
      expect(typeof this.app.info).toBe('function');
      expect(typeof this.app.debug).toBe('function');
      expect(typeof this.app.error).toBe('function');
      expect(typeof this.app.warn).toBe('function');
    });

    test('should use the custom logger if passed', async () => {
      const customLogger = {
        log: jest.fn(),
      };

      const appWithLogger = new Oryx({ logger: customLogger });
      expect(appWithLogger.log).toBe(customLogger.log);

      appWithLogger.log('custom logger works');
      expect(customLogger.log).toBeCalledWith('custom logger works');
    });
  });


  describe('Event Emitter', () => {
    test('should be an instance of EventEmitter', async () => {
      expect(this.app).toBeInstanceOf(EventEmitter);
    });
  });


  describe('Context', () => {
    test('should be able to set and get items to app context', async () => {
      this.app.set('version', 123);
      expect(this.app.get('version')).toEqual(123);
    });
  });


  describe('Service', () => {
    test('should load service', async () => {
      class TestService extends Oryx.Service {
        start() { }
      }

      this.app.service('test', new TestService());
      expect(this.app.service('test')).toBeInstanceOf(TestService);
    });

    test('should throw an error if service name already exists', async () => {
      expect(() => {
        this.app.service('test', new Oryx.Service());
        this.app.service('test', new Oryx.Service());
      }).toThrow('A service with name "test" already exists.');
    });

    test('should throw an error if not an instance of Oryx.Service', async () => {
      expect(() => {
        this.app.service('test', {});
      }).toThrow('Service "test" is not an instance of Oryx.Service.');
    });

    test('should return the created service', async () => {
      class TestService extends Oryx.Service {
        start() { }
      }
      const testService = new TestService();

      const loadedService = this.app.service('test', testService);
      expect(loadedService).toBe(testService);
    });

    test('should return service on calling app.service()', async () => {
      class TestService extends Oryx.Service {
        start() { }
      }
      const testService = new TestService();

      this.app.service('test', testService);

      expect(this.app.service('test')).toBe(testService);
    });
  });


  test('should wait for all services to start on app.start()', async () => {
    const fn = jest.fn();

    class TestService extends Oryx.Service {
      async start() {
        fn('test service started');
      }
    }

    class TestService2 extends Oryx.Service {
      start() {
        return new Promise(resolve => setTimeout(() => {
          fn('test service 2 started');
          resolve();
        }, 100));
      }
    }

    this.app.service('test', new TestService());
    this.app.service('test2', new TestService2());

    await this.app.start();

    expect(fn).toBeCalledTimes(2);
    expect(fn).toBeCalledWith('test service started');
    expect(fn).toBeCalledWith('test service 2 started');
  });

  test('should not start if any service throws an error', async () => {
    class TestService extends Oryx.Service {
      async start() {
        throw new Error('Failed to start');
      }
    }

    try {
      this.app.service('test', new TestService());
      await this.app.start();
    } catch (e) {
      expect(e.message).toEqual('Failed to start');
    }
  });

  test('should be able to register middleware for start', async () => {
    const fn = jest.fn();

    const appMiddlware = async ({ app }, next) => {
      fn(app);
      app.set('hello', 'world');
      await next();
      fn(app.get('hello'));
    };

    this.app.start.use(appMiddlware);
    await this.app.start();

    expect(fn).toBeCalledTimes(2);
    expect(fn).toBeCalledWith(this.app);
    expect(fn).toBeCalledWith('world');
  });
});
