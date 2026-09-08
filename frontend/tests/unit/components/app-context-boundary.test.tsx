import { AppContextBoundary } from '@components/auth/app-context-boundary.component';
import { AppContextMismatchError, verifyApplicationContext } from '@services/application-service';
import { act, fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@services/application-service', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@services/application-service')>()),
  verifyApplicationContext: vi.fn(),
}));
vi.mock('next/navigation', () => ({ usePathname: () => '/katlor' }));
const verify = vi.mocked(verifyApplicationContext);
beforeEach(() => vi.clearAllMocks());

describe('deployment identity boundary', () => {
  it('mounts application contents only after the backend identity has been verified', async () => {
    let complete: (() => void) | undefined;
    verify.mockReturnValue(
      new Promise<void>((resolve) => {
        complete = resolve;
      })
    );
    render(
      <AppContextBoundary>
        <p>Case contents</p>
      </AppContextBoundary>
    );
    expect(screen.queryByText('Case contents')).not.toBeInTheDocument();
    await act(async () => {
      complete?.();
      await Promise.resolve();
    });
    expect(screen.getByText('Case contents')).toBeInTheDocument();
  });

  it('blocks mismatched deployments with an explicit error', async () => {
    verify.mockRejectedValue(new AppContextMismatchError());
    render(
      <AppContextBoundary>
        <p>Case contents</p>
      </AppContextBoundary>
    );
    expect(await screen.findByRole('alert')).toHaveTextContent('olika konfiguration');
    expect(screen.queryByText('Case contents')).not.toBeInTheDocument();
  });

  it('can retry an unavailable backend without exposing application contents early', async () => {
    verify.mockRejectedValueOnce(new Error('offline')).mockResolvedValueOnce(undefined);
    render(
      <AppContextBoundary>
        <p>Case contents</p>
      </AppContextBoundary>
    );
    expect(await screen.findByRole('alert')).toHaveTextContent('inte att ansluta');
    expect(screen.queryByText('Case contents')).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Försök igen' }));
    expect(await screen.findByText('Case contents')).toBeInTheDocument();
  });
});
