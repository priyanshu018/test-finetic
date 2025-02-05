import React from 'react'
import type { AppProps } from 'next/app'
import "react-medium-image-zoom/dist/styles.css";

import '../styles/globals.css'

function MyApp({ Component, pageProps }: AppProps) {
  return <Component {...pageProps} />
}

export default MyApp
