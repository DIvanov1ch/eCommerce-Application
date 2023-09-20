import InputField from '..';
import Pattern from '../../../constants/pattern';
import { WarningMessage } from '../../../interfaces';
import { NameFieldParams, TypeOfName } from '../../../types';

const nameParams: NameFieldParams = {
  firstName: {
    inputParams: {
      id: 'first-name',
      type: 'text',
    },
    labelText: 'First name',
  },
  secondName: {
    inputParams: {
      id: 'second-name',
      type: 'text',
    },
    labelText: 'Second name',
  },
};

const getErrorMessage = (typeOfName: TypeOfName): WarningMessage => {
  const type = typeOfName === 'firstName' ? 'first' : 'last';
  const ErrorMessage: WarningMessage = {
    emptyField: `Enter your ${type} name`,
    invalidValue: 'Must not contain special characters or numbers',
  };
  return ErrorMessage;
};

export default class NameField extends InputField {
  constructor(private typeOfName: TypeOfName) {
    super(nameParams[typeOfName]);
  }

  protected isValidValue(): boolean {
    return Pattern.name.test(this.getInputValue());
  }

  protected setWarning(): void {
    const message = getErrorMessage(this.typeOfName);
    super.setWarning(message, this);
  }
}
