export class TerminalTypewriter {
  private element: HTMLElement;
  private speed: number;
  private cursorBlink: number;
  private onComplete?: () => void;
  private currentText: string = '';
  private targetText: string = '';
  private index: number = 0;
  private rafId: number | null = null;
  private blinkInterval: number | null = null;

  constructor(element: HTMLElement, options: { speed?: number; cursorBlink?: number; onComplete?: () => void } = {}) {
    this.element = element;
    this.speed = options.speed ?? 30;
    this.cursorBlink = options.cursorBlink ?? 530;
    this.onComplete = options.onComplete;
    this.init();
  }

  private init() {
    this.element.style.overflow = 'hidden';
    this.element.style.whiteSpace = 'nowrap';
    this.element.style.borderRight = '2px solid var(--accent)';
    this.startBlink();
  }

  private startBlink() {
    this.blinkInterval = window.setInterval(() => {
      this.element.style.borderRightColor = this.element.style.borderRightColor === 'transparent' ? 'var(--accent)' : 'transparent';
    }, this.cursorBlink);
  }

  private stopBlink() {
    if (this.blinkInterval) {
      clearInterval(this.blinkInterval);
      this.blinkInterval = null;
    }
    this.element.style.borderRight = 'none';
  }

  type(text: string) {
    this.targetText = text;
    this.currentText = '';
    this.index = 0;
    this.element.textContent = '';
    this.element.classList.add('typing');
    this.tick();
  }

  private tick() {
    if (this.index < this.targetText.length) {
      this.currentText += this.targetText[this.index++];
      this.element.textContent = this.currentText;
      this.rafId = requestAnimationFrame(() => this.tick());
    } else {
      this.finish();
    }
  }

  private finish() {
    this.element.classList.remove('typing');
    this.element.classList.add('done');
    this.stopBlink();
    this.element.style.whiteSpace = 'normal';
    this.onComplete?.();
  }

  stop() {
    if (this.rafId) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
    this.stopBlink();
  }
}

export function initTypewriters() {
  const elements = document.querySelectorAll<HTMLElement>('[data-typewriter]');
  elements.forEach(el => {
    const text = el.textContent || '';
    const speed = parseInt(el.dataset.typewriterSpeed || '30', 10);
    const tw = new TerminalTypewriter(el, { speed });
    el.dataset.typewriterInit = 'true';
    tw.type(text);
  });
}
