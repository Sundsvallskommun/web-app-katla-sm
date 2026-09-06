'use client';

import { Heading } from '@astryxdesign/core/Heading';
import { Text } from '@astryxdesign/core/Text';
import { VStack } from '@astryxdesign/core/VStack';

interface SectionHeaderProps {
  title: string;
  description?: string;
  as?: 'h2' | 'h3';
  className?: string;
  headingClassName?: string;
}

export const SectionHeader: React.FC<SectionHeaderProps> = ({
  title,
  description,
  as = 'h2',
  className,
  headingClassName,
}) => (
  <VStack gap={2} className={className}>
    <Heading level={as === 'h3' ? 3 : 2} className={headingClassName}>
      {title}
    </Heading>
    {description && <Text color="secondary">{description}</Text>}
  </VStack>
);
