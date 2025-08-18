import React, { useEffect, useState } from 'react'
import type { AppProps } from 'next/app'
import Head from 'next/head'
import '../styles/globals.css'

// Import Toastify CSS and ToastContainer component
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import TallyConnectionOverlay from '../components/tallyConnected';
import { supabase } from '../lib/supabase';
import FloatingSupportWidget from './support';

function MyApp({ Component, pageProps }: AppProps) {
  const [user, setUser] = useState(null)
  useEffect(() => {
    supabase.auth.onAuthStateChange((e, session) => {
      // console.log(session?.user)
      if (session?.user) {
        setUser(session?.user);
      } else {
        setUser(null)
      }
    });
  }, []);
  return (
    <>
      <Head>

        {/* Tailwind CSS CDN */}
        <script src="https://cdn.tailwindcss.com"></script>
      </Head>
      {Boolean(user) && (
        <TallyConnectionOverlay />
      )}

      {Boolean(user) && (
        <FloatingSupportWidget user={user} />
      )}

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