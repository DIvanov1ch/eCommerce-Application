import { AGE_LIMIT, ZipCodes } from '../config';
import Pattern from '../constants/pattern';
import InputID from '../enums/input-id';
import findCurrentAge from './find-current-age';

export default function isValidValue(id: string, value: string): boolean {
  switch (id) {
    case InputID.FIRST_NAME:
    case InputID.LAST_NAME:
      return Pattern.name.test(value);
    case InputID.EMAIL:
      return Pattern.email.test(value);
    case InputID.PASSWORD:
      return Pattern.password.test(value);
    case InputID.DATE_OF_BIRTH:
      return findCurrentAge(value) >= AGE_LIMIT;
    case InputID.SHIPPING_STREET:
    case InputID.BILLING_STREET:
      return Pattern.street.test(value);
    case InputID.SHIPPING_CITY:
    case InputID.BILLING_CITY:
      return Pattern.city.test(value);
    case InputID.SHIPPING_CODE:
    case InputID.BILLING_CODE:
      return (
        Pattern.zip.test(value) &&
        parseInt(value, 10) >= ZipCodes.RANGE_START &&
        parseInt(value, 10) <= ZipCodes.RANGE_END
      );
    case InputID.SHIPPING_COUNTRY:
    case InputID.BILLING_COUNTRY:
      return Pattern.country.test(value);
    default:
      return false;
  }
}
