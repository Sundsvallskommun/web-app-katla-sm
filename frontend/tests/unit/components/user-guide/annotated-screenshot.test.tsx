import { AnnotatedScreenshot } from '@components/user-guide/annotated-screenshot.component';
import { HelpLink } from '@components/user-guide/help-link.component';
import { render, screen, within } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

// Den globala stubben i setup renderar bara text. Här behövs bildens namn och adress.
vi.mock('next/image', () => ({
  default: ({ alt, src }: { alt: string; src: string }) => <span role="img" aria-label={alt} data-src={src} />,
}));

const screenshot = {
  file: 'overview.0123abcd.webp',
  width: 1000,
  height: 500,
  targets: { 'new-report-button': { x: 20, y: 100, width: 200, height: 40 } },
};

describe('AnnotatedScreenshot', () => {
  it('lists every instruction as text under the picture, in the order of the numbers', () => {
    render(
      <AnnotatedScreenshot
        screenshot={screenshot}
        alt="Översikten"
        callouts={[
          { target: 'new-report-button', placement: 'right', label: 'Klicka på Ny rapport' },
          { target: 'missing-target', placement: 'right', label: 'Ett element som inte mätts' },
        ]}
      />
    );

    expect(screen.getByRole('img', { name: 'Översikten' })).toHaveAttribute(
      'data-src',
      '/user-guide/overview.0123abcd.webp'
    );
    const items = within(screen.getByRole('list')).getAllByRole('listitem');
    expect(items.map((item) => item.textContent)).toEqual(['1Klicka på Ny rapport', '2Ett element som inte mätts']);
  });

  // Ett element som saknas i manifestet ska inte ge en pil mot fel ställe, men förklaringen och
  // numreringen står kvar så att resten av listan fortfarande stämmer med bilden.
  it('draws arrows only for measured targets', () => {
    const { container } = render(
      <AnnotatedScreenshot
        screenshot={screenshot}
        alt="Översikten"
        callouts={[
          { target: 'missing-target', placement: 'right', label: 'Saknas' },
          { target: 'new-report-button', placement: 'right', label: 'Finns' },
        ]}
      />
    );

    expect(container.querySelectorAll('svg line[marker-end]')).toHaveLength(1);
    const badges = container.querySelectorAll('figure > div > span[aria-hidden="true"]');
    expect([...badges].map((badge) => badge.textContent)).toEqual(['2']);
  });

  it('shows the instructions even before the picture has been generated', () => {
    render(
      <AnnotatedScreenshot
        alt="Översikten"
        callouts={[{ target: 'new-report-button', placement: 'right', label: 'Klicka på Ny rapport' }]}
      />
    );

    expect(screen.queryByRole('img')).not.toBeInTheDocument();
    expect(screen.getByText('Klicka på Ny rapport')).toBeInTheDocument();
  });
});

describe('HelpLink', () => {
  it('links to the user guide in the same tab by default', () => {
    render(<HelpLink />);

    const link = screen.getByRole('link', { name: 'help_link.label' });
    expect(link).toHaveAttribute('href', '/hjalp');
    expect(link).not.toHaveAttribute('target');
  });

  // Från ett osparat formulär öppnas guiden bredvid, och namnet säger att det blir en ny flik.
  it('opens the guide in a new tab when the page holds unsaved work', () => {
    render(<HelpLink openInNewTab />);

    const link = screen.getByRole('link', { name: 'help_link.label_new_tab' });
    expect(link).toHaveAttribute('target', '_blank');
    expect(link).toHaveAttribute('rel', 'noopener');
  });
});
