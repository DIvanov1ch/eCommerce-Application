import InputField from '..';
import Pattern from '../../../constants/pattern';
import { WarningMessage } from '../../../interfaces';
import { InputParams } from '../../../types';

const inputParams: InputParams = {
  id: 'promo-code',
  type: 'text',
  maxlength: '25',
  placeholder: 'Promo Code',
};

const ErrorMessage: WarningMessage = {
  emptyField: '',
  invalidValue: 'Your promo code may be incorrect',
};

export default class PromoCodeField extends InputField {
  constructor() {
    super({ inputParams });
  }

  public isValidValue(): boolean {
    return Pattern.promocode.test(this.getInputValue());
  }

  public setWarning(message?: WarningMessage): void {
    super.setWarning(message || ErrorMessage, this);
  }
}
