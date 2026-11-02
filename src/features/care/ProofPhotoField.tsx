import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, minTouchSize, radius, spacing, typography } from '@/constants/theme';
import { pickProofPhoto } from './proofPhoto';

type Props = {
  value: string | null;
  onChange: (value: string | null) => void;
  required?: boolean;
};

export function ProofPhotoField({ value, onChange, required = false }: Props) {
  const pick = async (source: 'camera' | 'library') => {
    try {
      const next = await pickProofPhoto(source);
      if (next) {
        onChange(next);
      }
    } catch (error) {
      Alert.alert('Photo failed', error instanceof Error ? error.message : 'Could not attach that photo.');
    }
  };

  return (
    <View style={styles.wrap}>
      <Text style={styles.label}>{required ? 'Proof photo (required)' : 'Proof photo'}</Text>
      <Text style={styles.hint}>
        {required ? 'This service cannot be closed without a photo.' : 'Optional photo for this job.'}
      </Text>
      <View style={styles.row}>
        <Pressable
          onPress={() => void pick('camera')}
          accessibilityRole="button"
          accessibilityLabel="Take proof photo"
          style={styles.btn}
        >
          <Text style={styles.btnLabel}>Camera</Text>
        </Pressable>
        <Pressable
          onPress={() => void pick('library')}
          accessibilityRole="button"
          accessibilityLabel="Choose proof photo"
          style={styles.btn}
        >
          <Text style={styles.btnLabel}>Gallery</Text>
        </Pressable>
        {value ? (
          <Pressable onPress={() => onChange(null)} accessibilityRole="button" style={styles.btn}>
            <Text style={styles.btnLabel}>Remove</Text>
          </Pressable>
        ) : null}
      </View>
      <Text style={styles.status}>{value ? 'Photo attached' : 'No photo attached'}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginBottom: spacing.lg,
  },
  label: {
    ...typography.captionStrong,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  hint: {
    ...typography.caption,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
  },
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  btn: {
    minHeight: minTouchSize,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceElevated,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnLabel: {
    ...typography.captionStrong,
    color: colors.primary,
  },
  status: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: spacing.sm,
  },
});
