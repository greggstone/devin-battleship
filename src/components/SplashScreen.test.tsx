// @vitest-environment jsdom
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { SPLASH_OPEN_MS, SplashScreen } from './SplashScreen';

let container: HTMLDivElement;
let root: Root;

function render(onEnter: () => void) {
  act(() => root.render(<SplashScreen onEnter={onEnter} />));
}

function clickEnter() {
  const button = container.querySelector<HTMLButtonElement>('.splash__enter');
  expect(button).not.toBeNull();
  act(() => button!.dispatchEvent(new MouseEvent('click', { bubbles: true })));
}

function mockReducedMotion(matches: boolean) {
  vi.stubGlobal(
    'matchMedia',
    vi.fn(() => ({ matches }) as MediaQueryList),
  );
}

beforeEach(() => {
  vi.useFakeTimers();
  // React's act() needs this flag to flush effects synchronously in tests.
  (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
  container = document.createElement('div');
  document.body.appendChild(container);
  root = createRoot(container);
  mockReducedMotion(false);
});

afterEach(() => {
  act(() => root.unmount());
  container.remove();
  vi.unstubAllGlobals();
  vi.useRealTimers();
});

describe('SplashScreen', () => {
  it('renders both doors and the Enter button', () => {
    render(() => {});
    expect(container.querySelectorAll('.splash__door')).toHaveLength(2);
    expect(container.querySelector('.splash__enter')?.textContent).toBe('Enter');
    expect(container.querySelector('.splash--opening')).toBeNull();
  });

  it('enters the opening state on click and calls onEnter after the animation', () => {
    const onEnter = vi.fn();
    render(onEnter);
    clickEnter();

    expect(container.querySelector('.splash--opening')).not.toBeNull();
    expect(container.querySelector<HTMLButtonElement>('.splash__enter')?.disabled).toBe(true);
    expect(onEnter).not.toHaveBeenCalled();

    act(() => vi.advanceTimersByTime(SPLASH_OPEN_MS));
    expect(onEnter).toHaveBeenCalledTimes(1);
  });

  it('skips the animation when the user prefers reduced motion', () => {
    mockReducedMotion(true);
    const onEnter = vi.fn();
    render(onEnter);
    clickEnter();
    expect(onEnter).toHaveBeenCalledTimes(1);
  });
});
