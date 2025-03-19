// next.config.js
module.exports = {
    webpack: (config) => {
      // Add a rule to handle .mjs files in node_modules
      config.module.rules.push({
        test: /\.mjs$/,
        include: /node_modules/,
        type: 'javascript/auto',
      });
      return config;
    },
  };
  