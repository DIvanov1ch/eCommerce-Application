import './code.scss';
import html from './template.html';
import Page from '../Page';
import Router from '../../services/Router';
import { createElement } from '../../utils/create-element';
import ModalDialog from '../../components/ModalDialog';

Router.registerRoute('components', 'components-page');

const PAGE_TITLE = 'Components';

export default class ComponentsPage extends Page {
  constructor() {
    super(html, PAGE_TITLE);
  }

  protected connectedCallback(): void {
    super.connectedCallback();

    this.$('#btn-modal')?.addEventListener('click', () => {
      const modal = createElement('modal-dialog') as ModalDialog;
      modal.setContent(['Some text']);
      modal.show();
    });
  }
}
