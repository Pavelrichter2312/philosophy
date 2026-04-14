interface PageWrapperProps {
  children: React.ReactNode;
  className?: string;
}

export default function PageWrapper({ children, className = '' }: PageWrapperProps) {
  return (
    <main className={`max-w-grid mx-auto px-6 py-12 ${className}`}>
      {children}
    </main>
  );
}
