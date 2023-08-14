import './components';
import './pages';
import Router from './services/Router';

export default {
  start(): void {
    const pageHeader = document.createElement('page-header');
    const pageMain = document.createElement('page-main');
    const pageLogin = document.createElement('page-login');
    const pageFooter = document.createElement('page-footer');
    document.body.append(pageHeader, pageMain, pageFooter, pageLogin);

    const router = new Router();
    router.init();
  },
};
