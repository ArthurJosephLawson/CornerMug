export interface InputAxis {
  x: number;
  y: number;
}

const UP_KEYS = new Set(['KeyW', 'ArrowUp']);
const DOWN_KEYS = new Set(['KeyS', 'ArrowDown']);
const LEFT_KEYS = new Set(['KeyA', 'ArrowLeft']);
const RIGHT_KEYS = new Set(['KeyD', 'ArrowRight']);
const INTERACT_KEYS = new Set(['KeyE', 'Space', 'Enter']);

/**
 * Keyboard input for the canvas engine. Owns its listeners and exposes an
 * axis plus an edge-triggered interact flag.
 */
export class InputController {
  private pressed = new Set<string>();
  private interactQueued = false;
  private attached = false;

  private isTypingTarget(event: KeyboardEvent): boolean {
    const target = event.target;
    if (!(target instanceof HTMLElement)) return false;
    return (
      target.tagName === 'INPUT' ||
      target.tagName === 'TEXTAREA' ||
      target.tagName === 'SELECT' ||
      target.isContentEditable
    );
  }

  private handleKeyDown = (event: KeyboardEvent): void => {
    // Never capture game keys while the player is typing in chat or a form.
    if (this.isTypingTarget(event)) return;
    if (event.repeat) {
      if (this.isGameKey(event.code)) event.preventDefault();
      return;
    }
    this.pressed.add(event.code);
    if (INTERACT_KEYS.has(event.code)) {
      this.interactQueued = true;
      event.preventDefault();
    }
    if (this.isGameKey(event.code)) event.preventDefault();
  };

  private handleKeyUp = (event: KeyboardEvent): void => {
    this.pressed.delete(event.code);
  };

  private handleBlur = (): void => {
    this.pressed.clear();
  };

  attach(): void {
    if (this.attached) return;
    window.addEventListener('keydown', this.handleKeyDown);
    window.addEventListener('keyup', this.handleKeyUp);
    window.addEventListener('blur', this.handleBlur);
    this.attached = true;
  }

  detach(): void {
    if (!this.attached) return;
    window.removeEventListener('keydown', this.handleKeyDown);
    window.removeEventListener('keyup', this.handleKeyUp);
    window.removeEventListener('blur', this.handleBlur);
    this.attached = false;
    this.pressed.clear();
  }

  getAxis(): InputAxis {
    let x = 0;
    let y = 0;
    for (const code of this.pressed) {
      if (UP_KEYS.has(code)) y -= 1;
      else if (DOWN_KEYS.has(code)) y += 1;
      else if (LEFT_KEYS.has(code)) x -= 1;
      else if (RIGHT_KEYS.has(code)) x += 1;
    }
    if (x !== 0 && y !== 0) {
      const inverse = Math.SQRT1_2;
      x *= inverse;
      y *= inverse;
    }
    return { x, y };
  }

  consumeInteract(): boolean {
    if (!this.interactQueued) return false;
    this.interactQueued = false;
    return true;
  }

  private isGameKey(code: string): boolean {
    return (
      UP_KEYS.has(code) ||
      DOWN_KEYS.has(code) ||
      LEFT_KEYS.has(code) ||
      RIGHT_KEYS.has(code) ||
      INTERACT_KEYS.has(code)
    );
  }
}
