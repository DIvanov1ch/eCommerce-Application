enum UpdateActions {
  CHANGE_EMAIL = 'changeEmail',
  SET_FIRST_NAME = 'setFirstName',
  SET_LAST_NAME = 'setLastName',
  ADD_ADDRESS = 'addAddress',
  CHANGE_ADDRESS = 'changeAddress',
  REMOVE_ADDRESS = 'removeAddress',
  SET_DEFAULT_SHIPPING_ADDRESS = 'setDefaultShippingAddress',
  ADD_SHIPPING_ADDRESS_ID = 'addShippingAddressId',
  REMOVE_SHIPPING_ADDRESS_ID = 'removeShippingAddressId',
  SET_DEFAULT_BILLING_ADDRESS = 'setDefaultBillingAddress',
  ADD_BILLING_ADDRESS_ID = 'addBillingAddressId',
  REMOVE_BILLING_ADDRESS_ID = 'removeBillingAddressId',
  SET_DATE_OF_BIRTH = 'setDateOfBirth',
  CHANGE_LINE_ITEM_QUANTITY = 'changeLineItemQuantity',
  ADD_LINE_ITEM = 'addLineItem',
  ADD_DISCOUNT_CODE = 'addDiscountCode',
  REMOVE_DISCOUNT_CODE = 'removeDiscountCode',
}

export default UpdateActions;
