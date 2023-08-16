import { ElementChild, ElementProps, HtmlElementFromTagName } from '../types/elements';

export function createElement<TagName extends string>(
  tagName: TagName,
  props?: ElementProps,
  ...children: ElementChild[]
): HtmlElementFromTagName<TagName> {
  const element = document.createElement(tagName) as HtmlElementFromTagName<TagName>;
  if (props) {
    Object.assign(element, props);
  }

  children.forEach((child) => {
    if (typeof child !== 'string') element.appendChild(child);
    else element.appendChild(document.createTextNode(child));
  });

  return element;
}

export function createTemplate(html: string): HTMLTemplateElement {
  const template = createElement('template');
  template.innerHTML = html.trim();
  return template;
}

export function dispatch<T>(type: string, detail?: T): void {
  const event = new CustomEvent<T>(type, { detail });
  window.dispatchEvent(event);
}
