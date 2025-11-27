/**
 * Supabase Client Configuration
 * 
 * This file initializes two Supabase clients:
 * 1. App Client (anon key) - For app user authentication
 * 2. Service Client (service role key) - For database operations
 * 
 * Architecture:
 * - App users authenticate using the app client (anon key)
 * - Database operations use the service client (service role key) which bypasses RLS
 * - These are distinct: app users are for authentication, service user is for DB operations
 * 
 * To set up Supabase:
 * 1. Create a project at https://supabase.com
 * 2. Get your project URL, anon key, and service role key from Settings > API
 * 3. Create a .env file in the AvaApp directory with:
 *    EXPO_PUBLIC_SUPABASE_URL=your-project-url
 *    EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
 *    SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
 * 
 * IMPORTANT: 
 * - For Expo, environment variables must be prefixed with EXPO_PUBLIC_ to be accessible in the app
 * - Service role key should NOT be prefixed with EXPO_PUBLIC_ (security)
 * - After creating/updating .env, restart the dev server.
 * 
 * See docs/ENV_SETUP.md for detailed instructions.
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import Constants from 'expo-constants';

// Get Supabase URL and keys from multiple sources (in order of priority):
// 1. Constants.expoConfig.extra (from app.json)
// 2. process.env (from .env file - Expo automatically loads .env files)
const supabaseUrl = 
  Constants.expoConfig?.extra?.supabaseUrl || 
  process.env.EXPO_PUBLIC_SUPABASE_URL || 
  (process.env as any).SUPABASE_URL ||
  '';
  
const supabaseAnonKey = 
  Constants.expoConfig?.extra?.supabaseAnonKey || 
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || 
  (process.env as any).SUPABASE_ANON_KEY ||
  '';

// Service role key (for database operations)
// Note: In Expo, environment variables need EXPO_PUBLIC_ prefix to be accessible
// For security, prefer using app.json extra config or secure storage
// If using .env, you may need EXPO_PUBLIC_SUPABASE_SERVICE_ROLE_KEY (less secure but works in Expo)
const supabaseServiceRoleKey = 
  Constants.expoConfig?.extra?.supabaseServiceRoleKey || 
  process.env.EXPO_PUBLIC_SUPABASE_SERVICE_ROLE_KEY ||
  (process.env as any).SUPABASE_SERVICE_ROLE_KEY ||
  '';

// Debug logging (remove in production)
if (__DEV__) {
  console.log('🔍 Supabase Configuration Check:');
  console.log('  - supabaseUrl:', supabaseUrl ? `${supabaseUrl.substring(0, 20)}...` : 'NOT SET');
  console.log('  - supabaseAnonKey:', supabaseAnonKey ? `${supabaseAnonKey.substring(0, 20)}...` : 'NOT SET');
  console.log('  - supabaseServiceRoleKey:', supabaseServiceRoleKey ? 'SET (hidden)' : 'NOT SET');
}

// Check if Supabase is configured
export const isSupabaseConfigured = !!(supabaseUrl && supabaseAnonKey && supabaseUrl !== '' && supabaseAnonKey !== '' && supabaseUrl !== 'https://placeholder.supabase.co');
export const isServiceRoleConfigured = !!(supabaseUrl && supabaseServiceRoleKey && supabaseServiceRoleKey !== '');

if (!isSupabaseConfigured) {
  console.warn(
    '⚠️ Supabase URL or Anon Key not found. The app will use test data.\n' +
    'To enable Supabase, create a .env file in the root directory with:\n' +
    '  EXPO_PUBLIC_SUPABASE_URL=your-project-url\n' +
    '  EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key\n' +
    '  SUPABASE_SERVICE_ROLE_KEY=your-service-role-key\n' +
    '\n' +
    'Or add them to app.json under expo.extra:\n' +
    '  "extra": {\n' +
    '    "supabaseUrl": "your-project-url",\n' +
    '    "supabaseAnonKey": "your-anon-key",\n' +
    '    "supabaseServiceRoleKey": "your-service-role-key"\n' +
    '  }'
  );
} else {
  console.log('✅ Supabase is configured and ready to use!');
  if (!isServiceRoleConfigured) {
    console.warn('⚠️ Service role key not configured. Database operations may fail. Add SUPABASE_SERVICE_ROLE_KEY to .env');
  }
}

/**
 * App Supabase client (anon key)
 * This client is used for app user authentication only.
 * It respects Row Level Security (RLS) policies.
 */
export const supabase: SupabaseClient = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: false,
      },
    })
  : // Create a dummy client with placeholder values to prevent errors
    createClient('https://placeholder.supabase.co', 'placeholder-key', {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
        detectSessionInUrl: false,
      },
    });

/**
 * Service Supabase client (service role key)
 * This client is used for database operations and bypasses RLS.
 * It should only be used in the database service layer, not in the UI.
 * 
 * WARNING: The service role key has full access to your database.
 * Never expose this key to the client-side code or commit it to version control.
 */
export const supabaseService: SupabaseClient = isServiceRoleConfigured
  ? createClient(supabaseUrl, supabaseServiceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
        detectSessionInUrl: false,
      },
    })
  : // Fallback to anon key if service role not configured (for development)
    supabase;

/**
 * Database table names
 */
export const TABLES = {
  USER_PROFILES: 'user_profiles',
  CANINE_PROFILES: 'canine_profiles',
  VET_PROFILES: 'vet_profiles',
  CONTACTS: 'contacts',
  NUTRITION_ENTRIES: 'nutrition_entries',
  TRAINING_LOGS: 'training_logs',
  APPOINTMENTS: 'appointments',
  MEDIA_ITEMS: 'media_items',
  MEDICAL_RECORDS: 'medical_records',
  MEDICATIONS: 'medications',
  VET_VISITS: 'vet_visits',
  IMMUNIZATIONS: 'immunizations',
  CANINE_ALLERGIES: 'canine_allergies',
} as const;

