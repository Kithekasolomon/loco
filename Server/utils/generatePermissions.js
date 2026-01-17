const fs = require("fs");
const path = require("path");

module.exports = () => {
  const routesPath = path.join(__dirname, "../routes");
  const permissions = new Set();

  fs.readdirSync(routesPath).forEach((file) => {
    const route = require(`../routes/${file}`);
    route.stack.forEach((layer) => {
      if (layer.route) {
        const methods = Object.keys(layer.route.methods);
        methods.forEach((method) => {
          const perm = `${method.toUpperCase()}_${layer.route.path
            .replace("/", "")
            .toUpperCase()}`;
          permissions.add(perm);
        });
      }
    });
  });

  return Array.from(permissions);
};
