// Root Layout — SiKasir DWP RS Rubini
// Wraps app with Supabase cloud database, Paper theme, and Toast
import React, { useEffect, useState } from 'react';
import { Stack } from 'expo-router';
import { PaperProvider } from 'react-native-paper';
import { StatusBar } from 'expo-status-bar';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import Toast from 'react-native-toast-message';
import { paperTheme, Colors } from '@/constants/theme';
import { initializeDatabase, seedPenyedia, seedSampleProducts } from '@/db/migrations';

export default function RootLayout() {
  const [dbReady, setDbReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function setupDb() {
      try {
        await initializeDatabase();
        await seedPenyedia();
        setDbReady(true);
      } catch (e: any) {
        console.error('Database setup error:', e);
        setError(e.message || 'Failed to initialize database');
      }
    }
    setupDb();
  }, []);

  if (error) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>⚠️ Koneksi Error</Text>
        <Text style={styles.errorDetail}>{error}</Text>
        <Text style={styles.errorDetail}>Pastikan perangkat terhubung ke internet</Text>
      </View>
    );
  }

  if (!dbReady) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.loadingText}>Menghubungkan ke server...</Text>
      </View>
    );
  }

  return (
    <PaperProvider theme={paperTheme}>
      <StatusBar style="light" />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" />
      </Stack>
      <Toast />
    </PaperProvider>
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.background,
    padding: 24,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: Colors.textSecondary,
  },
  errorText: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.danger,
    marginBottom: 8,
  },
  errorDetail: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
});
