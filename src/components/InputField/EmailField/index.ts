import InputField from '..';
import Pattern from '../../../constants/pattern';
import { WarningMessage } from '../../../interfaces';
import { InputParams } from '../../../types';

const inputParams: InputParams = {
  id: 'email',
  type: 'email',
  maxlength: '64',
};
const labelText = 'Email';

const ErrorMessage: WarningMessage = {
  emptyField: 'Put your email',
  invalidValue: 'Wrong or Invalid email address. Please correct it.',
};

export default class EmailField extends InputField {
  constructor() {
    super({ inputParams, labelText });
  }

  public isValidValue(): boolean {
    return Pattern.email.test(this.getInputValue());
  }

  public setWarning(message?: WarningMessage): void {
    super.setWarning(message || ErrorMessage, this);
  }
}
