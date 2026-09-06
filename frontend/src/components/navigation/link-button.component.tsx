import { Button, type ButtonProps } from '@astryxdesign/core/Button';
import NextLink from 'next/link';

export type LinkButtonProps = Omit<ButtonProps, 'as' | 'href' | 'type'> & { href: string };

/**
 * Navigation behåller Next.js routing och riktiga länkar, inklusive öppna i ny flik.
 */
export const LinkButton: React.FC<LinkButtonProps> = (props) => <Button as={NextLink} {...props} />;
