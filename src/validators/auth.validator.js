const { fields } = require('./common.rules');

module.exports = {
  register: [
    fields.name(),
    fields.email(),
    fields.passwordRegister(),
  ],

  login: [fields.email(), fields.passwordLogin()],

  refresh: [fields.refreshToken()],

  logout: [fields.refreshToken()],
};
