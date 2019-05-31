const Oryx = require('../lib');


describe('Oryx application', () => {
  beforeAll(async () => {
    this.app = new Oryx();
  });

  test('should initialize', async () => {
    expect(this.app).toBeTruthy();
  });
});
