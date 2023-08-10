import './index.css';

export default class Login {
  private static hasCorrectLength: boolean;

  private static hasLowerAndUpperCaseLetters: boolean;

  private static hasNumbers: boolean;

  private static hasSpecialSymbols: boolean;

  private static createHTMLCode = (): void => {
    const body = document.querySelector('body') as HTMLElement;
    const loginForm = document.createElement('form');
    loginForm.classList.add('login__form');
    const loginFormHeading = document.createElement('H2');
    loginFormHeading.classList.add('login__heading');
    loginFormHeading.innerText = 'Login';
    const inputUserEmail = document.createElement('input');
    inputUserEmail.classList.add('login__user-email');
    inputUserEmail.setAttribute('type', 'email');
    inputUserEmail.setAttribute('placeholder', 'User email');
    const inputUserPassword = document.createElement('input');
    inputUserPassword.setAttribute('type', 'password');
    inputUserPassword.setAttribute('placeholder', 'User password');
    inputUserPassword.classList.add('login__user-password');
    const inputLoginFormSubmit = document.createElement('input');
    inputLoginFormSubmit.setAttribute('type', 'button');
    inputLoginFormSubmit.classList.add('login__button');
    inputLoginFormSubmit.value = 'Login';
    body.append(loginForm);
    loginForm.append(loginFormHeading);
    loginForm.append(inputUserEmail);
    loginForm.append(inputUserPassword);
    loginForm.append(inputLoginFormSubmit);
  };

  private static checkPasswordLength = (element: HTMLInputElement): void => {
    if (element.value.length >= 8) {
      element.classList.add('correct');
      element.classList.remove('incorrect');
      this.hasCorrectLength = true;
    } else if (element.value.length < 8 && element.value.length > 0) {
      element.classList.remove('correct');
      element.classList.add('incorrect');
      this.hasCorrectLength = false;
    } else {
      element.classList.remove('incorrect');
      this.hasCorrectLength = false;
    }
  };

  private static checkPasswordForOneUpperOrLowerCaseLetter = (element: HTMLInputElement): void => {
    if (element.value !== element.value.toLowerCase() && element.value !== element.value.toUpperCase()) {
      element.classList.add('correct');
      element.classList.remove('incorrect');
      this.hasLowerAndUpperCaseLetters = true;
    } else {
      element.classList.remove('correct');
      element.classList.add('incorrect');
      this.hasLowerAndUpperCaseLetters = false;
    }
  };

  private static checkPasswordForOneNumber = (element: HTMLInputElement): void => {
    if (element.value.match(/[1-9]/)) {
      element.classList.add('correct');
      element.classList.remove('incorrect');
      this.hasNumbers = true;
    } else {
      element.classList.remove('correct');
      element.classList.add('incorrect');
      this.hasNumbers = false;
    }
  };

  private static checkPasswordForSpecialSymbols = (element: HTMLInputElement): void => {
    if (element.value.match(/[!@#$%^&*]/)) {
      element.classList.add('correct');
      element.classList.remove('incorrect');
      this.hasSpecialSymbols = true;
    } else {
      element.classList.remove('correct');
      element.classList.add('incorrect');
      this.hasSpecialSymbols = false;
    }
  };

  private static checkPasswordForWhiteSpaces = (element: HTMLInputElement): void => {
    if (!element.value.match(/^\s+|\s+$/g)) {
      element.classList.add('correct');
      element.classList.remove('incorrect');
    } else {
      element.classList.remove('correct');
      element.classList.add('incorrect');
    }
  };

  private static checkPasswordValidation = (): void => {
    const inputUserPassword = document.querySelector('.login__user-password') as HTMLInputElement;
    inputUserPassword.addEventListener('input', (): void => {
      console.log(inputUserPassword.value);
      this.checkPasswordLength(inputUserPassword);
      if (this.hasCorrectLength === true) {
        this.checkPasswordForOneUpperOrLowerCaseLetter(inputUserPassword);
      }
      if (this.hasCorrectLength === true && this.hasLowerAndUpperCaseLetters === true) {
        this.checkPasswordForOneNumber(inputUserPassword);
      }
      if (this.hasCorrectLength === true && this.hasLowerAndUpperCaseLetters === true && this.hasNumbers) {
        this.checkPasswordForSpecialSymbols(inputUserPassword);
      }
      if (
        this.hasCorrectLength === true &&
        this.hasLowerAndUpperCaseLetters === true &&
        this.hasNumbers &&
        this.hasSpecialSymbols
      ) {
        this.checkPasswordForWhiteSpaces(inputUserPassword);
      }
    });
  };

  public static create = (): void => {
    this.createHTMLCode();
    this.checkPasswordValidation();
  };
}
