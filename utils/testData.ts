/**
 * Test data generator for AVA Application
 * Creates sample data for development and testing
 */

import {
  UserProfile,
  CanineProfile,
  VetProfile,
  Contact,
  NutritionEntry,
  TrainingLog,
  Appointment,
  MediaItem,
  MedicalRecord,
  MedicationEntry,
  VetVisit,
  ImmunizationRecord,
  CanineAllergy,
} from '@/types';

export function generateTestData() {
  const now = new Date();

  // User Profile
  const userProfile: UserProfile = {
    id: 'user-1',
    firstName: 'John',
    lastName: 'Doe',
    email: 'john.doe@example.com',
    phone: '+1-555-0123',
    country: 'US',
    role: 'Pet Owner', // Set default role for test user
    addressLine1: '4517 Washington Ave. Manchester, Kentucky 39495',
    addressLine2: '2715 Ash Dr. San Jose, South Dakota 83475',
    city: 'Los Angeles',
    state: 'California',
    zipCode: '90001',
    profilePhotoUrl: 'https://images.unsplash.com/photo-1544723795-3fb6469f5b39?w=400&auto=format',
    createdAt: now.toISOString(),
    updatedAt: now.toISOString(),
  };

  // Canine Profiles
  const canines: CanineProfile[] = [
    {
      id: 'canine-1',
      userId: 'user-1', // Associate with test user
      name: 'Max',
      breed: 'Golden Retriever',
      dateOfBirth: '2020-05-15',
      gender: 'Male',
      weight: 65,
      weightUnit: 'lbs',
      color: 'Golden',
      microchipNumber: '123456789012345',
      profilePhotoId: 'media-1', // Set profile photo
      notes: 'Friendly and energetic. Loves playing fetch.',
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
    },
    {
      id: 'canine-2',
      userId: 'user-1', // Associate with test user
      name: 'Bella',
      breed: 'German Shepherd',
      dateOfBirth: '2019-08-20',
      gender: 'Female',
      weight: 55,
      weightUnit: 'lbs',
      color: 'Black and Tan',
      profilePhotoId: 'media-4',
      notes: 'Very protective and loyal.',
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
    },
    {
      id: 'canine-3',
      userId: 'user-1',
      name: 'Charlie',
      breed: 'Beagle',
      dateOfBirth: '2021-03-10',
      gender: 'Male',
      weight: 25,
      weightUnit: 'lbs',
      color: 'Tri-color',
      notes: 'Loves to sniff and explore.',
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
    },
  ];

  // Vet Profiles
  const vets: VetProfile[] = [
    {
      id: 'vet-1',
      name: 'Dr. Sarah Johnson',
      clinicName: 'Happy Paws Veterinary Clinic',
      phone: '+1-555-1000',
      email: 'sarah.johnson@happypaws.com',
      address: '123 Main Street',
      city: 'New York',
      state: 'NY',
      zipCode: '10001',
      country: 'US',
      specialization: 'Small Animal Medicine',
      notes: 'Very experienced with Golden Retrievers.',
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
    },
    {
      id: 'vet-2',
      name: 'Dr. Michael Chen',
      clinicName: 'City Animal Hospital',
      phone: '+1-555-1001',
      email: 'm.chen@cityanimal.com',
      address: '456 Oak Avenue',
      city: 'Los Angeles',
      state: 'CA',
      zipCode: '90001',
      country: 'US',
      specialization: 'Surgery',
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
    },
  ];

  // Contacts
  const contacts: Contact[] = [
    {
      id: 'contact-1',
      name: 'Jane Doe',
      relationship: 'Spouse',
      phone: '+1-555-0200',
      email: 'jane.doe@example.com',
      address: '123 Pet Street',
      isEmergency: true,
      notes: 'Primary emergency contact',
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
    },
    {
      id: 'contact-2',
      name: 'Bob Smith',
      relationship: 'Friend',
      phone: '+1-555-0201',
      email: 'bob.smith@example.com',
      isEmergency: true,
      notes: 'Can help with pet care',
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
    },
    {
      id: 'contact-3',
      name: 'Alice Brown',
      relationship: 'Neighbor',
      phone: '+1-555-0202',
      isEmergency: false,
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
    },
  ];

  // Nutrition Entries
  const nutritionEntries: NutritionEntry[] = [
    {
      id: 'nutrition-1',
      canineId: 'canine-1',
      date: new Date(now.getTime() + 1 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      foodType: 'Processed Food',
      foodName: 'SBC',
      quantity: 2,
      unit: 'ounces',
      calories: 200,
      addOns: 'Fish oil topper',
      repeatDays: 0,
      actualDate: undefined,
      notes: 'Planned morning meal',
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
    },
    {
      id: 'nutrition-2',
      canineId: 'canine-1',
      date: now.toISOString().split('T')[0],
      foodType: 'Homemade Meal',
      foodName: 'Chicken & Rice',
      quantity: 1.5,
      unit: 'cups',
      calories: 320,
      addOns: 'Probiotic sprinkle',
      repeatDays: 2,
      actualDate: now.toISOString().split('T')[0],
      notes: 'Finished entire bowl',
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
    },
    {
      id: 'nutrition-3',
      canineId: 'canine-2',
      date: new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      foodType: 'Treats',
      foodName: 'Peanut Butter Bites',
      quantity: 4,
      unit: 'pieces',
      calories: 80,
      addOns: undefined,
      repeatDays: 0,
      actualDate: undefined,
      notes: 'Reward during training',
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
    },
  ];

  const canineAllergies: CanineAllergy[] = [
    {
      id: 'allergy-1',
      canineId: 'canine-1',
      foodType: 'Protein',
      name: 'Beef sensitivity',
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
    },
    {
      id: 'allergy-2',
      canineId: 'canine-2',
      foodType: 'Pet Allergies',
      name: 'Dust mites',
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
    },
  ];

  // Training Logs
  const trainingLogs: TrainingLog[] = [
    {
      id: 'training-1',
      canineId: 'canine-1',
      date: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      skill: 'Sit',
      duration: 15,
      success: true,
      notes: 'Excellent progress',
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
    },
    {
      id: 'training-2',
      canineId: 'canine-1',
      date: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      skill: 'Stay',
      duration: 20,
      success: true,
      notes: 'Held for 30 seconds',
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
    },
    {
      id: 'training-3',
      canineId: 'canine-2',
      date: now.toISOString().split('T')[0],
      skill: 'Heel',
      duration: 10,
      success: false,
      notes: 'Needs more practice',
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
    },
  ];

  // Appointments
  const appointments: Appointment[] = [
    {
      id: 'appt-1',
      canineId: 'canine-1',
      vetId: 'vet-1',
      category: 'Vet/Clinic',
      title: 'Annual Wellness Exam',
      description: 'Comprehensive health review and boosters.',
      date: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      startTime: '10:00',
      endTime: '11:00',
      status: 'Scheduled',
      notes: 'Routine health check',
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
    },
    {
      id: 'appt-2',
      canineId: 'canine-2',
      vetId: 'vet-1',
      category: 'Vaccination',
      title: 'Booster Shots',
      description: 'DHPP booster and wellness check.',
      date: new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      startTime: '14:30',
      endTime: '15:00',
      status: 'Scheduled',
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
    },
    {
      id: 'appt-3',
      canineId: 'canine-1',
      vetId: 'vet-2',
      category: 'Training',
      title: 'Canine Care Consultation',
      description: 'Follow-up session on diet and exercise.',
      date: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      startTime: '11:00',
      endTime: '11:45',
      status: 'Completed',
      notes: 'All clear',
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
    },
  ];

  // Media Items (sample photos/videos for pets)
  const mediaItems: MediaItem[] = [
    {
      id: 'media-1',
      canineId: 'canine-1',
      type: 'photo',
      uri: 'https://images.unsplash.com/photo-1552053831-71594a27632d?w=400',
      caption: 'Max playing in the park',
      date: now.toISOString().split('T')[0],
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
    },
    {
      id: 'media-2',
      canineId: 'canine-1',
      type: 'photo',
      uri: 'https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=400',
      caption: 'Max at the beach',
      date: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
    },
    {
      id: 'media-3',
      canineId: 'canine-1',
      type: 'video',
      uri: 'https://example.com/videos/max-playing.mp4',
      caption: 'Max playing fetch',
      date: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
    },
    {
      id: 'media-4',
      canineId: 'canine-2',
      type: 'photo',
      uri: 'https://images.unsplash.com/photo-1583337130417-3346a1be7dee?w=400',
      caption: 'Bella on guard',
      date: now.toISOString().split('T')[0],
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
    },
    {
      id: 'media-5',
      canineId: 'canine-2',
      type: 'photo',
      uri: 'https://images.unsplash.com/photo-1517849845537-4d58b0e09b8d?w=400',
      caption: 'Bella relaxing',
      date: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
    },
  ];

  const medicalRecords: MedicalRecord[] = [
    {
      id: 'medrec-1',
      canineId: 'canine-1',
      vetName: 'Sara Johns',
      clinicName: 'ABC Dog Care',
      reportType: 'General Checkup',
      attachments: [
        {
          id: 'medatt-1',
          type: 'file',
          uri: 'https://example.com/reports/max-checkup.pdf',
          name: 'Max-Checkup.pdf',
        },
        {
          id: 'medatt-2',
          type: 'photo',
          uri: 'https://images.unsplash.com/photo-1601758125946-6ec2e4971c71?w=400',
          name: 'Max-Vaccine.jpg',
        },
      ],
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
    },
  ];

  const medications: MedicationEntry[] = [
    {
      id: 'medication-1',
      canineId: 'canine-1',
      vetId: 'vet-1',
      vetName: 'Sara Johns',
      medicationName: 'Vitamin B Complex',
      reason: 'Weight management support',
      description: 'Daily supplement to support energy and appetite.',
      quantity: 1,
      dosageUnit: 'Gram',
      frequency: 'Daily',
      startDate: '2025-06-11',
      startTime: '02:28',
      endDate: '2025-12-31',
      notes: 'Administer with morning meal',
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
    },
    {
      id: 'medication-2',
      canineId: 'canine-2',
      vetId: 'vet-2',
      vetName: 'Dr. Priya Singh',
      medicationName: 'Fish Oil Softgel',
      reason: 'Coat health improvement',
      description: 'Omega-3 supplement to reduce shedding.',
      quantity: 1,
      dosageUnit: 'Capsule',
      frequency: 'Every other day',
      startDate: '2025-04-02',
      startTime: '08:00',
      notes: 'Give with food to avoid stomach upset',
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
    },
  ];

  const vetVisits: VetVisit[] = [
    {
      id: 'visit-1',
      canineId: 'canine-1',
      vetId: 'vet-1',
      vetName: 'Sara Johns',
      reason: 'Regular Checkup',
      endResults: 'Healthy, no concerns',
      visitDate: '2025-09-01',
      notes: 'Suggested annual blood work next visit.',
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
    },
  ];

  const immunizations: ImmunizationRecord[] = [
    {
      id: 'imm-1',
      canineId: 'canine-1',
      vetId: 'vet-1',
      vetName: 'Sara Johns',
      vaccineName: 'Rabies',
      ageYears: 6,
      ageMonths: 0,
      immunizationDate: '2021-09-01',
      lastVaccinatedDate: '2025-08-01',
      notes: 'Next booster due in one year.',
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
    },
  ];

  return {
    userProfile,
    canines,
    vets,
    contacts,
    nutritionEntries,
    trainingLogs,
    appointments,
    mediaItems,
    medicalRecords,
    medications,
    vetVisits,
    immunizations,
    canineAllergies,
  };
}


