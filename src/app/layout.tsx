'use client';

if (process.env.NODE_ENV === 'development') {
  if (typeof window !== 'undefined') {
    import('@/mocks/browser').then(({ worker }) => {
      worker.start({
        onUnhandledRequest: 'bypass',
      });
    });
  }
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-TW">
      <body>{children}</body>
    </html>
  );
}