import './footer.scss';
import html from './footer.html';
import createTemplate from '../../utils';

const template = createTemplate(html);

export default class PageFooter extends HTMLElement {
  private connectedCallback(): void {
    const content = template.content.cloneNode(true);
    this.append(content);
  }
}
