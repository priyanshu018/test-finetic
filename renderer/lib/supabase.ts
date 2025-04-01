import { createClient } from '@supabase/supabase-js';

export const supabase = createClient(
  'https://ygmjdexujknxnpyqxjzi.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlnbWpkZXh1amtueG5weXF4anppIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTczODE3ODI3NSwiZXhwIjoyMDUzNzU0Mjc1fQ.buox9zYTmt3OOWpXHwLTiagqNLpeyw3KuqE2zJBwDx4'
);

