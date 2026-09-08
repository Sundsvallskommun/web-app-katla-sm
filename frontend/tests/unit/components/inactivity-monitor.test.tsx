import { InactivityMonitor } from '@components/inactivity-monitor.component';
import { act, cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const session = vi.hoisted(() => {
  vi.stubEnv('NEXT_PUBLIC_INACTIVITY_WARNING_TIMEOUT', '10000');
  vi.stubEnv('NEXT_PUBLIC_INACTIVITY_COUNTDOWN_TIMEOUT', '3000');
  return { pathname: '/oversikt', router: { push: vi.fn() } };
});

vi.mock('next/navigation', () => ({
  useRouter: () => session.router,
  usePathname: () => session.pathname,
}));
vi.mock('react-i18next', () => ({ useTranslation: () => ({ t: (key: string) => key }) }));

const advance = (milliseconds: number): void => {
  act(() => {
    vi.advanceTimersByTime(milliseconds);
  });
};

beforeEach(() => {
  vi.useFakeTimers();
  session.pathname = '/oversikt';
  session.router.push.mockClear();
});

afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

describe('inactivity session warning', () => {
  it('restarts the idle period on activity, then logs out when the visible countdown expires', () => {
    render(<InactivityMonitor />);
    advance(9000);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    fireEvent.mouseMove(document);
    advance(1000);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    advance(9000);

    const warning = screen.getByRole('dialog', { name: 'warning_title' });
    expect(within(warning).getByText('00:03')).toBeVisible();
    advance(1000);
    expect(within(warning).getByText('00:02')).toBeVisible();
    // Ordinary activity cannot dismiss a warning or silently extend its deadline.
    fireEvent.mouseMove(document);
    advance(2000);
    expect(session.router.push).toHaveBeenCalledExactlyOnceWith('/logout');
  });

  it('stays logged in explicitly and starts a fresh countdown for the next warning', () => {
    render(<InactivityMonitor />);
    advance(10000);
    advance(2000);
    fireEvent.click(screen.getByRole('button', { name: 'stay_button' }));
    advance(1000);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(session.router.push).not.toHaveBeenCalled();

    advance(9000);
    expect(within(screen.getByRole('dialog', { name: 'warning_title' })).getByText('00:03')).toBeVisible();
    advance(3000);
    expect(session.router.push).toHaveBeenCalledExactlyOnceWith('/logout');
  });

  it('lets the user dismiss the warning with Escape without logging out', () => {
    render(<InactivityMonitor />);
    advance(10000);
    fireEvent.keyDown(document, { key: 'Escape' });
    advance(3000);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(session.router.push).not.toHaveBeenCalled();
  });

  it('logs out immediately on request and clears pending timers on unmount', () => {
    const view = render(<InactivityMonitor />);
    advance(10000);
    fireEvent.click(screen.getByRole('button', { name: 'logout_button' }));
    expect(session.router.push).toHaveBeenCalledExactlyOnceWith('/logout');
    view.unmount();
    advance(20000);
    expect(session.router.push).toHaveBeenCalledTimes(1);
  });

  it.each(['/login', '/en/logout'])('does not start a warning on %s', (pathname) => {
    session.pathname = pathname;
    render(<InactivityMonitor />);
    advance(20000);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(session.router.push).not.toHaveBeenCalled();
  });
});
