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
  const separator = '-';
  const partsOfId = [typeOfAddress, params.id];
  return { id: partsOfId.join(separator), type: params.type };
};

const ErrorMessage: WarningMessage = {
  emptyField: 'Put your postal code',
  invalidValue: 'Postal code must be 5 numerical digits long and be in range from 00501 to 99950',
};

export default class PostalCodeField extends InputField {
  constructor(private typeOfAddress?: TypeOfAddress) {
    const inputParams = typeOfAddress ? getInputParams(typeOfAddress) : params;
    super({ inputParams, labelText });
  }

  protected isValidValue(): boolean {
    const value = this.getInputValue();
    return (
      Pattern.postalcode.test(value) &&
      parseInt(value, 10) >= PostalCodes.RANGE_START &&
      parseInt(value, 10) <= PostalCodes.RANGE_END
    );
  }

  protected setWarning(message?: WarningMessage): void {
    super.setWarning(ErrorMessage || message, this);
  }
}
