const EventEmitter = require('events');
const Service = require('./service');
const { attachMiddleware } = require('./utils');


class Application extends EventEmitter {
  constructor(settings = {}) {
    super();

    this.services = {};
    this.context = {};


    // Setup logger
    this.logger = settings.logger || console;
    for (const method of ['log', 'info', 'debug', 'error', 'warn']) {
      if (this.logger[method]) {
        this[method] = this.logger[method];
      }
    }

    this.start.use = (middleware) => {
      this.start = attachMiddleware(this.start, middleware, () => ({ app: this }));
    };
  }

  set(key, value) {
    this.context[key] = value;
  }

  get(key) {
    return this.context[key];
  }

  service(name, service) {
    if (typeof name !== 'string') {
      throw new Error(`Invaid service name "${name}".`);
    }

    // If second param is not set, return the service
    if (service === undefined) {
      return this.services[name];
    }

    if (service instanceof Service === false) {
      throw new Error(`Service "${name}" is not an instance of Oryx.Service.`);
    }

    if (this.services[name]) {
      throw new Error(`A service with name "${name}" already exists.`);
    }

    this.services[name] = service;
    return this.services[name];
  }


  async start() {
    for (const name of Object.keys(this.services)) {
      try {
        await this.services[name].start(this); /* eslint-disable-line no-await-in-loop */
      } catch (e) {
        throw e;
      }
    }

    return this;
  }
}


module.exports = Application;
