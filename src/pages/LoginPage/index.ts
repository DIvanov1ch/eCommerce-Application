import html from './login.html';
import './login.scss';
import Page from '../Page';
import { EmailRules, PasswordRules } from '../../enums/rules';
import Pattern from '../../constants/pattern';
import { getActiveCart, login, logout } from '../../services/API';
import { errorAlert, errorMessages } from '../../types/errors';
import Store from '../../services/Store';
import Router from '../../services/Router';

Router.registerRoute('login', 'login-page');

export default class LoginPage extends Page {
  constructor() {
    super(html);
  }

  protected connectedCallback(): void {
    LoginPage.checkIfUserLoggedIn();

    super.connectedCallback();
    LoginPage.checkPasswordValidation();
    LoginPage.checkEmailValidation();
    LoginPage.showOrHidePassword();
    LoginPage.activateOrDeactivateSubmit();
    LoginPage.submitAction();
    LoginPage.goToRegistrationPage();
  }

  private static hasCorrectLengthPassword: boolean;

  private static hasLowerAndUpperCaseLettersPassword: boolean;

  private static hasNumbersPassword: boolean;

  private static hasSpecialSymbolsPassword: boolean;

  private static userPassword: string;

  private static hasSubmitErrorMessage: boolean;

  private static userEmail: string;

  public static getPassword = (): string => {
    return this.userPassword || '';
  };

  public static getEmail = (): string => {
    return this.userEmail || '';
  };

  public static setLoginToDefault = (): void => {
    this.userPassword = '';
    this.userEmail = '';
  };

  private static checkIfUserLoggedIn = (): void => {
    if (Store.customer) {
      this.goToMainPage();
    }
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
      errorBlockForPassword.innerHTML = errorAlert.secondAlert + PasswordRules.length;
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
        errorBlockForPassword.innerHTML = errorAlert.secondAlert + PasswordRules.upperCaseLetter;
      }
      if (element.value === element.value.toUpperCase()) {
        errorBlockForPassword.classList.remove('hidden');
        errorBlockForPassword.innerHTML = errorAlert.secondAlert + PasswordRules.lowerCaseLetter;
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
      errorBlockForPassword.innerHTML = errorAlert.secondAlert + PasswordRules.numbers;
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
      errorBlockForPassword.innerHTML = errorAlert.secondAlert + PasswordRules.specialCharacters;
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
        errorBlockForEmail.innerHTML = errorAlert.secondAlert + EmailRules.noWhiteSpaceLeadingAndTrailing;
      } else {
        errorBlockForPassword.classList.remove('hidden');
        errorBlockForPassword.innerHTML = errorAlert.secondAlert + PasswordRules.noWhiteSpacesLeadingOrTrailing;
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
        // this.checkPasswordForSpecialSymbols(inputUserPassword);
      }
      if (
        this.hasCorrectLengthPassword === true &&
        this.hasLowerAndUpperCaseLettersPassword === true &&
        this.hasNumbersPassword
      ) {
        this.checkInputForWhiteSpaces(inputUserPassword);
      }
    });
  };

  private static checkEmailForEmailSymbolDomainsAndFormat = (element: HTMLInputElement): void => {
    const errorBlockForEmail = document.querySelector('.login__user-email-error') as HTMLElement;
    if (Pattern.email.test(element.value)) {
      element.classList.add('correct');
      element.classList.remove('incorrect');
      errorBlockForEmail.classList.add('hidden');
    } else {
      element.classList.remove('correct');
      element.classList.add('incorrect');
      errorBlockForEmail.classList.remove('hidden');
      errorBlockForEmail.innerHTML = errorAlert.secondAlert + EmailRules.domain;
      if (!element.value.match('@')) {
        errorBlockForEmail.innerHTML = errorAlert.secondAlert + EmailRules.emailSymbol;
      }
      if (element.value.match(' ')) {
        errorBlockForEmail.innerHTML = errorAlert.secondAlert + EmailRules.noWhitespaces;
      }
      if (element.value.match(/[А-ЯЁа-яё]/)) {
        errorBlockForEmail.innerHTML = errorAlert.secondAlert + EmailRules.englishAlphaphet;
      }
      if (element.value.match(/[A-Z]/)) {
        errorBlockForEmail.innerHTML = errorAlert.secondAlert + EmailRules.lowerCase;
      }
      if (element.value.split('').filter((el) => el === '@').length > 1) {
        errorBlockForEmail.innerHTML = errorAlert.secondAlert + EmailRules.emailContainsTwoEmailSymbols;
      }
    }
  };

  private static checkEmailValidation = (): void => {
    const inputUserEmail = document.querySelector('.login__user-email') as HTMLInputElement;
    const errorBlockForEmail = document.querySelector('.login__user-email-error') as HTMLElement;
    inputUserEmail.addEventListener('input', (): void => {
      this.hideSubmitErrorMessage();
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
    const checkCorrectnessOfInputsAndStoreIt = (): void => {
      if (inputUserEmail.classList.contains('correct') && inputUserPassword.classList.contains('correct')) {
        inputLoginFormSubmit.classList.remove('inactive');
        this.userEmail = inputUserEmail.value;
        this.userPassword = inputUserPassword.value;
      } else {
        inputLoginFormSubmit.classList.add('inactive');
      }
    };
    inputUserEmail.addEventListener('input', (): void => {
      checkCorrectnessOfInputsAndStoreIt();
    });
    inputUserPassword.addEventListener('input', (): void => {
      checkCorrectnessOfInputsAndStoreIt();
    });
  };

  private static hideSubmitErrorMessage = (): void => {
    const errorBlockForPassword = document.querySelector('.login__user-password-error') as HTMLElement;
    if (this.hasSubmitErrorMessage === true) {
      errorBlockForPassword.classList.add('hidden');
      this.hasSubmitErrorMessage = false;
    }
  };

  private static showErrorOnLogin = (errorMessage: string): void => {
    const errorBlockForPassword = document.querySelector('.login__user-password-error') as HTMLElement;
    errorBlockForPassword.classList.remove('hidden');
    errorBlockForPassword.innerHTML = errorAlert.secondAlert + errorMessage;
    this.hasSubmitErrorMessage = true;
  };

  private static submitAction = (): void => {
    const inputLoginFormSubmit = document.querySelector('.login__button') as HTMLInputElement;
    inputLoginFormSubmit.addEventListener('click', (): void => {
      if (Store.token) {
        logout();
      }
      login(this.getEmail(), this.getPassword())
        .then(({ body }) => {
          Store.customer = body.customer;
        })
        .then(() => {
          getActiveCart()
            .then(({ body }) => {
              body.lineItems.forEach((el) => {
                if (el.productSlug !== undefined) {
                  Store.cart.push(el.productSlug.en || '');
                }
              });
            })
            .catch(() => {});
        })
        .then(() => this.goToMainPage())
        .catch(() => {})
        .catch((error: Error) => {
          if (error.message === errorMessages.loginEmailError || error.message === errorMessages.loginPasswordError) {
            this.showErrorOnLogin(error.message);
          }
        });
    });
  };

  private static goToRegistrationPage = (): void => {
    const buttonForRegistration = document.querySelector('.login__button.button_registration') as HTMLInputElement;
    buttonForRegistration.addEventListener('click', (): void => {
      window.location.href = '#registration';
    });
  };

  private static goToMainPage = (): void => {
    window.location.href = '#';
  };
}
