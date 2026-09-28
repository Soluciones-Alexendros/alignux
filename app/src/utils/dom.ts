export function $(selector: string, parent: Document | Element = document): Element | null {
  return parent.querySelector(selector);
}

export function $$(selector: string, parent: Document | Element = document): NodeListOf<Element> {
  return parent.querySelectorAll(selector);
}

export function createElement<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  attrs: Record<string, string> = {},
  children: (Node | string)[] = []
): HTMLElementTagNameMap[K] {
  const el = document.createElement(tag);
  Object.entries(attrs).forEach(([k, v]) => el.setAttribute(k, v));
  children.forEach(c => el.append(c instanceof Node ? c : document.createTextNode(c)));
  return el;
}

export function setHTML(el: Element, html: string): void {
  el.innerHTML = html;
}

export function addClass(el: Element, ...classes: string[]): void {
  el.classList.add(...classes);
}

export function removeClass(el: Element, ...classes: string[]): void {
  el.classList.remove(...classes);
}

export function toggleClass(el: Element, className: string, force?: boolean): boolean {
  return el.classList.toggle(className, force);
}

export function on<K extends keyof HTMLElementEventMap>(
  el: Element | null,
  type: K,
  listener: (ev: HTMLElementEventMap[K]) => void,
  options?: boolean | AddEventListenerOptions
): () => void {
  if (!el) return () => {};
  el.addEventListener(type, listener, options);
  return () => el.removeEventListener(type, listener, options);
}
