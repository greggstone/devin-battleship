// @vitest-environment jsdom
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import App from './App';

declare global {
  // eslint-disable-next-line no-var
  var IS_REACT_ACT_ENVIRONMENT: boolean;
}
globalThis.IS_REACT_ACT_ENVIRONMENT = true;

describe('App', () => {
  let container: HTMLDivElement;
  let root: Root;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
    root = createRoot(container);
  });

  afterEach(() => {
    act(() => root.unmount());
    container.remove();
  });

  it('shows the splash screen first, then the game after Enter', () => {
    act(() => root.render(<App />));
    expect(container.querySelector('.splash')).not.toBeNull();
    expect(container.querySelector('.app')).toBeNull();

    act(() => container.querySelector('button')!.click());

    expect(container.querySelector('.splash')).toBeNull();
    expect(container.querySelector('.app')).not.toBeNull();
    expect(container.querySelector('.app h1')?.textContent).toBe('Battleship');
  });
});
