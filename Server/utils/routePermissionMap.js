const fs = require("fs");
const path = require("path");

module.exports = () => {
  const routesDir = path.join(__dirname, "../routes");
  const map = [];

  fs.readdirSync(routesDir).forEach((file) => {
    const router = require(`../routes/${file}`);
    router.stack.forEach((layer) => {
      if (layer.route) {
        const methods = Object.keys(layer.route.methods);
        methods.forEach((method) => {
          map.push({
            method: method.toUpperCase(),
            path: layer.route.path,
            permission: `${method.toUpperCase()}_${layer.route.path
              .replace(/\//g, "_")
              .toUpperCase()}`,
          });
        });
      }
    });
  });

  return map;
};
