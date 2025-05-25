// @ts-nocheck
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from './supabase';

/**
 * useAuthenticatedLayout
 * - Subscribes to auth state changes.
 * - On mount, checks the current session.
 * - If no session is found, redirects to '/login'.
 * - If a session exists, sets loading to false.
 * - Listens for subsequent auth changes and redirects if the session is lost.
 */
export const useAuthenticatedLayout = () => {
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  // Function to check if the user exists in the users table and create one if not.
  const checkAndCreateUser = async (session) => {
    const email = session.user.email;

    // Query the users table for a record with the logged-in email.
    const { data: users, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', email);

    if (error) {
      console.error("Error checking for user record:", error);
      return;
    }

    // If no record exists, insert a new one.
    if (users.length === 0) {
      const { error: insertError } = await supabase
        .from('users')
        .insert({ email });
      if (insertError) {
        console.error("Error creating user record:", insertError);
      }
    }
  };

  useEffect(() => {
    // Initial session check.
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push('/');
      } else {
        await checkAndCreateUser(session);
        setLoading(false);
      }
    };

    checkSession();

    // Set up the auth state change listener.
    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!session) {
          router.push('/');
        } else {
          await checkAndCreateUser(session);
        }
        setLoading(false);
      }
    );
    setLoading(false);
    return () => {
      // Clean up the subscription when the component unmounts.
      authListener.subscription.unsubscribe();
    };
  }, [router]);

  return loading;
};


/**
 * useUnauthenticatedLayout
 * - Subscribes to auth state changes.
 * - On mount, checks the current session.
 * - If a session exists, redirects to '/dashboard'.
 * - If no session is found, sets loading to false.
 * - Listens for subsequent auth changes and redirects if a session is established.
 */
export const useUnauthenticatedLayout = () => {
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  // Function to check if the user exists in the users table and create one if not.
  const checkAndCreateUser = async (session) => {
    const email = session.user.email;

    // Query the users table to see if a record exists for this email.
    const { data: users, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', email);

    if (error) {
      console.error("Error checking for existing user:", error);
      return;
    }

    // If no user is found, insert a new record.
    if (users.length === 0) {
      const { error: insertError } = await supabase
        .from('users')
        .insert({ email });
      if (insertError) {
        console.error("Error creating user record:", insertError);
      }
    }
  };

  useEffect(() => {
    // Initial session check.
    const checkSession = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (session) {
        await checkAndCreateUser(session);
        router.push('/dashboard');
      } else {
        setLoading(false);
      }
    };

    checkSession();

    // Set up the auth state change listener.
    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (session) {
          await checkAndCreateUser(session);
          router.push('/dashboard');
        }
      }
    );

    return () => {
      // Clean up the subscription when the component unmounts.
      authListener.subscription.unsubscribe();
    };
  }, [router]);

  return loading;
};
