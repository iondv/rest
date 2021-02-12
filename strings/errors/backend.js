const codes = require('../../errors/backend-errors');
const {w: t} = require('core/i18n');

module.exports = {
  [codes.NOT_FOUND_CONV]: t('The converter specified in the request was not found.'),
  [codes.WRONG_OPTIONS]: t('No proper options for "%method" provided'),
  [codes.HTTP_403]: t('Access denied'),
  [codes.HTTP_404]: t('Object not found!'),
  [codes.HTTP_500]: t('Internal server error'),
};
