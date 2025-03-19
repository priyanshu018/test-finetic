// import React from 'react'
// import type { AppProps } from 'next/app'
// import "react-medium-image-zoom/dist/styles.css";

// import '../styles/globals.css'

// function MyApp({ Component, pageProps }: AppProps) {
//   return <Component {...pageProps} />
// }

// export default MyApp


import React from 'react'
import type { AppProps } from 'next/app'
import "react-medium-image-zoom/dist/styles.css";
import '../styles/globals.css'

// Import Toastify CSS and ToastContainer component
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

function MyApp({ Component, pageProps }: AppProps) {
  return (
    <>
      <Component {...pageProps} />
      {/* The ToastContainer renders the toast notifications */}
      <ToastContainer 
        position="top-right"
        autoClose={5000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
      />
    </>
  );
}

export default MyApp;
