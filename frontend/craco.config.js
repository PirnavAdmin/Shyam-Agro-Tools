module.exports = {
  style: {
    postcss: {
      plugins: [
        require('tailwindcss'),
        require('autoprefixer'),
      ],
    },
  },
  webpack: {
    configure: (webpackConfig) => {
      webpackConfig.ignoreWarnings = [
        /Failed to parse source map/,
        /source-map-loader/,
        /UNKNOWN: unknown error, read/,
      ];
      // Completely remove source-map-loader rule
      if (webpackConfig.module && webpackConfig.module.rules) {
        webpackConfig.module.rules = webpackConfig.module.rules.filter((rule) => {
          if (rule.enforce === 'pre' && rule.use) {
            const uses = Array.isArray(rule.use) ? rule.use : [rule.use];
            const hasSourceMapLoader = uses.some(
              (u) => typeof u === 'string' ? u.includes('source-map-loader') : u?.loader && u.loader.includes('source-map-loader')
            );
            if (hasSourceMapLoader) {
              return false;
            }
          }
          return true;
        });
      }
      return webpackConfig;
    },
  },
};
