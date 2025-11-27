/**
 * Test Supabase Connection
 * 
 * This utility tests the Supabase connection and basic operations.
 * Run this from the console or add it to a test screen.
 */

import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { TABLES } from '@/lib/supabase';

export interface ConnectionTestResult {
  configured: boolean;
  connectionTest: {
    success: boolean;
    error?: string;
    message: string;
  };
  authTest: {
    success: boolean;
    error?: string;
    message: string;
  };
  tableTest: {
    success: boolean;
    error?: string;
    message: string;
    tablesChecked: string[];
  };
}

export async function testSupabaseConnection(): Promise<ConnectionTestResult> {
  const result: ConnectionTestResult = {
    configured: isSupabaseConfigured,
    connectionTest: {
      success: false,
      message: 'Not tested',
    },
    authTest: {
      success: false,
      message: 'Not tested',
    },
    tableTest: {
      success: false,
      message: 'Not tested',
      tablesChecked: [],
    },
  };

  // Test 1: Configuration Check
  if (!isSupabaseConfigured) {
    result.connectionTest = {
      success: false,
      message: 'Supabase is not configured. Check your .env file.',
    };
    return result;
  }

  result.connectionTest = {
    success: true,
    message: 'Supabase is configured correctly.',
  };

  // Test 2: Connection Test (try to fetch from a table)
  try {
    // Try to fetch from user_profiles table (should work even if empty)
    const { data, error } = await supabase
      .from(TABLES.USER_PROFILES)
      .select('count')
      .limit(1);

    if (error) {
      // Check if it's a permissions error (table exists but RLS blocks access)
      if (error.code === 'PGRST116' || error.message?.includes('permission denied') || error.message?.includes('row-level security')) {
        result.connectionTest = {
          success: true,
          message: 'Connection successful (RLS may be blocking access - this is normal)',
        };
      } else if (error.code === '42P01') {
        // Table doesn't exist
        result.connectionTest = {
          success: false,
          error: error.message,
          message: `Table '${TABLES.USER_PROFILES}' does not exist. Run the SQL schema first.`,
        };
      } else {
        result.connectionTest = {
          success: false,
          error: error.message,
          message: `Connection test failed: ${error.message}`,
        };
      }
    } else {
      result.connectionTest = {
        success: true,
        message: 'Connection successful! Database is accessible.',
      };
    }
  } catch (error: any) {
    result.connectionTest = {
      success: false,
      error: error.message,
      message: `Connection test error: ${error.message}`,
    };
  }

  // Test 3: Auth Test
  try {
    const { data: authData, error: authError } = await supabase.auth.getSession();
    
    if (authError) {
      result.authTest = {
        success: false,
        error: authError.message,
        message: `Auth check failed: ${authError.message}`,
      };
    } else {
      result.authTest = {
        success: true,
        message: authData.session ? 'Auth is working (user session found)' : 'Auth is working (no active session)',
      };
    }
  } catch (error: any) {
    result.authTest = {
      success: false,
      error: error.message,
      message: `Auth test error: ${error.message}`,
    };
  }

  // Test 4: Table Existence Test
  const tablesToCheck = [
    TABLES.USER_PROFILES,
    TABLES.CANINE_PROFILES,
    TABLES.VET_PROFILES,
    TABLES.CONTACTS,
    TABLES.NUTRITION_ENTRIES,
    TABLES.TRAINING_LOGS,
    TABLES.APPOINTMENTS,
    TABLES.MEDIA_ITEMS,
  ];

  const tableResults: string[] = [];
  let allTablesExist = true;

  for (const table of tablesToCheck) {
    try {
      const { error } = await supabase.from(table).select('*').limit(0);
      
      if (error) {
        if (error.code === '42P01') {
          // Table doesn't exist
          tableResults.push(`❌ ${table} - Table does not exist`);
          allTablesExist = false;
        } else if (error.code === 'PGRST116' || error.message?.includes('permission denied')) {
          // Table exists but RLS blocks access (this is OK)
          tableResults.push(`✅ ${table} - Exists (RLS may block access)`);
        } else {
          tableResults.push(`⚠️ ${table} - ${error.message}`);
          allTablesExist = false;
        }
      } else {
        tableResults.push(`✅ ${table} - Exists and accessible`);
      }
    } catch (error: any) {
      tableResults.push(`❌ ${table} - Error: ${error.message}`);
      allTablesExist = false;
    }
  }

  result.tableTest = {
    success: allTablesExist,
    message: allTablesExist 
      ? 'All tables exist and are accessible' 
      : 'Some tables are missing or inaccessible. Run the SQL schema.',
    tablesChecked: tableResults,
  };

  return result;
}

/**
 * Print test results to console in a readable format
 */
export function printTestResults(result: ConnectionTestResult) {
  console.log('\n' + '='.repeat(60));
  console.log('🔍 SUPABASE CONNECTION TEST RESULTS');
  console.log('='.repeat(60));
  
  console.log('\n📋 Configuration:');
  console.log(`   ${result.configured ? '✅' : '❌'} Supabase ${result.configured ? 'is' : 'is NOT'} configured`);
  
  console.log('\n🔌 Connection Test:');
  console.log(`   ${result.connectionTest.success ? '✅' : '❌'} ${result.connectionTest.message}`);
  if (result.connectionTest.error) {
    console.log(`   Error: ${result.connectionTest.error}`);
  }
  
  console.log('\n🔐 Authentication Test:');
  console.log(`   ${result.authTest.success ? '✅' : '❌'} ${result.authTest.message}`);
  if (result.authTest.error) {
    console.log(`   Error: ${result.authTest.error}`);
  }
  
  console.log('\n📊 Table Existence Test:');
  console.log(`   ${result.tableTest.success ? '✅' : '❌'} ${result.tableTest.message}`);
  console.log('   Tables:');
  result.tableTest.tablesChecked.forEach((table) => {
    console.log(`      ${table}`);
  });
  
  console.log('\n' + '='.repeat(60));
  console.log('Test Complete');
  console.log('='.repeat(60) + '\n');
}



