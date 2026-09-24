import type { ImageSourcePropType } from 'react-native';

/**
 * Bundled 3D service icons keyed by marketplace / add-on service id.
 */
export const SERVICE_3D_ICONS: Record<string, ImageSourcePropType> = {
  // Membership (AgeWell_3D_Service_Icons_21)
  'emergency-sos': require('../../../assets/AgeWell_3D_Service_Icons_21/01_emergency_support.png'),
  'care-manager': require('../../../assets/AgeWell_3D_Service_Icons_21/02_care_manager.png'),
  companion: require('../../../assets/AgeWell_3D_Service_Icons_21/03_companion_visit.png'),
  medicine: require('../../../assets/AgeWell_3D_Service_Icons_21/04_medicine_delivery.png'),
  'health-check': require('../../../assets/AgeWell_3D_Service_Icons_21/05_health_check.png'),
  'monthly-blood-test': require('../../../assets/AgeWell_3D_Service_Icons_21/06_monthly_blood_test.png'),
  doctor: require('../../../assets/AgeWell_3D_Service_Icons_21/07_doctor_visit.png'),
  'personalised-diet-plan': require('../../../assets/AgeWell_3D_Service_Icons_21/personlized_diet.png'),
  grocery: require('../../../assets/AgeWell_3D_Service_Icons_21/08_grocery_delivery.png'),
  'small-errands': require('../../../assets/AgeWell_3D_Service_Icons_21/09_small_errands_assistance.png'),
  'errand-coordination': require('../../../assets/AgeWell_3D_Service_Icons_21/10_other_errands_assistance.png'),
  'cyber-security': require('../../../assets/AgeWell_3D_Service_Icons_21/11_cyber_security_guidance.png'),
  'banking-companion': require('../../../assets/AgeWell_3D_Service_Icons_21/12_banking_companion.png'),
  ca: require('../../../assets/AgeWell_3D_Service_Icons_21/13_ca_assistance.png'),
  'events-trips': require('../../../assets/AgeWell_3D_Service_Icons_21/14_local_events_trips.png'),
  'home-repair': require('../../../assets/AgeWell_3D_Service_Icons_21/15_house_maintenance.png'),
  pooja: require('../../../assets/AgeWell_3D_Service_Icons_21/16_house_pooja_assistance.png'),
  legal: require('../../../assets/AgeWell_3D_Service_Icons_21/17_legal_assistance.png'),
  'local-transport': require('../../../assets/AgeWell_3D_Service_Icons_21/18_local_area_transport.png'),
  transport: require('../../../assets/AgeWell_3D_Service_Icons_21/19_outstation_transport.png'),
  'home-inspection': require('../../../assets/AgeWell_3D_Service_Icons_21/20_home_inspection.png'),
  cctv: require('../../../assets/AgeWell_3D_Service_Icons_21/21_cctv_dashboard.png'),
  // Add-ons (AgeWell_AddOn_Service_Icons)
  'emergency-companion': require('../../../assets/AgeWell_AddOn_Service_Icons/01_emergency_companion.png'),
  food: require('../../../assets/AgeWell_AddOn_Service_Icons/02_tiffin_box.png'),
  'stool-cleaning': require('../../../assets/AgeWell_AddOn_Service_Icons/03_stool_cleaning.png'),
  'maid-assistance': require('../../../assets/AgeWell_AddOn_Service_Icons/04_house_maid.png'),
  'ayurvedic-massage': require('../../../assets/AgeWell_AddOn_Service_Icons/05_ayurvedic_massage.png'),
};

export function getService3dIcon(serviceId: string): ImageSourcePropType | null {
  return SERVICE_3D_ICONS[serviceId] ?? null;
}
