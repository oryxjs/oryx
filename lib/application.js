const EventEmitter = require('events');
const Service = require('./service');


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
  }

  load(name, service) {
    if (typeof name !== 'string') {
      throw new Error(`Invaid service name "${name}".`);
    }

    if (service instanceof Service === false) {
      throw new Error(`Service "${name}" is not an instance of Oryx.Service.`);
    }

    if (this.services[name]) {
      throw new Error(`A service with name "${name}" is already loaded.`);
    }

    this.services[name] = service;
    return this.services[name];
  }

  service(name) {
    return this.services[name];
  }
}


module.exports = Application;
