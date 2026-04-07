import { createClient } from '@supabase/supabase-js';
import { realtimeSafeDecode } from '@/lib/realtimeSafeDecode';

// Initialize database client
const supabaseUrl = 'https://pyyfyfpfwqoetjiinoai.databasepad.com';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6ImU4NzNkMjg4LTg2MmYtNDFlYy05NmExLTJiNTcwZDdlZDgyNSJ9.eyJwcm9qZWN0SWQiOiJweXlmeWZwZndxb2V0amlpbm9haSIsInJvbGUiOiJhbm9uIiwiaWF0IjoxNzc1NTE2MjU4LCJleHAiOjIwOTA4NzYyNTgsImlzcyI6ImZhbW91cy5kYXRhYmFzZXBhZCIsImF1ZCI6ImZhbW91cy5jbGllbnRzIn0.dygjJ4UHu4Jp6hrGSUkt1Cveg9suOx23Zfn9bmUPSXk';
const supabase = createClient(supabaseUrl, supabaseKey, {
  realtime: { decode: realtimeSafeDecode },
});


export { supabase };