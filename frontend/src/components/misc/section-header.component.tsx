'use client';

import { cx } from '@sk-web-gui/react';

interface SectionHeaderProps {
  title: string;
  description?: string;
  /** Rubriknivån följer sidans rubrikordning, inte utseendet – därför skild från storleken. */
  as?: 'h2' | 'h3';
  className?: string;
  headingClassName?: string;
}

/**
 * Avsnittets rubrik med beskrivningen direkt under. De två hör ihop: beskrivningen säger vad
 * avsnittet vill ha och läses innan fälten, så avståndet mellan dem är litet och luften läggs
 * i stället ned mot innehållet.
 */
export const SectionHeader: React.FC<SectionHeaderProps> = ({
  title,
  description,
  as: Heading = 'h2',
  className,
  headingClassName = 'text-h3-md',
}) => (
  <div className={cx('flex flex-col gap-4', className)}>
    {/* min-w-0 låter rubriken krympa i stället för att trycka ut det som ligger bredvid */}
    <Heading className={cx('text-dark-primary min-w-0', headingClassName)}>{title}</Heading>
    {description ?
      <p className="text-dark-secondary">{description}</p>
    : null}
  </div>
);
