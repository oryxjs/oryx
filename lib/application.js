
class Application {
  constructor(settings = {}) {
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
}

module.exports = Application;
