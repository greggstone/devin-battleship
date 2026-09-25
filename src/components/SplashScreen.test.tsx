// @vitest-environment jsdom
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { SplashScreen } from './SplashScreen';

// React's act() refuses to run outside a test environment unless told so.
(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

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

  it('renders a single Enter button', () => {
    act(() => root.render(<SplashScreen onEnter={() => {}} />));
    const buttons = container.querySelectorAll('button');
    expect(buttons).toHaveLength(1);
    expect(buttons[0].textContent).toBe('Enter');
  });

  it('calls onEnter when Enter is clicked', () => {
    const onEnter = vi.fn();
    act(() => root.render(<SplashScreen onEnter={onEnter} />));
    act(() => container.querySelector('button')!.click());
    expect(onEnter).toHaveBeenCalledTimes(1);
  });
});
