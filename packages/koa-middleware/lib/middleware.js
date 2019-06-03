function createMiddleware(app) {
  if (!app || typeof app.start !== 'function') {
    throw new Error('Parameter should be an oryx app. Got {app}');
  }

  return (req, res, next) => {
    next();
  };
}


module.exports = createMiddleware;
