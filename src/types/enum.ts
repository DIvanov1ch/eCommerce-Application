export enum EmailRules {
  format = 'Email address must be properly formatted',
  noWhiteSpaces = 'Email address must not contain leading or trailing whitespace',
  domain = 'Email address must contain a domain name',
  emailSymbol = 'Email address must contain an @ symbol separating local part and domain name',
}

export enum PasswordRules {
  length = 'Password must be at least 8 characters long',
  upperCaseLetter = 'Password must contain at least one uppercase letter (A-Z)',
  lowerCaseLetter = 'Password must contain at least one lowercase letter (a-z)',
  numbers = 'Password must contain at least one digit (0-9)',
  specialCharacters = 'Password must contain at least one special character (e.g., !@#$%^&*)',
  noWhiteSpaces = 'Password must not contain leading or trailing whitespace',
}
