const { IonError } = require('@iondv/core');

const prefix = 'rest.backend';

const errors = module.exports = {
  NOT_FOUND_CONV: `${prefix}.notfoundconv`,
  WRONG_OPTIONS: `${prefix}.wrongoptions`,
  HTTP_403: `${prefix}.403`,
  HTTP_404: `${prefix}.404`,
  HTTP_500: `${prefix}.500`
};

IonError.registerMessages(errors);
