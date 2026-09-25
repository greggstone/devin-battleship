// @vitest-environment jsdom
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { SplashScreen } from './SplashScreen';

declare global {
  // eslint-disable-next-line no-var
  var IS_REACT_ACT_ENVIRONMENT: boolean;
}
globalThis.IS_REACT_ACT_ENVIRONMENT = true;

describe('SplashScreen', () => {
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

  it('renders the logo, title and Enter button', () => {
    act(() => root.render(<SplashScreen onEnter={() => {}} />));
    expect(container.querySelector('.splash__ship')).not.toBeNull();
    expect(container.querySelector('h1')?.textContent).toBe('Battleship');
    expect(container.querySelector('button')?.textContent).toBe('Enter');
  });

  it('calls onEnter when Enter is clicked', () => {
    const onEnter = vi.fn();
    act(() => root.render(<SplashScreen onEnter={onEnter} />));
    act(() => container.querySelector('button')!.click());
    expect(onEnter).toHaveBeenCalledTimes(1);
  });
});
