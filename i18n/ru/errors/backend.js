const codes = require('../../../errors/backend-errors');

module.exports = {
  [codes.NOT_FOUND_CONV]: `Не найден указанный в запросе конвертор.`,
  [codes.WRONG_OPTIONS]: `no proper options for "%method" provided`,
  [codes.HTTP_403]: `Access denied`,
  [codes.HTTP_404]: `Object not found!`,
  [codes.HTTP_500]: `Internal server error`,
};
