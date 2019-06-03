const Oryx = require('@oryx/oryx');
const createMiddleware = require('../');


describe('Oryx application', () => {
  beforeEach(async () => {
    this.app = new Oryx();
  });

  test('should accept oryx and return middleware', () => {
    const middleware = createMiddleware(this.app);

    expect(typeof middleware).toBe('function');
  });
});
