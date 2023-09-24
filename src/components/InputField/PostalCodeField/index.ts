import InputField from '..';
import { PostalCodes } from '../../../config';
import Pattern from '../../../constants/pattern';
import { WarningMessage } from '../../../interfaces';
import { InputParams, TypeOfAddress } from '../../../types';

const PostalCodeLength = '5';

const params: InputParams = {
  id: 'postal-code',
  type: 'text',
  minlength: PostalCodeLength,
  maxlength: PostalCodeLength,
};
const labelText = 'Postal code';

const getInputParams = (typeOfAddress?: TypeOfAddress): InputParams => {
  const newParams = { ...params };
  const separator = '-';
  const partsOfId = [typeOfAddress, newParams.id];
  newParams.id = partsOfId.join(separator);
  return newParams;
};

const ErrorMessage: WarningMessage = {
  emptyField: 'Put your postal code',
  invalidValue: 'Postal code must be 5 numerical digits long and be in range from 00501 to 99950',
};

export default class PostalCodeField extends InputField {
  protected writableField: PostalCodeField | null = null;

  constructor(public typeOfAddress?: TypeOfAddress) {
    const inputParams = typeOfAddress ? getInputParams(typeOfAddress) : params;
    super({ inputParams, labelText });
  }

  public isValidValue(): boolean {
    const value = this.getInputValue();
    return (
      Pattern.postalcode.test(value) &&
      parseInt(value, 10) >= PostalCodes.RANGE_START &&
      parseInt(value, 10) <= PostalCodes.RANGE_END
    );
  }

  public setWarning(message?: WarningMessage): void {
    super.setWarning(message || ErrorMessage, this);
  }
}
