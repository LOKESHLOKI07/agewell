import { useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Icon } from '@/components/ui';
import { spacing, typography } from '@/constants/theme';
import { AgeWellHeader } from '@/features/home/components/AgeWellHeader';
import { familyHome } from '@/features/home/components/familyHomeTheme';
import { MEDICINE_ORDERS, type MedicineOrder } from './mockCatalog';
import { MembershipServiceHero } from './MembershipServiceHero';
import { useMembershipSubmit } from './useMembershipSubmit';

export function MedicineDeliveryScreen() {
  const insets = useSafeAreaInsets();
  const [prescriptionName, setPrescriptionName] = useState<string | null>(null);
  const [orders, setOrders] = useState<MedicineOrder[]>(MEDICINE_ORDERS);
  const { submitting, submit } = useMembershipSubmit('medicine');

  const pickPrescription = async (fromCamera: boolean) => {
    if (fromCamera) {
      const cam = await ImagePicker.requestCameraPermissionsAsync();
      if (!cam.granted) {
        Alert.alert('Permission needed', 'Allow camera access to photograph a prescription.');
        return;
      }
      const result = await ImagePicker.launchCameraAsync({ quality: 0.7 });
      if (!result.canceled && result.assets[0]) {
        setPrescriptionName(result.assets[0].fileName ?? 'Prescription photo');
      }
      return;
    }

    const library = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!library.granted) {
      Alert.alert('Permission needed', 'Allow photo access to upload a prescription.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.7,
    });
    if (!result.canceled && result.assets[0]) {
      setPrescriptionName(result.assets[0].fileName ?? 'Prescription from gallery');
    }
  };

  const onCreateOrder = () => {
    if (!prescriptionName) {
      Alert.alert('Upload needed', 'Upload a prescription photo first.');
      return;
    }
    void submit(`Prescription upload: ${prescriptionName}`, 'Medicine order created').then((ok) => {
      if (!ok) {
        return;
      }
      const created: MedicineOrder = {
        id: `m-${Date.now()}`,
        label: `Prescription · ${prescriptionName}`,
        placedAt: 'Just now',
        status: 'Pending',
      };
      setOrders((prev) => [created, ...prev]);
      setPrescriptionName(null);
    });
  };

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <AgeWellHeader title="Medicine Delivery" showBack showProfile={false} showBell={false} />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <MembershipServiceHero slug="medicine" />
        <Text style={styles.hint}>Upload prescription · home delivery 10 AM–8 PM</Text>

        <View style={styles.uploadBox}>
          <Icon name="document-text-outline" size={28} color={familyHome.purple} />
          <Text style={styles.uploadTitle}>
            {prescriptionName ?? 'Tap to upload or choose from gallery'}
          </Text>
          <Text style={styles.uploadSub}>Clear photo of the full prescription</Text>
          <View style={styles.uploadActions}>
            <Pressable
              style={styles.secondaryBtn}
              onPress={() => void pickPrescription(true)}
              accessibilityRole="button"
              accessibilityLabel="Take prescription photo"
            >
              <Icon name="camera-outline" size={16} color={familyHome.greenDark} />
              <Text style={styles.secondaryLabel}>Camera</Text>
            </Pressable>
            <Pressable
              style={styles.secondaryBtn}
              onPress={() => void pickPrescription(false)}
              accessibilityRole="button"
              accessibilityLabel="Choose from gallery"
            >
              <Icon name="document-outline" size={16} color={familyHome.greenDark} />
              <Text style={styles.secondaryLabel}>Gallery</Text>
            </Pressable>
          </View>
        </View>

        <Pressable
          style={[
            styles.primaryCta,
            !prescriptionName || submitting ? styles.primaryCtaDisabled : null,
          ]}
          onPress={onCreateOrder}
          disabled={!prescriptionName || submitting}
          accessibilityRole="button"
          accessibilityLabel="Create medicine order"
        >
          <Text style={styles.primaryCtaText}>{submitting ? 'Sending…' : 'Create Order'}</Text>
        </Pressable>

        <Text style={styles.section}>Recent orders</Text>
        <View style={styles.list}>
          {orders.map((order) => (
            <View key={order.id} style={styles.orderRow}>
              <View style={styles.orderIcon}>
                <Icon name="pill" size={18} color={familyHome.purple} />
              </View>
              <View style={styles.orderBody}>
                <Text style={styles.orderLabel}>{order.label}</Text>
                <Text style={styles.orderMeta}>{order.placedAt}</Text>
              </View>
              <Text style={styles.orderStatus}>{order.status}</Text>
            </View>
          ))}
        </View>

        <Pressable
          style={styles.trackBtn}
          onPress={() =>
            Alert.alert('Track orders', 'Live tracking will appear under the Orders tab in a later phase.')
          }
          accessibilityRole="button"
          accessibilityLabel="Track orders"
        >
          <Text style={styles.trackLabel}>Track Orders</Text>
        </Pressable>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: familyHome.white },
  content: { paddingHorizontal: spacing.xl, paddingBottom: spacing.xxxl, gap: spacing.md },
  hint: { ...typography.caption, color: familyHome.muted },
  uploadBox: {
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: familyHome.purple,
    borderRadius: 18,
    padding: spacing.xxl,
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: familyHome.purpleSoft,
  },
  uploadTitle: {
    ...typography.bodyStrong,
    color: familyHome.text,
    textAlign: 'center',
  },
  uploadSub: { ...typography.caption, color: familyHome.muted, textAlign: 'center' },
  uploadActions: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.md },
  secondaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: familyHome.white,
    borderRadius: 10,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    minHeight: 40,
  },
  secondaryLabel: { ...typography.captionStrong, color: familyHome.greenDark },
  primaryCta: {
    minHeight: 52,
    borderRadius: 14,
    backgroundColor: familyHome.green,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryCtaDisabled: { opacity: 0.5 },
  primaryCtaText: { ...typography.bodyStrong, color: familyHome.white },
  section: { ...typography.subtitle, color: familyHome.text, marginTop: spacing.sm },
  list: { gap: spacing.sm },
  orderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    borderWidth: 1,
    borderColor: familyHome.border,
    borderRadius: 14,
    padding: spacing.lg,
  },
  orderIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: familyHome.purpleSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  orderBody: { flex: 1, gap: 2 },
  orderLabel: { ...typography.bodyStrong, color: familyHome.text },
  orderMeta: { ...typography.caption, color: familyHome.muted },
  orderStatus: { ...typography.captionStrong, color: familyHome.greenDark, maxWidth: 90, textAlign: 'right' },
  trackBtn: {
    minHeight: 48,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: familyHome.green,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.sm,
  },
  trackLabel: { ...typography.bodyStrong, color: familyHome.green },
});
