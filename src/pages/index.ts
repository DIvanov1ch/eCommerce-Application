import ErrorPage from './ErrorPage';
import HomePage from './HomePage';
import LoginPage from './LoginPage';
import RegistrationPage from './RegistrationPage';
import LogoutPage from './LogoutPage';
import UserProfile from './UserProfilePage';
import CatalogPage from './CatalogPage';
import ProductPage from './ProductPage';
import ComponentsPage from './ComponentsPage';
import CartPage from './CartPage';
import AboutUsPage from './AboutUsPage';

const Pages = {
  'home-page': HomePage,
  'login-page': LoginPage,
  'error-page': ErrorPage,
  'registration-page': RegistrationPage,
  'logout-page': LogoutPage,
  'user-profile': UserProfile,
  'catalog-page': CatalogPage,
  'product-page': ProductPage,
  'components-page': ComponentsPage,
  'cart-page': CartPage,
  'about_us-page': AboutUsPage,
};

Object.entries(Pages).forEach(([elementName, elementClass]) => {
  customElements.define(elementName, elementClass);
});
