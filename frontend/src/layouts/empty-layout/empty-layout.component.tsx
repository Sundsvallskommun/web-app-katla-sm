interface EmptyLayoutProps {
  children: React.ReactNode;
}

export default function EmptyLayout({ children }: EmptyLayoutProps) {
  return <div className="bg-surface min-h-screen">{children}</div>;
}
