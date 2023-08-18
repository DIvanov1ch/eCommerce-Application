import Pattern from '../constants/pattern';
import { InputID } from '../enums';
import findCurrentAge from './find-current-age';

const ageLimit: number = 13;

export default function isValidValue(id: string, value: string): boolean {
  switch (id) {
    case InputID.FIRST_NAME:
    case InputID.LAST_NAME:
      return Pattern.name.test(value);
    case InputID.EMAIL:
      return Pattern.email.registration.test(value);
    case InputID.PASSWORD:
      return Pattern.password.test(value);
    case InputID.B_DAY:
      return findCurrentAge(value) >= ageLimit;
    case InputID.STREET:
      return Pattern.street.test(value);
    case InputID.CITY:
      return Pattern.city.test(value);
    case InputID.ZIP_CODE:
      return Pattern.zip.test(value);
    case InputID.COUNTRY:
      return Pattern.country.test(value);
    default:
      return false;
  }
}
