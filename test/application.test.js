const Oryx = require('../lib');


describe('Oryx application', () => {
  beforeAll(async () => {
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
});
