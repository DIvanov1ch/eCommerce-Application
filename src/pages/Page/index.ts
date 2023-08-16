import createTemplate from '../../utils';

export default class Page extends HTMLElement {
  #html: string;

  constructor(html: string) {
    super();
    this.#html = html;
  }

  protected connectedCallback(): void {
    const template = createTemplate(this.#html);
    const content = template.content.cloneNode(true);
    this.append(content);
  }
}