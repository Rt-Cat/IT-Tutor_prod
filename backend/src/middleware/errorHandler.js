module.exports = (err, req, res, next) => {
  console.error('[Global Interceptor Captured System Exception]:', err.stack || err);

  const statusCode = err.status || 500;
  const message = err.message || 'An internal system error disrupted operational pipelines.';

  res.status(statusCode).json({
    success: false,
    error: message,
    timestamp: new Date().toISOString()
  });
};