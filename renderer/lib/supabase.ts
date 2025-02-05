import { createClient } from '@supabase/supabase-js';

export const supabase = createClient(
  'https://ygmjdexujknxnpyqxjzi.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlnbWpkZXh1amtueG5weXF4anppIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzgxNzgyNzQsImV4cCI6MjA1Mzc1NDI3NH0.Qx2nIQU_ucLJW1O05G-BLTvNfu6YKZQ9h5JxjPT65Mk'
);

