const Koa = require('koa');
const axios = require('axios');
const Oryx = require('@oryx/oryx');
const bodyParser = require('koa-bodyparser');
const createMiddleware = require('../');


describe('Oryx application', () => {
  test('should accept oryx and return middleware', () => {
    const middleware = createMiddleware(new Oryx());
    expect(typeof middleware).toBe('function');
  });

  test('should throw if the paramter is not an oryx app', () => {
    expect(() => {
      createMiddleware('bad');
    }).toThrow('Parameter should be an oryx app. Got bad');
  });


  describe('Routing', () => {
    beforeAll(async () => {
      class ConfigService extends Oryx.Service {
        async get(id) {
          return this.config.find(c => c.id === id);
        }

        async getMany() {
          return this.config;
        }

        async post({ body = {} }) {
          const { id, value, label } = body;
          this.config.push({ id, value, label });

          return this.config.find(c => c.id === id);
        }

        async put(id, { body = {} }) {
          const { value, text } = body;
          const config = this.config.find(c => c.id === id);
          config.value = value;
          config.text = text;

          return this.config.find(c => c.id === id);
        }

        async patch(id, { body = {} }) {
          const { value, text } = body;
          const config = this.config.find(c => c.id === id);
          if (typeof value !== 'undefined') {
            config.value = value;
          }
          if (typeof text !== 'undefined') {
            config.text = text;
          }

          return this.config.find(c => c.id === id);
        }

        async delete(id) {
          this.config = this.config.filter(c => c.id !== id);
        }
      }

      this.app = new Oryx();
      this.configService = new ConfigService();
      this.app.load('config', this.configService);

      const koa = new Koa();
      const oryxMiddleware = createMiddleware(this.app);
      koa.use(bodyParser({ enableTypes: ['json'] }));
      koa.use(oryxMiddleware);
      this.server = koa.listen(9779);

      this.axiosInstance = axios.create({
        baseURL: 'http://localhost:9779/',
        timeout: 1000,
        headers: { 'X-Custom-Header': 'foobar' },
      });
    });

    beforeEach(() => {
      this.configService.config = [{
        id: 'one',
        value: 1,
        text: 'One',
      }];
    });

    afterAll(() => {
      this.server.close();
    });

    test('should route GET request to get service method', async () => {
      const { data } = await this.axiosInstance.get('/config');
      expect(data).toEqual([{ id: 'one', value: 1, text: 'One' }]);
    });

    test('should route GET /:id request to getOne service method', async () => {
      const { data } = await this.axiosInstance.get('/config/one');
      expect(data).toEqual({ id: 'one', value: 1, text: 'One' });
    });

    test('should route POST request to post service method', async () => {
      const { data } = await this.axiosInstance.post('/config', { id: 'two', value: 2, label: 'Two' });
      expect(data).toEqual({ id: 'two', value: 2, label: 'Two' });

      const { data: getData } = await this.axiosInstance.get('/config/two');
      expect(getData).toEqual({ id: 'two', value: 2, label: 'Two' });
    });

    test('should route PUT request to put service method', async () => {
      const { data } = await this.axiosInstance.put('/config/one', { value: -1, text: 'Minus One' });
      expect(data).toEqual({ id: 'one', value: -1, text: 'Minus One' });

      const { data: getData } = await this.axiosInstance.get('/config/one');
      expect(getData).toEqual({ id: 'one', value: -1, text: 'Minus One' });
    });

    test('should route PATCH request to patch service method', async () => {
      const { data } = await this.axiosInstance.patch('/config/one', { value: 11 });
      expect(data).toEqual({ id: 'one', value: 11, text: 'One' });

      const { data: getData } = await this.axiosInstance.get('/config/one');
      expect(getData).toEqual({ id: 'one', value: 11, text: 'One' });
    });

    test('should route DELETE request to delete service method', async () => {
      const result = await this.axiosInstance.delete('/config/one');
      expect(result.status).toEqual(204);

      try {
        const getResult = await this.axiosInstance.get('/config/one');
        expect(getResult.status).toEqual(404);
      } catch (e) {}
    });
  });
});
