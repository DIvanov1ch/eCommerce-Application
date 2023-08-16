import ErrorPage from './ErrorPage';
import HomePage from './HomePage';
import ProjectPage from './ProjectPage';
import LoginPage from './LoginPage';
import TestLoginPage from './TestLoginPage';
import TestLogoutPage from './TestLogoutPage';

const Pages = {
  'home-page': HomePage,
  'login-page': LoginPage,
  'error-page': ErrorPage,
  'project-page': ProjectPage,

  'test-login-page': TestLoginPage,
  'test-logout-page': TestLogoutPage,
};

Object.entries(Pages).forEach(([elementName, elementClass]) => {
  customElements.define(elementName, elementClass);
});
