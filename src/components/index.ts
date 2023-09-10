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
import TimeOut from './TimeOut';

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
  'popup-menu': PopupMenu,
  'edit-profile': EditProfile,
  'change-password': ChangePassword,
  'add-address': AddAddress,
  'edit-address': EditAddress,
  'delete-address': DeleteAddress,
};

Object.entries(Components).forEach(([elementName, elementClass]) => {
  customElements.define(elementName, elementClass);
});
