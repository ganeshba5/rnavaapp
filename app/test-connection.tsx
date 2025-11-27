/**
 * Test Supabase Connection Screen
 * 
 * This screen allows you to test the Supabase connection and see the results.
 * Access it at /test-connection
 */

import { useState } from 'react';
import { StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { testSupabaseConnection, printTestResults, ConnectionTestResult } from '@/utils/testSupabaseConnection';
import { isSupabaseConfigured } from '@/lib/supabase';

export default function TestConnectionScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const [result, setResult] = useState<ConnectionTestResult | null>(null);
  const [loading, setLoading] = useState(false);

  const handleTest = async () => {
    setLoading(true);
    try {
      const testResult = await testSupabaseConnection();
      setResult(testResult);
      printTestResults(testResult); // Also print to console
      
      // Show summary alert
      const allSuccess = testResult.connectionTest.success && 
                        testResult.authTest.success && 
                        testResult.tableTest.success;
      
      Alert.alert(
        allSuccess ? '✅ Test Successful' : '⚠️ Test Complete',
        allSuccess 
          ? 'All tests passed! Supabase is working correctly.'
          : 'Some tests failed. Check the results below or in the console.'
      );
    } catch (error: any) {
      Alert.alert('Test Error', error.message || 'An error occurred during testing');
      console.error('Test error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
      <ThemedView style={styles.content}>
        <ThemedText type="title" style={styles.title}>
          Test Supabase Connection
        </ThemedText>
        
        <ThemedText style={styles.description}>
          This tool tests your Supabase connection, authentication, and database tables.
        </ThemedText>

        <ThemedView style={styles.statusBox}>
          <ThemedText style={styles.statusLabel}>Configuration Status:</ThemedText>
          <ThemedText style={[styles.statusValue, { color: isSupabaseConfigured ? '#10B981' : '#EF4444' }]}>
            {isSupabaseConfigured ? '✅ Configured' : '❌ Not Configured'}
          </ThemedText>
        </ThemedView>

        <TouchableOpacity
          style={[styles.button, { backgroundColor: colors.tint }]}
          onPress={handleTest}
          disabled={loading}>
          <ThemedText style={styles.buttonText}>
            {loading ? 'Testing...' : 'Run Connection Test'}
          </ThemedText>
        </TouchableOpacity>

        {result && (
          <ThemedView style={styles.results}>
            <ThemedText type="subtitle" style={styles.resultsTitle}>
              Test Results
            </ThemedText>

            <ThemedView style={styles.resultSection}>
              <ThemedText style={styles.resultLabel}>Connection Test:</ThemedText>
              <ThemedText style={[styles.resultValue, { color: result.connectionTest.success ? '#10B981' : '#EF4444' }]}>
                {result.connectionTest.success ? '✅' : '❌'} {result.connectionTest.message}
              </ThemedText>
              {result.connectionTest.error && (
                <ThemedText style={styles.errorText}>{result.connectionTest.error}</ThemedText>
              )}
            </ThemedView>

            <ThemedView style={styles.resultSection}>
              <ThemedText style={styles.resultLabel}>Authentication Test:</ThemedText>
              <ThemedText style={[styles.resultValue, { color: result.authTest.success ? '#10B981' : '#EF4444' }]}>
                {result.authTest.success ? '✅' : '❌'} {result.authTest.message}
              </ThemedText>
              {result.authTest.error && (
                <ThemedText style={styles.errorText}>{result.authTest.error}</ThemedText>
              )}
            </ThemedView>

            <ThemedView style={styles.resultSection}>
              <ThemedText style={styles.resultLabel}>Table Test:</ThemedText>
              <ThemedText style={[styles.resultValue, { color: result.tableTest.success ? '#10B981' : '#EF4444' }]}>
                {result.tableTest.success ? '✅' : '❌'} {result.tableTest.message}
              </ThemedText>
              {result.tableTest.error && (
                <ThemedText style={styles.errorText}>{result.tableTest.error}</ThemedText>
              )}
              <ThemedView style={styles.tableList}>
                {result.tableTest.tablesChecked.map((table, index) => (
                  <ThemedText key={index} style={styles.tableItem}>
                    {table}
                  </ThemedText>
                ))}
              </ThemedView>
            </ThemedView>
          </ThemedView>
        )}

        <ThemedView style={styles.infoBox}>
          <ThemedText style={styles.infoTitle}>💡 Tips:</ThemedText>
          <ThemedText style={styles.infoText}>
            • If tables don't exist, run the SQL schema from docs/SUPABASE_SCHEMA.sql{'\n'}
            • If you see RLS errors, check your Row Level Security policies{'\n'}
            • Check the console for detailed logs
          </ThemedText>
        </ThemedView>
      </ThemedView>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  description: {
    fontSize: 16,
    marginBottom: 24,
    opacity: 0.7,
  },
  statusBox: {
    padding: 16,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
    marginBottom: 20,
  },
  statusLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  statusValue: {
    fontSize: 16,
    fontWeight: '600',
  },
  button: {
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    marginBottom: 24,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  results: {
    marginTop: 8,
  },
  resultsTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 16,
  },
  resultSection: {
    marginBottom: 20,
    padding: 16,
    borderRadius: 8,
    backgroundColor: '#F9FAFB',
  },
  resultLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  resultValue: {
    fontSize: 14,
    marginBottom: 4,
  },
  errorText: {
    fontSize: 12,
    color: '#EF4444',
    marginTop: 4,
    fontStyle: 'italic',
  },
  tableList: {
    marginTop: 8,
  },
  tableItem: {
    fontSize: 12,
    marginBottom: 4,
    fontFamily: 'monospace',
  },
  infoBox: {
    marginTop: 24,
    padding: 16,
    borderRadius: 8,
    backgroundColor: '#EFF6FF',
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  infoText: {
    fontSize: 14,
    lineHeight: 20,
  },
});



