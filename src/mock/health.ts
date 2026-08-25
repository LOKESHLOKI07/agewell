export interface MedicalReport {
    id: string;
    title: string;
    date: string;
    type: 'Lab Test' | 'Prescription' | 'Discharge Summary' | 'Scan';
    doctor?: string;
    fileUrl: string;
}

export interface Medication {
    id: string;
    name: string;
    dosage: string;
    frequency: string;
    timeOfDay: ('Morning' | 'Afternoon' | 'Night')[];
    status: 'Taken' | 'Pending' | 'Missed';
    instructions?: string;
}

export interface Doctor {
    id: string;
    name: string;
    specialty: string;
    hospital: string;
    image?: string;
    rating: number;
}

export const mockReports: MedicalReport[] = [
    { id: '1', title: 'Complete Blood Count', date: '2026-08-10', type: 'Lab Test', doctor: 'Dr. Sharma', fileUrl: 'mock-url' },
    { id: '2', title: 'Post-Surgery Summary', date: '2025-12-05', type: 'Discharge Summary', doctor: 'Dr. Verma', fileUrl: 'mock-url' },
];

export const mockMedications: Medication[] = [
    { id: '1', name: 'Aspirin', dosage: '75mg', frequency: 'Daily', timeOfDay: ['Morning'], status: 'Taken', instructions: 'Take after breakfast' },
    { id: '2', name: 'Metformin', dosage: '500mg', frequency: 'Twice daily', timeOfDay: ['Morning', 'Night'], status: 'Pending', instructions: 'Take with meals' },
    { id: '3', name: 'Atorvastatin', dosage: '10mg', frequency: 'Daily', timeOfDay: ['Night'], status: 'Pending' },
];

export const mockDoctors: Doctor[] = [
    { id: '1', name: 'Dr. Anjali Sharma', specialty: 'Cardiologist', hospital: 'Apollo City Center', rating: 4.8 },
    { id: '2', name: 'Dr. Rajiv Verma', specialty: 'Orthopedic', hospital: 'Fortis Hospital', rating: 4.6 },
];
