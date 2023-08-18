const ErrorMessages: { [key: string]: { [key: string]: string } } = {
  EMPTY_FIELD: {
    'first-name': 'Enter first name',
    'last-name': 'Enter last name',
    email: 'Put your email',
    password: 'Minimum 8 characters required',
    'date-of-birth': 'Put your B-day',
    street: 'Put your street',
    city: 'Put your city',
    'postal-code': 'Put your postal code',
    country: 'Must be United States',
  },
  INVALID_VALUE: {
    'first-name': 'Must not contain special characters or numbers',
    'last-name': 'Must not contain special characters or numbers',
    email: 'Wrong or Invalid email address. Please correct and try again.',
    password: 'Must contain at least 1 uppercase letter, 1 lowercase letter, 1 number and be 8 characters long',
    'date-of-birth': 'You need to be at least 13 years old',
    street: 'Must contain at least one character',
    city: 'Must not contain special characters or numbers',
    'postal-code': 'Postal code must be 5 numerical digits long',
    country: 'Must be United States',
  },
};

export default ErrorMessages;
