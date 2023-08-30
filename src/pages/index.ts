import ErrorPage from './ErrorPage';
import HomePage from './HomePage';
import LoginPage from './LoginPage';
import RegistrationPage from './RegistrationPage';
import LogoutPage from './LogoutPage';
import UserProfile from './UserProfilePage';
import CatalogPage from './CatalogPage';

const Pages = {
  'home-page': HomePage,
  'login-page': LoginPage,
  'error-page': ErrorPage,
  'registration-page': RegistrationPage,
  'logout-page': LogoutPage,
  'user-profile': UserProfile,
  'catalog-page': CatalogPage,
};

Object.entries(Pages).forEach(([elementName, elementClass]) => {
  customElements.define(elementName, elementClass);
});
