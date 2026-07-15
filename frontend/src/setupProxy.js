const { createProxyMiddleware } = require('http-proxy-middleware');

const API_TARGET = 'http://shyamagrotools.com';
const COUPONS_API_TARGET = 'http://shyamagrotools.com';

module.exports = function setupProxy(app) {
  // Route coupons API requests to the specific target to avoid CORS
  app.use(
    '/api/coupons',
    createProxyMiddleware({
      target: COUPONS_API_TARGET,
      changeOrigin: true,
      secure: false,
      onProxyReq(proxyReq) {
        proxyReq.setHeader('ngrok-skip-browser-warning', 'true');
      },
    })
  );

  // General API requests route to the default target
  app.use(
    '/api',
    createProxyMiddleware({
      target: API_TARGET,
      changeOrigin: true,
      secure: false,
      onProxyReq(proxyReq) {
        proxyReq.setHeader('ngrok-skip-browser-warning', 'true');
      },
    })
  );
};

