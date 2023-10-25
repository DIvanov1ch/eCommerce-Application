import InputField from '..';
import Pattern from '../../../constants/pattern';
import { WarningMessage } from '../../../interfaces';
import { InputParams, TypeOfAddress } from '../../../types';

const params: InputParams = {
  id: 'city',
  type: 'text',
};
const labelText = 'City';

const getInputParams = (typeOfAddress?: TypeOfAddress): InputParams => {
  const separator = '-';
  const partsOfId = [typeOfAddress, params.id];
  return { id: partsOfId.join(separator), type: params.type };
};

const ErrorMessage: WarningMessage = {
  emptyField: 'Put your city',
  invalidValue: 'Must not contain special characters or numbers',
};

export default class CityField extends InputField {
  protected writableField: CityField | null = null;

  constructor(public typeOfAddress?: TypeOfAddress) {
    const inputParams = typeOfAddress ? getInputParams(typeOfAddress) : params;
    super({ inputParams, labelText });
  }

  public isValidValue(): boolean {
    return Pattern.city.test(this.getInputValue());
  }

  public setWarning(message?: WarningMessage): void {
    super.setWarning(message || ErrorMessage, this);
  }
}
