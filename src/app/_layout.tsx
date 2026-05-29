// Root Layout — SiKasir DWP RS Rubini
// Wraps app with Supabase cloud database, Paper theme, Toast, and Network monitoring
import React, { useEffect, useState, useCallback } from 'react';
import { Stack } from 'expo-router';
import { PaperProvider } from 'react-native-paper';
import { StatusBar } from 'expo-status-bar';
import { View, Text, StyleSheet, ActivityIndicator, Pressable, Animated } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import Toast from 'react-native-toast-message';
import { paperTheme, Colors, Spacing, BorderRadius } from '@/constants/theme';
import { initializeDatabase, seedPenyedia } from '@/db/migrations';

export default function RootLayout() {
  const [dbReady, setDbReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [retrying, setRetrying] = useState(false);
  const pulseAnim = useState(new Animated.Value(1))[0];

  // Pulse animation for wifi icon
  useEffect(() => {
    if (error) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 0.4, duration: 1000, useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 1, duration: 1000, useNativeDriver: true }),
        ])
      ).start();
    }
  }, [error]);

  const connectDb = useCallback(async () => {
    try {
      setError(null);
      await initializeDatabase();
      await seedPenyedia();
      setDbReady(true);
    } catch (e: any) {
      console.error('Database setup error:', e);
      const msg = e.message || 'Gagal menghubungkan ke server';
      // Provide user-friendly messages
      if (msg.includes('fetch') || msg.includes('network') || msg.includes('Network')) {
        setError('Tidak ada koneksi internet. Pastikan WiFi atau data seluler Anda aktif.');
      } else if (msg.includes('timeout') || msg.includes('Timeout')) {
        setError('Koneksi ke server terlalu lama. Periksa kecepatan internet Anda.');
      } else if (msg.includes('Database tidak terhubung')) {
        setError('Server database tidak merespons. Coba lagi dalam beberapa saat.');
      } else {
        setError(msg);
      }
    }
  }, []);

  useEffect(() => {
    connectDb();
  }, [connectDb]);

  const handleRetry = async () => {
    setRetrying(true);
    await connectDb();
    setRetrying(false);
  };

  if (error) {
    return (
      <View style={styles.errorContainer}>
        {/* Background decoration */}
        <View style={styles.errorBgCircle1} />
        <View style={styles.errorBgCircle2} />

        <Animated.View style={[styles.errorIconContainer, { opacity: pulseAnim }]}>
          <MaterialCommunityIcons name="wifi-off" size={80} color={Colors.danger} />
        </Animated.View>

        <Text style={styles.errorTitle}>Koneksi Terputus</Text>
        <Text style={styles.errorMessage}>{error}</Text>

        <View style={styles.errorTipsContainer}>
          <View style={styles.errorTipRow}>
            <MaterialCommunityIcons name="check-circle-outline" size={18} color={Colors.textSecondary} />
            <Text style={styles.errorTipText}>Periksa koneksi WiFi atau data seluler</Text>
          </View>
          <View style={styles.errorTipRow}>
            <MaterialCommunityIcons name="check-circle-outline" size={18} color={Colors.textSecondary} />
            <Text style={styles.errorTipText}>Pastikan signal internet stabil</Text>
          </View>
          <View style={styles.errorTipRow}>
            <MaterialCommunityIcons name="check-circle-outline" size={18} color={Colors.textSecondary} />
            <Text style={styles.errorTipText}>Coba matikan dan hidupkan ulang WiFi</Text>
          </View>
        </View>

        <Pressable
          style={({ pressed }) => [
            styles.retryButton,
            pressed && styles.retryButtonPressed,
            retrying && styles.retryButtonDisabled,
          ]}
          onPress={handleRetry}
          disabled={retrying}
        >
          {retrying ? (
            <ActivityIndicator color={Colors.white} size="small" />
          ) : (
            <MaterialCommunityIcons name="refresh" size={22} color={Colors.white} />
          )}
          <Text style={styles.retryButtonText}>
            {retrying ? 'Menghubungkan...' : 'Coba Lagi'}
          </Text>
        </Pressable>
      </View>
    );
  }

  if (!dbReady) {
    return (
      <View style={styles.loadingContainer}>
        <View style={styles.loadingIconContainer}>
          <MaterialCommunityIcons name="cloud-sync-outline" size={50} color={Colors.primary} />
        </View>
        <ActivityIndicator size="large" color={Colors.primary} style={{ marginTop: 20 }} />
        <Text style={styles.loadingText}>Menghubungkan ke server...</Text>
        <Text style={styles.loadingSubtext}>SiKasir DWP RS Rubini</Text>
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
  // ─── Loading ───
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.background,
    padding: 24,
  },
  loadingIconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#E3F2FD',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  loadingSubtext: {
    marginTop: 4,
    fontSize: 13,
    color: Colors.textSecondary,
  },

  // ─── Error ───
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFF5F5',
    padding: 32,
    overflow: 'hidden',
  },
  errorBgCircle1: {
    position: 'absolute',
    top: -60,
    right: -60,
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: 'rgba(239, 83, 80, 0.06)',
  },
  errorBgCircle2: {
    position: 'absolute',
    bottom: -80,
    left: -40,
    width: 250,
    height: 250,
    borderRadius: 125,
    backgroundColor: 'rgba(239, 83, 80, 0.04)',
  },
  errorIconContainer: {
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: 'rgba(239, 83, 80, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  errorTitle: {
    fontSize: 26,
    fontWeight: '800',
    color: '#C62828',
    marginBottom: 12,
  },
  errorMessage: {
    fontSize: 15,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    maxWidth: 320,
    marginBottom: 28,
  },
  errorTipsContainer: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    width: '100%',
    maxWidth: 360,
    marginBottom: 28,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  errorTipRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 6,
  },
  errorTipText: {
    fontSize: 13,
    color: Colors.textSecondary,
    flex: 1,
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: Colors.primary,
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: BorderRadius.round,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  retryButtonPressed: {
    opacity: 0.85,
    transform: [{ scale: 0.97 }],
  },
  retryButtonDisabled: {
    opacity: 0.7,
  },
  retryButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.white,
  },
});
