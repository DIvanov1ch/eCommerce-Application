import { LOADING_CLASS, SKELETON_CLASS } from '../../config';
import { HtmlElementFromTagName } from '../../types/elements';
import { createTemplate } from '../../utils/create-element';

export default class BaseComponent extends HTMLElement {
  #html?: string;

  constructor(html?: string) {
    super();
    this.#html = html;
  }

  protected connectedCallback(): void {
    if (this.#html) {
      const template = createTemplate(this.#html);
      const content = template.content.cloneNode(true);
      this.append(content);
    }
  }

  protected $<TagName extends string>(selector: string): HtmlElementFromTagName<TagName> | null {
    return this.querySelector(selector);
  }

  protected $$<TagName extends string>(selector: string): HtmlElementFromTagName<TagName>[] {
    return [...this.querySelectorAll<HtmlElementFromTagName<TagName>>(selector)];
  }

  protected insertHtml(selector: string, html: string | number): void {
    const element = this.$(selector);
    if (element) {
      element.innerHTML = String(html);
    }
  }

  protected toggleLoading(loading = true): void {
    this.classList.toggle(LOADING_CLASS, loading);
    if (!loading) {
      this.$$(`.${SKELETON_CLASS}`).forEach((el) => {
        el.classList.remove(SKELETON_CLASS);
      });
    }
  }

  public clear(): void {
    [...this.children].forEach((node) => node.remove());
  }
}
