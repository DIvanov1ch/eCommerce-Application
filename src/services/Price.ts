import { CentPrecisionMoney } from '@commercetools/platform-sdk';

export default class Price implements CentPrecisionMoney {
  public type = 'centPrecision' as const;

  public centAmount = 0;

  public currencyCode = '';

  public fractionDigits = 0;
}
