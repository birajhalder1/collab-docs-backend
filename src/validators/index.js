const fs = require('fs');
const path = require('path');

const registry = {};

const loadValidators = () => {
  const validatorDir = __dirname;
  const files = fs
    .readdirSync(validatorDir)
    .filter((file) => file.endsWith('.validator.js'));

  for (const file of files) {
    const namespace = file.replace('.validator.js', '');
    const schemas = require(path.join(validatorDir, file));

    for (const [action, rules] of Object.entries(schemas)) {
      if (!Array.isArray(rules)) {
        throw new TypeError(
          `Validator "${namespace}.${action}" must export an array of rules`
        );
      }
      registry[`${namespace}.${action}`] = rules;
    }
  }
};

loadValidators();

const get = (schemaKey) => {
  const rules = registry[schemaKey];
  if (!rules) {
    const available = Object.keys(registry).sort().join(', ');
    throw new Error(
      `Validator "${schemaKey}" not found. Available: ${available || 'none'}`
    );
  }
  return rules;
};

const list = () => Object.keys(registry).sort();

const reload = () => {
  Object.keys(registry).forEach((key) => delete registry[key]);

  Object.keys(require.cache)
    .filter((key) => key.includes(`${path.sep}validators${path.sep}`))
    .forEach((key) => delete require.cache[key]);

  loadValidators();
};

module.exports = { registry, get, list, reload };
