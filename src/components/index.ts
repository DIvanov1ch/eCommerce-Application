import BreadCrumbs from './BreadCrumbs';
import ImageSlider from './ImageSlider';
import LoginBox from './LoginBox';
import ModalDialog from './ModalDialog';
import PageFooter from './PageFooter';
import PageHeader from './PageHeader';
import PageMain from './PageMain';
import AddAddress from './AddAddress';
import DeleteAddress from './DeleteAddress';
import EditAddress from './EditAddress';
import EditProfile from './EditProfile';
import PopupMenu from './PopupMenu';
import ChangePassword from './ChangePassword';
import PriceBox from './PriceBox';
import ProductCard from './ProductCard';
import ProductCategories from './ProductCategories';
import ProductVariants from './ProductVariants';
import TimeOut from './TimeOut';
import CartCard from './CartCard';
import TeamMember from './TeamMember';
import ItemCounter from './ItemCounter';
import ClearDialog from './ClearDialog';
import InputField from './InputField';
import CityField from './InputField/CityField';
import NameField from './InputField/NameField';
import EmailField from './InputField/EmailField';
import PasswordField from './InputField/PasswordField';
import DateOfBirthField from './InputField/DateOfBirthField';
import StreetField from './InputField/StreetField';
import PostalCodeField from './InputField/PostalCodeField';
import CountryField from './InputField/CountryField';

const Components = {
  'page-header': PageHeader,
  'page-main': PageMain,
  'page-footer': PageFooter,
  'login-box': LoginBox,
  'time-out': TimeOut,
  'bread-crumbs': BreadCrumbs,
  'product-categories': ProductCategories,
  'price-box': PriceBox,
  'image-slider': ImageSlider,
  'modal-dialog': ModalDialog,
  'product-card': ProductCard,
  'product-variants': ProductVariants,
  'popup-menu': PopupMenu,
  'edit-profile': EditProfile,
  'change-password': ChangePassword,
  'add-address': AddAddress,
  'edit-address': EditAddress,
  'delete-address': DeleteAddress,
  'cart-card': CartCard,
  'team-member': TeamMember,
  'item-counter': ItemCounter,
  'clear-dialog': ClearDialog,
  'input-field': InputField,
  'city-field': CityField,
  'name-field': NameField,
  'email-field': EmailField,
  'password-field': PasswordField,
  'date-of-birth-field': DateOfBirthField,
  'street-field': StreetField,
  'postal-code-field': PostalCodeField,
  'country-field': CountryField,
};

Object.entries(Components).forEach(([elementName, elementClass]) => {
  customElements.define(elementName, elementClass);
});
