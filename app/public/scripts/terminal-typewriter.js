export class TerminalTypewriter {
  constructor(element, options = {}) {
    this.element = element;
    this.speed = options.speed ?? 30;
    this.cursorBlink = options.cursorBlink ?? 530;
    this.onComplete = options.onComplete;
    this.currentText = '';
    this.targetText = '';
    this.index = 0;
    this.rafId = null;
    this.blinkInterval = null;
    this.init();
  }

  init() {
    this.element.style.overflow = 'hidden';
    this.element.style.whiteSpace = 'nowrap';
    this.element.style.borderRight = '2px solid var(--accent)';
    this.startBlink();
  }

  startBlink() {
    this.blinkInterval = window.setInterval(() => {
      this.element.style.borderRightColor = this.element.style.borderRightColor === 'transparent' ? 'var(--accent)' : 'transparent';
    }, this.cursorBlink);
  }

  stopBlink() {
    if (this.blinkInterval) {
      clearInterval(this.blinkInterval);
      this.blinkInterval = null;
    }
    this.element.style.borderRight = 'none';
  }

  type(text) {
    this.targetText = text;
    this.currentText = '';
    this.index = 0;
    this.element.textContent = '';
    this.element.classList.add('typing');
    this.tick();
  }

  tick() {
    if (this.index < this.targetText.length) {
      this.currentText += this.targetText[this.index++];
      this.element.textContent = this.currentText;
      this.rafId = requestAnimationFrame(() => this.tick());
    } else {
      this.finish();
    }
  }

  finish() {
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
