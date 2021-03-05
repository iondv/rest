const { IonError } = require('@iondv/core');
const { w: t } = require('@iondv/i18n');

const prefix = 'rest.backend';

const codes = module.exports = {
  NOT_FOUND_CONV: `${prefix}.notfoundconv`,
  WRONG_OPTIONS: `${prefix}.wrongoptions`,
  HTTP_403: `${prefix}.403`,
  HTTP_404: `${prefix}.404`,
  HTTP_500: `${prefix}.500`
};

IonError.registerMessages({
  [codes.NOT_FOUND_CONV]: t('The converter specified in the request was not found.'),
  [codes.WRONG_OPTIONS]: t('No proper options for "%method" provided'),
  [codes.HTTP_403]: t('Access denied'),
  [codes.HTTP_404]: t('Object not found!'),
  [codes.HTTP_500]: t('Internal server error'),
});
