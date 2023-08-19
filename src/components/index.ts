import LoginBox from './LoginBox';
import PageFooter from './PageFooter';
import PageHeader from './PageHeader';
import PageMain from './PageMain';

const Components = {
  'page-header': PageHeader,
  'page-main': PageMain,
  'page-footer': PageFooter,
  'login-box': LoginBox,
};

Object.entries(Components).forEach(([elementName, elementClass]) => {
  customElements.define(elementName, elementClass);
});
