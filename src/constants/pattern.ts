const Pattern = {
  name: /^(?!.*[0-9])(?=.*[a-zA-Z])(?!.*\W).{1,}$/,
  email: /^[a-z0-9.!#$%&'*+/=?^_‘{|}~-]+@[a-z0-9.-]+\.[a-z]{2,}$/,
  password: /^(?=.*[0-9])(?=.*[a-z])(?=.*[A-Z]).{8,}$/,
  street: /\w{1,}/,
  city: /^(?!.*[0-9])(?=.*[a-zA-Z])(?!.*\W\s).{1,}$/,
  postalcode: /\d{5,5}/,
  country: /^United States$/,
  promocode: /^[A-Z0-9]{0,}$/,
};

export default Pattern;
