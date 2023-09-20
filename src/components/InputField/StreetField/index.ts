import InputField from '..';
import Pattern from '../../../constants/pattern';
import { WarningMessage } from '../../../interfaces';
import { InputParams, TypeOfAddress } from '../../../types';

const params: InputParams = {
  id: 'street',
  type: 'text',
};
const labelText = 'Street';

const getInputParams = (typeOfAddress?: TypeOfAddress): InputParams => {
  const separator = '-';
  const partsOfId = [typeOfAddress, params.id];
  return { id: partsOfId.join(separator), type: params.type };
};

const ErrorMessage: WarningMessage = {
  emptyField: 'Put your street',
  invalidValue: 'Must contain at least one character',
};

export default class StreetField extends InputField {
  constructor(private typeOfAddress?: TypeOfAddress) {
    const inputParams = typeOfAddress ? getInputParams(typeOfAddress) : params;
    super({ inputParams, labelText });
  }

  protected isValidValue(): boolean {
    return Pattern.street.test(this.getInputValue());
  }

  protected setWarning(message?: WarningMessage): void {
    super.setWarning(ErrorMessage || message, this);
  }
}
