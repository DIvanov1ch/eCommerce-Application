export type ElementChild = ChildNode | string;

export type HtmlElementFromTagName<TagName extends string> = TagName extends keyof HTMLElementTagNameMap
  ? HTMLElementTagNameMap[TagName]
  : HTMLElement;

export type ElementProps = Record<string, string> | null;
