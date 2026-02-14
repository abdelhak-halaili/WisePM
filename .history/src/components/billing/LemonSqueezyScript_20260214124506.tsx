'use client';

import { useEffect } from 'react';
import Script from 'next/script';

export default function LemonSqueezyScript() {
  return (
    <Script
      src="https://assets.lemonsqueezy.com/lemon.js"
      strategy="lazyOnload"
      onLoad={() => {
        // @ts-ignore
        if (window.createLemonSqueezy) {
           // @ts-ignore
           window.createLemonSqueezy();
        }
      }}
    />
  );
}
