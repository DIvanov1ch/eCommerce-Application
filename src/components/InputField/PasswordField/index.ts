import InputField from '..';
import Pattern from '../../../constants/pattern';
import { WarningMessage } from '../../../interfaces';
import { FieldParams, InputParams } from '../../../types';

const inputParams: InputParams = {
  id: 'password',
  type: 'password',
  placeholder: 'At least 8 characters',
};
const labelText = 'Password';

const ErrorMessage: WarningMessage = {
  emptyField: 'Minimum 8 characters required',
  invalidValue: 'Must contain at least 1 uppercase letter, 1 lowercase letter, 1 number and be 8 characters long',
};

export default class PasswordField extends InputField {
  constructor(
    fieldParams?: FieldParams,
    private message?: WarningMessage
  ) {
    super(fieldParams || { inputParams, labelText });
  }

  public isValidValue(): boolean {
    return Pattern.password.test(this.getInputValue());
  }

  public setWarning(message?: WarningMessage): void {
    super.setWarning(message || this.message || ErrorMessage, this);
  }
}
