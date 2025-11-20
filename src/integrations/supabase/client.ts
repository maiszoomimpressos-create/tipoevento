import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://yzwfjyejqvawhooecbem.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl6d2ZqeWVqcXZhd2hvb2VjYmVtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM2NjU1MTYsImV4cCI6MjA3OTI0MTUxNn0.6gE4zuVgkFqqjFFCmISzV_M4aVhXygG0IFsW4RP0n5I';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);