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
  lastName: {
    inputParams: {
      id: 'last-name',
      type: 'text',
    },
    labelText: 'Last name',
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
  constructor(public typeOfName: TypeOfName) {
    super(nameParams[typeOfName]);
  }

  public isValidValue(): boolean {
    return Pattern.name.test(this.getInputValue());
  }

  public setWarning(): void {
    const message = getErrorMessage(this.typeOfName);
    super.setWarning(message, this);
  }
}
