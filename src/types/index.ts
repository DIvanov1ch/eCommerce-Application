export type TextContentParams = {
  container: HTMLElement;
  selector: string;
  content: string;
};

export type InputParams = {
  id: string;
  type: string;
  autocomplete?: string;
  name?: string;
  placeholder?: string;
};

export type FieldParams = {
  inputParams: InputParams;
  labelText: string;
};

export type NameFieldParams = {
  firstName: FieldParams;
  secondName: FieldParams;
};

export type TypeOfName = 'firstName' | 'secondName';
