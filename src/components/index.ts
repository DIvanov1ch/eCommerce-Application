import LoginBox from './LoginBox';
import PageFooter from './PageFooter';
import PageHeader from './PageHeader';

const Components = {
  'page-header': PageHeader,
  'page-footer': PageFooter,
  'login-box': LoginBox,
};

Object.entries(Components).forEach(([elementName, elementClass]) => {
  customElements.define(elementName, elementClass);
});
