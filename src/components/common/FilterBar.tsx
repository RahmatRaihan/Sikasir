// FilterBar — Filter panel with chips/dropdowns
import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Chip, Text } from 'react-native-paper';
import { Colors, Spacing, BorderRadius } from '../../constants/theme';
import { PENYEDIA_LIST } from '../../constants/penyedia';

interface FilterBarProps {
  selectedPenyediaId: number | null;
  onPenyediaChange: (id: number | null) => void;
  showAllOption?: boolean;
}

export default function FilterBar({
  selectedPenyediaId,
  onPenyediaChange,
  showAllOption = true,
}: FilterBarProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.label}>Kategori:</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipScroll}>
        {showAllOption && (
          <Chip
            selected={selectedPenyediaId === null}
            onPress={() => onPenyediaChange(null)}
            style={[
              styles.chip,
              selectedPenyediaId === null && styles.chipSelected,
            ]}
            textStyle={[
              styles.chipText,
              selectedPenyediaId === null && styles.chipTextSelected,
            ]}
            showSelectedOverlay={false}
          >
            Semua
          </Chip>
        )}
        {PENYEDIA_LIST.map((p) => (
          <Chip
            key={p.id}
            selected={selectedPenyediaId === p.id}
            onPress={() => onPenyediaChange(p.id)}
            style={[
              styles.chip,
              selectedPenyediaId === p.id && {
                backgroundColor: p.color,
                borderColor: p.color,
              },
            ]}
            textStyle={[
              styles.chipText,
              selectedPenyediaId === p.id && styles.chipTextSelected,
            ]}
            showSelectedOverlay={false}
            icon={selectedPenyediaId === p.id ? 'check' : undefined}
          >
            {p.label}
          </Chip>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.textSecondary,
    marginRight: Spacing.sm,
  },
  chipScroll: {
    flexGrow: 0,
  },
  chip: {
    marginRight: Spacing.sm,
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.round,
  },
  chipSelected: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  chipText: {
    fontSize: 13,
    color: Colors.textPrimary,
  },
  chipTextSelected: {
    color: Colors.white,
    fontWeight: '600',
  },
});
