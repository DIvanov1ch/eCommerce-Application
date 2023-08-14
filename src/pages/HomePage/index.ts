import './home.scss';
import html from './home.html';
import createTemplate from '../../utils';

const template = createTemplate(html);

export default class HomePage extends HTMLElement {
  private connectedCallback(): void {
    const content = template.content.cloneNode(true);
    this.append(content);
  }
}
