import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://btwpuhsrqjgqrknymutg.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ0d3B1aHNycWpncXJrbnltdXRnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODc3Mzc1MjcsImV4cCI6MjEwMzMxMzUyN30.O3nPLZQNNqjNKIVkxnXKlm0pePKhl_9fwcj93GCE84g'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
