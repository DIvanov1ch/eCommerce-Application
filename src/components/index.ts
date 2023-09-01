import BreadCrumbs from './BreadCrumbs';
import LoginBox from './LoginBox';
import PageFooter from './PageFooter';
import PageHeader from './PageHeader';
import PageMain from './PageMain';
import PriceBox from './PriceBox';
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
};

Object.entries(Components).forEach(([elementName, elementClass]) => {
  customElements.define(elementName, elementClass);
});
