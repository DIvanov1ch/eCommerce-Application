export enum EmailRules {
  format = 'Email address wrong format',
  noWhitespaces = 'Email address must not contain whitespaces',
  lowerCase = 'Email address must contain only lowercase letters',
  englishAlphaphet = 'Email address must contain only english letters',
  noWhiteSpaceLeadingAndTrailing = 'Email address must not contain leading or trailing whitespace',
  domain = 'Email address must contain a right domain name (top with at least two characters)',
  emailSymbol = 'Email address must contain @ symbol separating local part and domain name',
  emailContainsTwoEmailSymbols = 'Email address must not contain two or more @ symbols',
}

export enum PasswordRules {
  length = 'Password must be at least 8 characters long',
  upperCaseLetter = 'Password must contain at least one uppercase letter (A-Z)',
  lowerCaseLetter = 'Password must contain at least one lowercase letter (a-z)',
  numbers = 'Password must contain at least one digit (0-9)',
  specialCharacters = 'Password must contain at least one special character (e.g., !@#$%^&*)',
  noWhiteSpacesLeadingOrTrailing = 'Password must not contain leading or trailing whitespace',
}
