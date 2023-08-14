import html from './login.html';
import './login.scss';
import createTemplate from '../../utils';

const template = createTemplate(html);

export default class LoginPage extends HTMLElement {
  private connectedCallback(): void {
    const content = template.content.cloneNode(true);
    this.append(content);
  }
}

/* import { EmailRules, PasswordRules } from '../../types/enum';
import emailPattern from '../../constants/pattern';
import CLIENT_AUTORIZATION from '../../utils/login/clientLogin';

export default class LoginPage {
  private static hasCorrectLengthPassword: boolean;

  private static hasLowerAndUpperCaseLettersPassword: boolean;

  private static hasNumbersPassword: boolean;

  private static hasSpecialSymbolsPassword: boolean;

  private static isCreated: boolean;

  private static userPassword: string;

  private static userEmail: string;

  private static createPasswordBlock = (parentElement: HTMLElement): void => {
    const passwordBlock = document.createElement('div');
    passwordBlock.classList.add('login__pasword-block');
    const inputUserPassword = document.createElement('input');
    inputUserPassword.setAttribute('type', 'password');
    inputUserPassword.setAttribute('placeholder', 'User password');
    inputUserPassword.classList.add('login__user-password');
    const errorBlockForPassword = document.createElement('div');
    errorBlockForPassword.classList.add('login__user-password-error');
    errorBlockForPassword.classList.add('hidden');
    errorBlockForPassword.innerText = 'error';
    const checkBoxPasswordBlock = document.createElement('div');
    checkBoxPasswordBlock.classList.add('login__password-check-box-block');
    const inputShowOrHidePasswordLabel = document.createElement('label');
    inputShowOrHidePasswordLabel.classList.add('login__password-check-box-label');
    inputShowOrHidePasswordLabel.innerText = 'Show password';
    const inputShowOrHidePasswordCheckBox = document.createElement('input');
    inputShowOrHidePasswordCheckBox.setAttribute('type', 'checkbox');
    inputShowOrHidePasswordCheckBox.classList.add('login__password-check-box');
    parentElement.append(passwordBlock);
    passwordBlock.append(inputUserPassword);
    passwordBlock.append(errorBlockForPassword);
    parentElement.append(checkBoxPasswordBlock);
    checkBoxPasswordBlock.append(inputShowOrHidePasswordLabel);
    checkBoxPasswordBlock.append(inputShowOrHidePasswordCheckBox);
  };

  private static createEmailBlock = (parentElement: HTMLElement): void => {
    const emailBlock = document.createElement('div');
    emailBlock.classList.add('login__email-block');
    const inputUserEmail = document.createElement('input');
    inputUserEmail.classList.add('login__user-email');
    inputUserEmail.setAttribute('placeholder', 'User email');
    const errorBlockForEmail = document.createElement('div');
    errorBlockForEmail.classList.add('login__user-email-error');
    errorBlockForEmail.innerText = 'error';
    errorBlockForEmail.classList.add('hidden');
    parentElement.append(emailBlock);
    emailBlock.append(inputUserEmail);
    emailBlock.append(errorBlockForEmail);
  };

  private static createSubmitBlock = (parentElement: HTMLElement): void => {
    const inputLoginFormSubmit = document.createElement('input');
    inputLoginFormSubmit.setAttribute('type', 'button');
    inputLoginFormSubmit.classList.add('login__button');
    inputLoginFormSubmit.classList.add('inactive');
    inputLoginFormSubmit.value = 'Enter';
    parentElement.append(inputLoginFormSubmit);
  };

  private static createHTMLCode = (elementToAppend: HTMLElement): void => {
    const loginForm = document.createElement('form');
    loginForm.classList.add('login__form');
    const loginFormHeading = document.createElement('H2');
    loginFormHeading.classList.add('login__heading');
    loginFormHeading.innerText = 'Login';
    elementToAppend.append(loginForm);
    loginForm.append(loginFormHeading);
    this.createEmailBlock(loginForm);
    this.createPasswordBlock(loginForm);
    this.createSubmitBlock(loginForm);
    this.isCreated = true;
  };

  private static checkPasswordLength = (element: HTMLInputElement): void => {
    const errorBlockForPassword = document.querySelector('.login__user-password-error') as HTMLElement;
    if (element.value.length >= 8) {
      element.classList.add('correct');
      element.classList.remove('incorrect');
      errorBlockForPassword.classList.add('hidden');
      this.hasCorrectLengthPassword = true;
    } else if (element.value.length < 8 && element.value.length > 0) {
      element.classList.remove('correct');
      element.classList.add('incorrect');
      errorBlockForPassword.classList.remove('hidden');
      errorBlockForPassword.innerText = PasswordRules.length;
      this.hasCorrectLengthPassword = false;
    } else {
      element.classList.remove('incorrect');
      errorBlockForPassword.classList.add('hidden');
      this.hasCorrectLengthPassword = false;
    }
  };

  private static checkPasswordForOneUpperOrLowerCaseLetter = (element: HTMLInputElement): void => {
    const errorBlockForPassword = document.querySelector('.login__user-password-error') as HTMLElement;
    if (element.value !== element.value.toLowerCase() && element.value !== element.value.toUpperCase()) {
      element.classList.add('correct');
      element.classList.remove('incorrect');
      errorBlockForPassword.classList.add('hidden');
      this.hasLowerAndUpperCaseLettersPassword = true;
    } else {
      if (element.value === element.value.toLowerCase()) {
        errorBlockForPassword.classList.remove('hidden');
        errorBlockForPassword.innerText = PasswordRules.upperCaseLetter;
      }
      if (element.value === element.value.toUpperCase()) {
        errorBlockForPassword.classList.remove('hidden');
        errorBlockForPassword.innerText = PasswordRules.lowerCaseLetter;
      }
      element.classList.remove('correct');
      element.classList.add('incorrect');
      this.hasLowerAndUpperCaseLettersPassword = false;
    }
  };

  private static checkPasswordForOneNumber = (element: HTMLInputElement): void => {
    const errorBlockForPassword = document.querySelector('.login__user-password-error') as HTMLElement;
    if (element.value.match(/[0-9]/)) {
      element.classList.add('correct');
      element.classList.remove('incorrect');
      errorBlockForPassword.classList.add('hidden');
      this.hasNumbersPassword = true;
    } else {
      element.classList.remove('correct');
      element.classList.add('incorrect');
      errorBlockForPassword.classList.remove('hidden');
      errorBlockForPassword.innerText = PasswordRules.numbers;
      this.hasNumbersPassword = false;
    }
  };

  private static checkPasswordForSpecialSymbols = (element: HTMLInputElement): void => {
    const errorBlockForPassword = document.querySelector('.login__user-password-error') as HTMLElement;
    if (element.value.match(/[!@#$%^&*]/)) {
      element.classList.add('correct');
      element.classList.remove('incorrect');
      errorBlockForPassword.classList.add('hidden');
      this.hasSpecialSymbolsPassword = true;
    } else {
      element.classList.remove('correct');
      element.classList.add('incorrect');
      errorBlockForPassword.classList.remove('hidden');
      errorBlockForPassword.innerText = PasswordRules.specialCharacters;
      this.hasSpecialSymbolsPassword = false;
    }
  };

  private static checkInputForWhiteSpaces = (element: HTMLInputElement): void => {
    const errorBlockForPassword = document.querySelector('.login__user-password-error') as HTMLElement;
    const errorBlockForEmail = document.querySelector('.login__user-email-error') as HTMLElement;
    if (!element.value.match(/^\s+|\s+$/g)) {
      if (element.classList.contains('login__user-email')) {
        errorBlockForEmail.classList.add('hidden');
      } else {
        errorBlockForPassword.classList.add('hidden');
      }
      element.classList.add('correct');
      element.classList.remove('incorrect');
    } else {
      element.classList.remove('correct');
      element.classList.add('incorrect');
      if (element.classList.contains('login__user-email')) {
        errorBlockForEmail.classList.remove('hidden');
        errorBlockForEmail.innerText = EmailRules.noWhiteSpaceLeadingAndTrailing;
      } else {
        errorBlockForPassword.classList.remove('hidden');
        errorBlockForPassword.innerText = PasswordRules.noWhiteSpacesLeadingOrTrailing;
      }
    }
  };

  private static checkPasswordValidation = (): void => {
    const inputUserPassword = document.querySelector('.login__user-password') as HTMLInputElement;
    inputUserPassword.addEventListener('input', (): void => {
      this.checkPasswordLength(inputUserPassword);
      if (this.hasCorrectLengthPassword === true) {
        this.checkPasswordForOneUpperOrLowerCaseLetter(inputUserPassword);
      }
      if (this.hasCorrectLengthPassword === true && this.hasLowerAndUpperCaseLettersPassword === true) {
        this.checkPasswordForOneNumber(inputUserPassword);
      }
      if (
        this.hasCorrectLengthPassword === true &&
        this.hasLowerAndUpperCaseLettersPassword === true &&
        this.hasNumbersPassword
      ) {
        this.checkPasswordForSpecialSymbols(inputUserPassword);
      }
      if (
        this.hasCorrectLengthPassword === true &&
        this.hasLowerAndUpperCaseLettersPassword === true &&
        this.hasNumbersPassword &&
        this.hasSpecialSymbolsPassword
      ) {
        this.checkInputForWhiteSpaces(inputUserPassword);
      }
    });
  };

  private static checkEmailForEmailSymbolDomainsAndFormat = (element: HTMLInputElement): void => {
    const errorBlockForEmail = document.querySelector('.login__user-email-error') as HTMLElement;
    if (emailPattern.test(element.value)) {
      element.classList.add('correct');
      element.classList.remove('incorrect');
      errorBlockForEmail.classList.add('hidden');
    } else {
      element.classList.remove('correct');
      element.classList.add('incorrect');
      errorBlockForEmail.classList.remove('hidden');
      errorBlockForEmail.innerText = EmailRules.domain;
      if (!element.value.match('@')) {
        errorBlockForEmail.innerText = EmailRules.emailSymbol;
      }
      if (element.value.match(' ')) {
        errorBlockForEmail.innerText = EmailRules.noWhitespaces;
      }
      if (element.value.match(/[А-ЯЁа-яё]/)) {
        errorBlockForEmail.innerText = EmailRules.englishAlphaphet;
      }
      if (element.value.match(/[A-Z]/)) {
        errorBlockForEmail.innerText = EmailRules.lowerCase;
      }
      if (element.value.split('').filter((el) => el === '@').length > 1) {
        errorBlockForEmail.innerText = EmailRules.emailContainsTwoEmailSymbols;
      }
    }
  };

  private static checkEmailValidation = (): void => {
    const inputUserEmail = document.querySelector('.login__user-email') as HTMLInputElement;
    const errorBlockForEmail = document.querySelector('.login__user-email-error') as HTMLElement;
    inputUserEmail.addEventListener('input', (): void => {
      if (inputUserEmail.value.length > 0) {
        this.checkInputForWhiteSpaces(inputUserEmail);
        if (inputUserEmail.classList.contains('correct')) {
          this.checkEmailForEmailSymbolDomainsAndFormat(inputUserEmail);
        }
      } else {
        inputUserEmail.classList.remove('correct');
        inputUserEmail.classList.remove('incorrect');
        errorBlockForEmail.classList.add('hidden');
      }
    });
  };

  private static showOrHidePassword = (): void => {
    const inputShowOrHidePassword = document.querySelector('.login__password-check-box') as HTMLInputElement;
    const inputUserPassword = document.querySelector('.login__user-password') as HTMLInputElement;
    const inputShowOrHidePasswordLabel = document.querySelector('.login__password-check-box-label') as HTMLElement;
    inputShowOrHidePassword.addEventListener('click', (): void => {
      if (inputUserPassword.getAttribute('type') === 'password') {
        inputUserPassword.setAttribute('type', 'text');
        inputShowOrHidePasswordLabel.innerText = 'Hide password';
      } else {
        inputUserPassword.setAttribute('type', 'password');
        inputShowOrHidePasswordLabel.innerText = 'Show password';
      }
    });
  };

  private static activateOrDeactivateSubmit = (): void => {
    const inputLoginFormSubmit = document.querySelector('.login__button') as HTMLInputElement;
    const inputUserEmail = document.querySelector('.login__user-email') as HTMLInputElement;
    const inputUserPassword = document.querySelector('.login__user-password') as HTMLInputElement;
    inputUserEmail.addEventListener('input', (): void => {
      if (inputUserEmail.classList.contains('correct') && inputUserPassword.classList.contains('correct')) {
        inputLoginFormSubmit.classList.remove('inactive');
        this.userEmail = inputUserEmail.value;
        this.userPassword = inputUserEmail.value;
      } else {
        inputLoginFormSubmit.classList.add('inactive');
      }
    });
    inputUserPassword.addEventListener('input', (): void => {
      if (inputUserEmail.classList.contains('correct') && inputUserPassword.classList.contains('correct')) {
        inputLoginFormSubmit.classList.remove('inactive');
        this.userEmail = inputUserEmail.value;
        this.userPassword = inputUserEmail.value;
      } else {
        inputLoginFormSubmit.classList.add('inactive');
      }
    });
  };

  private static async login() {
    return fetch('https://auth.europe-west1.gcp.commercetools.com/oauth/trialversion2023/customers/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Authorization: `Basic ${CLIENT_AUTORIZATION}`,
      },
      body: `grant_type=password&username=example@example.com&password=secretsecret&scope=view_published_products:trialversion2023 manage_my_orders:trialversion2023 manage_my_profile:trialversion2023`,
    })
      .then((resp) => resp.json())
      .then((data) => console.log('token', data));
  }

  private static submitAction = (): void => {
    const inputLoginFormSubmit = document.querySelector('.login__button') as HTMLInputElement;
    inputLoginFormSubmit.addEventListener('click', (): void => {
      this.login();
    });
  };

  public static render = (elementToAppend: HTMLElement): void => {
    this.createHTMLCode(elementToAppend);
    this.checkPasswordValidation();
    this.checkEmailValidation();
    this.showOrHidePassword();
    this.activateOrDeactivateSubmit();
    this.submitAction();
    this.isCreated = true;
  };

  public static delete = (): void => {
    const loginForm = document.querySelector('.login__form') as HTMLElement;
    if (this.isCreated === true) {
      this.isCreated = false;
      loginForm?.remove();
    }
  };
} */
