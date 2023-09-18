const ErrorMessages: { [key: string]: { [key: string]: string } } = {
  EMPTY_FIELD: {
    forename: 'Enter first name',
    surname: 'Enter last name',
    email: 'Put your email',
    password: 'Minimum 8 characters required',
    date: 'Put your Birthday',
    street: 'Put your street',
    city: 'Put your city',
    code: 'Put your postal code',
    country: 'Must be United States',
    current: 'Put your current password',
  },
  INVALID_VALUE: {
    forename: 'Must not contain special characters or numbers',
    surname: 'Must not contain special characters or numbers',
    email: 'Wrong or Invalid email address. Please correct it.',
    password: 'Must contain at least 1 uppercase letter, 1 lowercase letter, 1 number and be 8 characters long',
    date: 'You need to be at least 13 years old',
    street: 'Must contain at least one character',
    city: 'Must not contain special characters or numbers',
    code: 'Postal code must be 5 numerical digits long and be in range from 00501 to 99950',
    country: 'Must be United States',
    current: 'Your password may be incorrect',
    promocode: 'Your promo code may be incorrect',
  },
  PASSWORD_MISMATCH: { password: 'Password mismatch' },
  INVALID_CURRENT_PASSWORD: { password: 'The given current password does not match' },
  INVALID_PROMO_CODE: { promocode: 'The promo code you entered is invalid' },
};

export default ErrorMessages;
