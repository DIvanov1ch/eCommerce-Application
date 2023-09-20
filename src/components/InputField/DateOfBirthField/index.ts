import InputField from '..';
import { AGE_LIMIT } from '../../../config';
import { WarningMessage } from '../../../interfaces';
import { InputParams } from '../../../types';
import findCurrentAge from '../../../utils/find-current-age';

const inputParams: InputParams = {
  id: 'date-of-birth',
  type: 'date',
};
const labelText = 'Date of birth';

const ErrorMessage: WarningMessage = {
  emptyField: 'Put your Birthday',
  invalidValue: 'You need to be at least 13 years old',
};

export default class DateOfBirthField extends InputField {
  constructor() {
    super({ inputParams, labelText });
  }

  protected isValidValue(): boolean {
    return findCurrentAge(this.getInputValue()) >= AGE_LIMIT;
  }

  protected setWarning(message?: WarningMessage): void {
    super.setWarning(ErrorMessage || message, this);
  }
}
