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


  describe('Service', () => {
    test('should load service', async () => {
      class TestService extends Oryx.Service {
        start() { }
      }

      this.app.load('test', new TestService());
      expect(this.app.service('test')).toBeInstanceOf(TestService);
    });

    test('should throw an error if service name already exists', async () => {
      expect(() => {
        this.app.load('test', new Oryx.Service());
        this.app.load('test', new Oryx.Service());
      }).toThrow('A service with name "test" is already loaded.');
    });

    test('should throw an error if not an instance of Oryx.Service', async () => {
      expect(() => {
        this.app.load('test', {});
      }).toThrow('Service "test" is not an instance of Oryx.Service.');
    });

    test('should return the created service', async () => {
      class TestService extends Oryx.Service {
        start() { }
      }
      const testService = new TestService();

      const loadedService = this.app.load('test', testService);
      expect(loadedService).toBe(testService);
    });

    test('should return service on calling app.service()', async () => {
      class TestService extends Oryx.Service {
        start() { }
      }
      const testService = new TestService();

      this.app.load('test', testService);

      expect(this.app.service('test')).toBe(testService);
    });
  });
});
