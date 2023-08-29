import ErrorPage from './ErrorPage';
import HomePage from './HomePage';
import ProjectPage from './ProjectPage';
import LoginPage from './LoginPage';
import RegistrationPage from './RegistrationPage';
import TestLoginPage from './TestLoginPage';
import LogoutPage from './LogoutPage';
import UserProfile from './UserProfilePage';
import CatalogPage from './CatalogPage';

const Pages = {
  'home-page': HomePage,
  'login-page': LoginPage,
  'error-page': ErrorPage,
  'project-page': ProjectPage,
  'registration-page': RegistrationPage,
  'logout-page': LogoutPage,
  'user-profile': UserProfile,
  'catalog-page': CatalogPage,
  'test-login-page': TestLoginPage,
};

Object.entries(Pages).forEach(([elementName, elementClass]) => {
  customElements.define(elementName, elementClass);
});
