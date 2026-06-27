import { Html, Head, Main, NextScript } from 'next/document';
import Script from 'next/script';
import { themeBootstrapScript } from '@/utils/themeBootstrap';

export default function Document() {
  return (
    <Html lang="en" suppressHydrationWarning>
      <Head>
        {/* For critical theme initialization that must run before React mounts */}
        <Script
          id="theme-bootstrap-critical"
          strategy="beforeInteractive"
          dangerouslySetInnerHTML={{ __html: themeBootstrapScript }}
        />
        {/* For environment config that can load slightly later */}
        <Script src="/env-config.js" strategy="afterInteractive" />
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#6366f1" />
        <link rel="apple-touch-icon" href="/axionvera.svg" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="Axionvera" />
      </Head>
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}