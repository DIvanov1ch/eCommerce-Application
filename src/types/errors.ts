export const errorMessages = {
  loginEmailError: 'Customer account with the given credentials not found.',
  loginPasswordError: 'Account with the given credentials not found.',
  emailError: 'There is already an existing customer with the provided email.',
  dataError: 'Request body does not contain valid JSON.',
};

export const ServerErrors = {
  INTERNAL_SERVER_ERROR: 500,
  BAD_GATEWAY: 502,
  SERVICE_UNAVAILABLE: 503,
};

export const errorAlert = {
  firstAlert: `<i class="error-box__icon">!</i>`,
  secondAlert: `<i class="login__error-icon"></i>`,
};
