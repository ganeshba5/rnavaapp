/**
 * Global App Context for AVA Application
 * Manages state and CRUD operations for all entities using Supabase
 */

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
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
import {
  userProfileService,
  canineProfileService,
  vetProfileService,
  contactService,
  nutritionEntryService,
  trainingLogService,
  appointmentService,
  mediaItemService,
  medicalRecordService,
  medicationService,
  vetVisitService,
  immunizationService,
  canineAllergyService,
} from '@/services/database';
import { isSupabaseConfigured, supabaseService } from '@/lib/supabase';
import { generateTestData } from '@/utils/testData';
import { testSupabaseConnection, printTestResults } from '@/utils/testSupabaseConnection';
import { validateActivationCode, type UserRole } from '@/utils/giftCodes';
import { hashPassword, verifyPassword } from '@/utils/password';

// UUID validation regex
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function isValidUUID(id: string): boolean {
  return UUID_REGEX.test(id);
}

interface AppContextType {
  // State
  userProfile: UserProfile | null;
  canines: CanineProfile[];
  vets: VetProfile[];
  contacts: Contact[];
  nutritionEntries: NutritionEntry[];
  trainingLogs: TrainingLog[];
  appointments: Appointment[];
  mediaItems: MediaItem[];
  medicalRecords: MedicalRecord[];
  medications: MedicationEntry[];
  vetVisits: VetVisit[];
  immunizations: ImmunizationRecord[];
  canineAllergies: CanineAllergy[];
  isAuthenticated: boolean;
  isLoading: boolean;

  // User Profile
  setUserProfile: (profile: UserProfile | null) => void;
  updateUserProfile: (profile: Partial<UserProfile>) => Promise<void>;
  
  // User Management (Admin only)
  allUsers: UserProfile[];
  addUser: (user: Omit<UserProfile, 'id' | 'createdAt' | 'updatedAt'>, password: string) => Promise<void>;
  updateUser: (id: string, updates: Partial<UserProfile>) => Promise<void>;
  deleteUser: (id: string) => Promise<void>;

  // Canine Profile
  addCanine: (canine: Omit<CanineProfile, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateCanine: (id: string, updates: Partial<CanineProfile>) => Promise<void>;
  deleteCanine: (id: string) => Promise<void>;
  getCanine: (id: string) => CanineProfile | undefined;
  getNutritionEntriesByCanine: (canineId: string) => NutritionEntry[];
  getTrainingLogsByCanine: (canineId: string) => TrainingLog[];
  getMediaItemsByCanine: (canineId: string) => MediaItem[];
  getMedicationsByCanine: (canineId: string) => MedicationEntry[];
  getVetVisitsByCanine: (canineId: string) => VetVisit[];
  getImmunizationsByCanine: (canineId: string) => ImmunizationRecord[];

  // Vet Profile
  addVet: (vet: Omit<VetProfile, 'id' | 'createdAt' | 'updatedAt'>) => Promise<VetProfile>;
  updateVet: (id: string, updates: Partial<VetProfile>) => Promise<void>;
  deleteVet: (id: string) => Promise<void>;

  // Contact
  addContact: (contact: Omit<Contact, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateContact: (id: string, updates: Partial<Contact>) => Promise<void>;
  deleteContact: (id: string) => Promise<void>;

  // Nutrition
  addNutritionEntry: (entry: Omit<NutritionEntry, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateNutritionEntry: (id: string, updates: Partial<NutritionEntry>) => Promise<void>;
  deleteNutritionEntry: (id: string) => Promise<void>;

  // Training
  addTrainingLog: (log: Omit<TrainingLog, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateTrainingLog: (id: string, updates: Partial<TrainingLog>) => Promise<void>;
  deleteTrainingLog: (id: string) => Promise<void>;

  // Appointment
  addAppointment: (appointment: Omit<Appointment, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateAppointment: (id: string, updates: Partial<Appointment>) => Promise<void>;
  deleteAppointment: (id: string) => Promise<void>;

  // Media
  addMediaItem: (media: Omit<MediaItem, 'id' | 'createdAt'>) => Promise<void>;
  updateMediaItem: (id: string, updates: Partial<MediaItem>) => Promise<void>;
  deleteMediaItem: (id: string) => Promise<void>;

  // Medical Records
  addMedicalRecord: (record: Omit<MedicalRecord, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateMedicalRecord: (id: string, updates: Partial<MedicalRecord>) => Promise<void>;
  deleteMedicalRecord: (id: string) => Promise<void>;

  // Medications
  addMedicationEntry: (entry: Omit<MedicationEntry, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateMedicationEntry: (id: string, updates: Partial<MedicationEntry>) => Promise<void>;
  deleteMedicationEntry: (id: string) => Promise<void>;

  // Vet Visits
  addVetVisit: (visit: Omit<VetVisit, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateVetVisit: (id: string, updates: Partial<VetVisit>) => Promise<void>;
  deleteVetVisit: (id: string) => Promise<void>;

  // Immunizations
  addImmunizationRecord: (record: Omit<ImmunizationRecord, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateImmunizationRecord: (id: string, updates: Partial<ImmunizationRecord>) => Promise<void>;
  deleteImmunizationRecord: (id: string) => Promise<void>;

  // Allergies
  addCanineAllergy: (allergy: Omit<CanineAllergy, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateCanineAllergy: (id: string, updates: Partial<CanineAllergy>) => Promise<void>;
  deleteCanineAllergy: (id: string) => Promise<void>;
  getCanineAllergiesByCanine: (canineId: string) => CanineAllergy[];

  // Authentication
  login: (email: string, password: string) => Promise<boolean>;
  signup: (email: string, password: string, firstName: string, lastName: string, activationCode: string) => Promise<{ success: boolean; requiresEmailConfirmation?: boolean; message?: string }>;
  changePassword: (currentPassword: string, newPassword: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshData: () => Promise<void>;
  
  // Testing
  testConnection: () => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  // State
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [allUsers, setAllUsers] = useState<UserProfile[]>([]); // All users (Admin only)
  const [canines, setCanines] = useState<CanineProfile[]>([]);
  const [vets, setVets] = useState<VetProfile[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [nutritionEntries, setNutritionEntries] = useState<NutritionEntry[]>([]);
  const [trainingLogs, setTrainingLogs] = useState<TrainingLog[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [mediaItems, setMediaItems] = useState<MediaItem[]>([]);
  const [medicalRecords, setMedicalRecords] = useState<MedicalRecord[]>([]);
  const [medications, setMedications] = useState<MedicationEntry[]>([]);
  const [vetVisits, setVetVisits] = useState<VetVisit[]>([]);
  const [immunizations, setImmunizations] = useState<ImmunizationRecord[]>([]);
  const [canineAllergies, setCanineAllergies] = useState<CanineAllergy[]>([]);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Load data from Supabase
  const loadData = async () => {
    try {
      setIsLoading(true);

      // If Supabase is not configured, use test data as fallback
      if (!isSupabaseConfigured) {
        console.warn('⚠️ Supabase not configured. Using test data.');
        const testData = generateTestData();
        setUserProfile(testData.userProfile);
        setCanines(testData.canines);
        setAllUsers([testData.userProfile]);
        setVets(testData.vets);
        setContacts(testData.contacts);
        setNutritionEntries(testData.nutritionEntries);
        setTrainingLogs(testData.trainingLogs);
        setAppointments(testData.appointments);
        setMediaItems(testData.mediaItems);
        setMedicalRecords(testData.medicalRecords);
        setMedications(testData.medications);
        setVetVisits(testData.vetVisits);
        setImmunizations(testData.immunizations);
        setCanineAllergies(testData.canineAllergies);
        setIsLoading(false);
        return;
      }

      // Supabase is configured - try to load from Supabase
      console.log('✅ Supabase configured. Loading data from database...');

      // Load shared data (vets, contacts) that don't require user authentication
      try {
        const [vetsData, contactsData] = await Promise.all([
          vetProfileService.getAll(),
          contactService.getAll(),
        ]);

        setVets(vetsData || []);
        setContacts(contactsData || []);
      } catch (error) {
        console.error('Error loading shared data from Supabase:', error);
        setVets([]);
        setContacts([]);
      }

      // Check if user is Admin - Admins see all data
      const isAdmin = userProfile?.role === 'Admin';

      // Load user-specific data if user is logged in and has a valid UUID
      if (userProfile && isValidUUID(userProfile.id)) {
        try {
          if (isAdmin) {
            // Admin: Load all data across all users
            console.log('Loading all data for Admin user:', userProfile.id);
            const [
              allUsersData,
              allCaninesData,
              allNutritionData,
              allTrainingData,
              allAppointmentData,
              allMediaData,
              allMedicalData,
              allMedicationsData,
              allVetVisitsData,
              allImmunizationsData,
              allAllergiesData,
            ] = await Promise.all([
              userProfileService.getAll(),
              canineProfileService.getAll(), // No userId filter for admin
              nutritionEntryService.getAll(), // No canineId filter for admin
              trainingLogService.getAll(), // No canineId filter for admin
              appointmentService.getAll(), // No canineId filter for admin
              mediaItemService.getAll(), // No canineId filter for admin
              medicalRecordService.getAll(),
              medicationService.getAll(),
              vetVisitService.getAll(),
              immunizationService.getAll(),
              canineAllergyService.getAll(),
            ]);

            setAllUsers(allUsersData || []);
            setCanines(allCaninesData || []);
            setNutritionEntries(allNutritionData || []);
            setTrainingLogs(allTrainingData || []);
            setAppointments(allAppointmentData || []);
            setMediaItems(allMediaData || []);
            setMedicalRecords(allMedicalData || []);
            setMedications(allMedicationsData || []);
            setVetVisits(allVetVisitsData || []);
            setImmunizations(allImmunizationsData || []);
            setCanineAllergies(allAllergiesData || []);
          } else {
            // Regular user: Load only their data
            console.log('Loading user-specific data for user:', userProfile.id);
            const [
              canineData,
              nutritionData,
              trainingData,
              appointmentData,
              mediaData,
              medicalData,
              medicationData,
              visitData,
              immunizationData,
              allergyData,
            ] = await Promise.all([
              canineProfileService.getAll(userProfile.id),
              nutritionEntryService.getAll(),
              trainingLogService.getAll(),
              appointmentService.getAll(),
              mediaItemService.getAll(),
              medicalRecordService.getAll(),
              medicationService.getAll(),
              vetVisitService.getAll(),
              immunizationService.getAll(),
              canineAllergyService.getAll(),
            ]);

            // Filter for current user's pets
            const userCanineIds = (canineData || []).map((c) => c.id);
            setCanines(canineData || []);
            setNutritionEntries((nutritionData || []).filter((e) => userCanineIds.includes(e.canineId)));
            setTrainingLogs((trainingData || []).filter((t) => userCanineIds.includes(t.canineId)));
            setAppointments((appointmentData || []).filter((appt) => userCanineIds.includes(appt.canineId)));
            setMediaItems((mediaData || []).filter((media) => userCanineIds.includes(media.canineId)));
            setMedicalRecords((medicalData || []).filter((rec) => userCanineIds.includes(rec.canineId)));
            setMedications((medicationData || []).filter((med) => userCanineIds.includes(med.canineId)));
            setVetVisits((visitData || []).filter((visit) => userCanineIds.includes(visit.canineId)));
            setImmunizations((immunizationData || []).filter((record) => userCanineIds.includes(record.canineId)));
            setCanineAllergies((allergyData || []).filter((allergy) => userCanineIds.includes(allergy.canineId)));
          }
          
          console.log('✅ Successfully loaded data from Supabase');
        } catch (error) {
          console.error('❌ Error loading user data from Supabase:', error);
          // If Supabase query fails, initialize with empty arrays instead of test data
          setAllUsers([]);
          setCanines([]);
          setNutritionEntries([]);
          setTrainingLogs([]);
          setAppointments([]);
          setMediaItems([]);
          setMedicalRecords([]);
          setMedications([]);
          setVetVisits([]);
          setImmunizations([]);
          setCanineAllergies([]);
        }
      } else if (userProfile && !isValidUUID(userProfile.id)) {
        // User profile exists but ID is not a valid UUID (test data)
        // This means they're using test credentials, so use test data
        console.warn('⚠️ User ID is not a valid UUID (test data). Using test data for user-specific entities.');
        const testData = generateTestData();
        const userCanineIds = testData.canines.filter((c) => c.userId === userProfile.id).map((c) => c.id);
        setCanines(testData.canines.filter((c) => c.userId === userProfile.id));
        setVets(testData.vets);
        setContacts(testData.contacts);
        setNutritionEntries(testData.nutritionEntries.filter((e) => 
          userCanineIds.includes(e.canineId)
        ));
        setTrainingLogs(testData.trainingLogs.filter((e) => userCanineIds.includes(e.canineId)));
        setAppointments(testData.appointments.filter((appt) => userCanineIds.includes(appt.canineId)));
        setMediaItems(testData.mediaItems.filter((m) => userCanineIds.includes(m.canineId)));
        setMedicalRecords(testData.medicalRecords.filter((rec) => userCanineIds.includes(rec.canineId)));
        setMedications(testData.medications.filter((med) => userCanineIds.includes(med.canineId)));
        setVetVisits(testData.vetVisits.filter((visit) => userCanineIds.includes(visit.canineId)));
        setImmunizations(testData.immunizations.filter((record) => userCanineIds.includes(record.canineId)));
        setCanineAllergies(testData.canineAllergies.filter((allergy) => userCanineIds.includes(allergy.canineId)));
      } else {
        // No user logged in yet - initialize with empty arrays
        console.log('No user logged in. Initializing with empty data.');
        setCanines([]);
        setNutritionEntries([]);
        setTrainingLogs([]);
        setAppointments([]);
        setMediaItems([]);
        setMedicalRecords([]);
        setMedications([]);
        setVetVisits([]);
        setImmunizations([]);
        setCanineAllergies([]);
      }
    } catch (error) {
      console.error('❌ Error loading data:', error);
      // Only fallback to test data if Supabase is not configured
      if (!isSupabaseConfigured) {
        console.warn('Falling back to test data due to error and Supabase not configured.');
        const testData = generateTestData();
        setUserProfile(testData.userProfile);
        setCanines(testData.canines);
        setVets(testData.vets);
        setContacts(testData.contacts);
        setNutritionEntries(testData.nutritionEntries);
        setTrainingLogs(testData.trainingLogs);
        setAppointments(testData.appointments);
        setMediaItems(testData.mediaItems);
        setMedicalRecords(testData.medicalRecords);
        setMedications(testData.medications);
        setVetVisits(testData.vetVisits);
        setImmunizations(testData.immunizations);
        setCanineAllergies(testData.canineAllergies);
      } else {
        // Supabase is configured but there was an error - initialize with empty arrays
        console.warn('Supabase is configured but error occurred. Initializing with empty data.');
        setCanines([]);
        setVets([]);
        setContacts([]);
        setNutritionEntries([]);
        setTrainingLogs([]);
        setAppointments([]);
        setMediaItems([]);
        setMedicalRecords([]);
        setMedications([]);
        setVetVisits([]);
        setImmunizations([]);
        setCanineAllergies([]);
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Load data on mount and when user changes
  useEffect(() => {
    loadData();
  }, [userProfile?.id]);

  // User Profile
  const updateUserProfile = async (updates: Partial<UserProfile>) => {
    if (!userProfile) return;

    try {
      const updated = await userProfileService.update(userProfile.id, updates);
      if (updated) {
        setUserProfile(updated);
      }
    } catch (error) {
      console.error('Error updating user profile:', error);
      // Update local state as fallback
      setUserProfile({ ...userProfile, ...updates, updatedAt: new Date().toISOString() });
    }
  };

  // User Management (Admin only)
  const addUser = async (user: Omit<UserProfile, 'id' | 'createdAt' | 'updatedAt'>, password: string) => {
    try {
      if (userProfile?.role !== 'Admin') {
        throw new Error('Only admins can create users');
      }

      // Hash the password
      const passwordHash = await hashPassword(password);
      
      const newUser = await userProfileService.create(user, passwordHash);
      if (newUser) {
        setAllUsers([newUser, ...allUsers]);
      }
    } catch (error) {
      console.error('Error adding user:', error);
      throw error;
    }
  };

  const updateUser = async (id: string, updates: Partial<UserProfile>) => {
    try {
      if (userProfile?.role !== 'Admin') {
        throw new Error('Only admins can update users');
      }

      const updated = await userProfileService.update(id, updates);
      if (updated) {
        setAllUsers(allUsers.map((u) => (u.id === id ? updated : u)));
        // If updating current user, update userProfile as well
        if (userProfile.id === id) {
          setUserProfile(updated);
        }
      }
    } catch (error) {
      console.error('Error updating user:', error);
      throw error;
    }
  };

  const deleteUser = async (id: string) => {
    try {
      if (userProfile?.role !== 'Admin') {
        throw new Error('Only admins can delete users');
      }

      // Prevent deleting self
      if (userProfile.id === id) {
        throw new Error('Cannot delete your own account');
      }

      const success = await userProfileService.delete(id);
      if (success) {
        setAllUsers(allUsers.filter((u) => u.id !== id));
      }
    } catch (error) {
      console.error('Error deleting user:', error);
      throw error;
    }
  };

  // Canine Profile
  const addCanine = async (canine: Omit<CanineProfile, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      const newCanine = await canineProfileService.create(canine);
      if (newCanine) {
        setCanines([...canines, newCanine]);
      }
    } catch (error) {
      console.error('Error adding canine:', error);
      // Fallback to local state
      const fallbackCanine: CanineProfile = {
        ...canine,
        id: `canine-${Date.now()}`,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      setCanines([...canines, fallbackCanine]);
    }
  };

  const updateCanine = async (id: string, updates: Partial<CanineProfile>) => {
    try {
      const updated = await canineProfileService.update(id, updates);
      if (updated) {
        setCanines(canines.map((c) => (c.id === id ? updated : c)));
      }
    } catch (error) {
      console.error('Error updating canine:', error);
      // Fallback to local state
      setCanines(
        canines.map((c) =>
          c.id === id ? { ...c, ...updates, updatedAt: new Date().toISOString() } : c
        )
      );
    }
  };

  const deleteCanine = async (id: string) => {
    try {
      const success = await canineProfileService.delete(id);
      if (success) {
        setCanines(canines.filter((c) => c.id !== id));
        setNutritionEntries(nutritionEntries.filter((n) => n.canineId !== id));
        setTrainingLogs(trainingLogs.filter((t) => t.canineId !== id));
        setAppointments(appointments.filter((a) => a.canineId !== id));
        setMediaItems(mediaItems.filter((m) => m.canineId !== id));
        setMedicalRecords(medicalRecords.filter((m) => m.canineId !== id));
        setMedications(medications.filter((m) => m.canineId !== id));
        setVetVisits(vetVisits.filter((v) => v.canineId !== id));
        setImmunizations(immunizations.filter((imm) => imm.canineId !== id));
        setCanineAllergies(canineAllergies.filter((allergy) => allergy.canineId !== id));
      }
    } catch (error) {
      console.error('Error deleting canine:', error);
      // Fallback to local state
      setCanines(canines.filter((c) => c.id !== id));
      setNutritionEntries(nutritionEntries.filter((n) => n.canineId !== id));
      setTrainingLogs(trainingLogs.filter((t) => t.canineId !== id));
      setAppointments(appointments.filter((a) => a.canineId !== id));
      setMediaItems(mediaItems.filter((m) => m.canineId !== id));
      setMedicalRecords(medicalRecords.filter((m) => m.canineId !== id));
      setMedications(medications.filter((m) => m.canineId !== id));
      setVetVisits(vetVisits.filter((v) => v.canineId !== id));
      setImmunizations(immunizations.filter((imm) => imm.canineId !== id));
      setCanineAllergies(canineAllergies.filter((allergy) => allergy.canineId !== id));
    }
  };

  const getCanine = (id: string) => canines.find((c) => c.id === id);
  const getNutritionEntriesByCanine = (canineId: string) =>
    nutritionEntries.filter((entry) => entry.canineId === canineId);
  const getTrainingLogsByCanine = (canineId: string) =>
    trainingLogs.filter((log) => log.canineId === canineId);
  const getMediaItemsByCanine = (canineId: string) => mediaItems.filter((m) => m.canineId === canineId);
  const getMedicationsByCanine = (canineId: string) => medications.filter((med) => med.canineId === canineId);
  const getVetVisitsByCanine = (canineId: string) => vetVisits.filter((visit) => visit.canineId === canineId);
  const getImmunizationsByCanine = (canineId: string) => immunizations.filter((record) => record.canineId === canineId);
  const getCanineAllergiesByCanine = (canineId: string) => canineAllergies.filter((allergy) => allergy.canineId === canineId);

  // Vet Profile
  const addVet = async (vet: Omit<VetProfile, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      const newVet = await vetProfileService.create(vet);
      if (newVet) {
        setVets([...vets, newVet]);
        return newVet;
      }
    } catch (error) {
      console.error('Error adding vet:', error);
    }
    const fallbackVet: VetProfile = {
      ...vet,
      id: `vet-${Date.now()}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setVets([...vets, fallbackVet]);
    return fallbackVet;
  };

  const updateVet = async (id: string, updates: Partial<VetProfile>) => {
    try {
      const updated = await vetProfileService.update(id, updates);
      if (updated) {
        setVets(vets.map((v) => (v.id === id ? updated : v)));
      }
    } catch (error) {
      console.error('Error updating vet:', error);
      setVets(vets.map((v) => (v.id === id ? { ...v, ...updates, updatedAt: new Date().toISOString() } : v)));
    }
  };

  const deleteVet = async (id: string) => {
    try {
      const success = await vetProfileService.delete(id);
      if (success) {
        setVets(vets.filter((v) => v.id !== id));
        setAppointments(appointments.map((a) => (a.vetId === id ? { ...a, vetId: undefined } : a)));
      }
    } catch (error) {
      console.error('Error deleting vet:', error);
      setVets(vets.filter((v) => v.id !== id));
      setAppointments(appointments.map((a) => (a.vetId === id ? { ...a, vetId: undefined } : a)));
    }
  };

  // Contact
  const addContact = async (contact: Omit<Contact, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      const newContact = await contactService.create(contact);
      if (newContact) {
        setContacts([...contacts, newContact]);
      }
    } catch (error) {
      console.error('Error adding contact:', error);
      const fallbackContact: Contact = {
        ...contact,
        id: `contact-${Date.now()}`,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      setContacts([...contacts, fallbackContact]);
    }
  };

  const updateContact = async (id: string, updates: Partial<Contact>) => {
    try {
      const updated = await contactService.update(id, updates);
      if (updated) {
        setContacts(contacts.map((c) => (c.id === id ? updated : c)));
      }
    } catch (error) {
      console.error('Error updating contact:', error);
      setContacts(
        contacts.map((c) => (c.id === id ? { ...c, ...updates, updatedAt: new Date().toISOString() } : c))
      );
    }
  };

  const deleteContact = async (id: string) => {
    try {
      const success = await contactService.delete(id);
      if (success) {
        setContacts(contacts.filter((c) => c.id !== id));
      }
    } catch (error) {
      console.error('Error deleting contact:', error);
      setContacts(contacts.filter((c) => c.id !== id));
    }
  };

  // Nutrition
  const addNutritionEntry = async (entry: Omit<NutritionEntry, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      const newEntry = await nutritionEntryService.create(entry);
      if (newEntry) {
        setNutritionEntries([...nutritionEntries, newEntry]);
      }
    } catch (error) {
      console.error('Error adding nutrition entry:', error);
      const fallbackEntry: NutritionEntry = {
        ...entry,
        id: `nutrition-${Date.now()}`,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      setNutritionEntries([...nutritionEntries, fallbackEntry]);
    }
  };

  const updateNutritionEntry = async (id: string, updates: Partial<NutritionEntry>) => {
    try {
      const updated = await nutritionEntryService.update(id, updates);
      if (updated) {
        setNutritionEntries(nutritionEntries.map((e) => (e.id === id ? updated : e)));
      }
    } catch (error) {
      console.error('Error updating nutrition entry:', error);
      setNutritionEntries(
        nutritionEntries.map((e) =>
          e.id === id ? { ...e, ...updates, updatedAt: new Date().toISOString() } : e
        )
      );
    }
  };

  const deleteNutritionEntry = async (id: string) => {
    try {
      const success = await nutritionEntryService.delete(id);
      if (success) {
        setNutritionEntries(nutritionEntries.filter((e) => e.id !== id));
      }
    } catch (error) {
      console.error('Error deleting nutrition entry:', error);
      setNutritionEntries(nutritionEntries.filter((e) => e.id !== id));
    }
  };

  // Training
  const addTrainingLog = async (log: Omit<TrainingLog, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      const newLog = await trainingLogService.create(log);
      if (newLog) {
        setTrainingLogs([...trainingLogs, newLog]);
      }
    } catch (error) {
      console.error('Error adding training log:', error);
      const fallbackLog: TrainingLog = {
        ...log,
        id: `training-${Date.now()}`,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      setTrainingLogs([...trainingLogs, fallbackLog]);
    }
  };

  const updateTrainingLog = async (id: string, updates: Partial<TrainingLog>) => {
    try {
      const updated = await trainingLogService.update(id, updates);
      if (updated) {
        setTrainingLogs(trainingLogs.map((l) => (l.id === id ? updated : l)));
      }
    } catch (error) {
      console.error('Error updating training log:', error);
      setTrainingLogs(
        trainingLogs.map((l) => (l.id === id ? { ...l, ...updates, updatedAt: new Date().toISOString() } : l))
      );
    }
  };

  const deleteTrainingLog = async (id: string) => {
    try {
      const success = await trainingLogService.delete(id);
      if (success) {
        setTrainingLogs(trainingLogs.filter((l) => l.id !== id));
      }
    } catch (error) {
      console.error('Error deleting training log:', error);
      setTrainingLogs(trainingLogs.filter((l) => l.id !== id));
    }
  };

  // Appointment
  const addAppointment = async (appointment: Omit<Appointment, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      const newAppointment = await appointmentService.create(appointment);
      if (newAppointment) {
        setAppointments([...appointments, newAppointment]);
      }
    } catch (error) {
      console.error('Error adding appointment:', error);
      const fallbackAppointment: Appointment = {
        ...appointment,
        id: `appt-${Date.now()}`,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      setAppointments([...appointments, fallbackAppointment]);
    }
  };

  const updateAppointment = async (id: string, updates: Partial<Appointment>) => {
    try {
      const updated = await appointmentService.update(id, updates);
      if (updated) {
        setAppointments(appointments.map((a) => (a.id === id ? updated : a)));
      }
    } catch (error) {
      console.error('Error updating appointment:', error);
      setAppointments(
        appointments.map((a) => (a.id === id ? { ...a, ...updates, updatedAt: new Date().toISOString() } : a))
      );
    }
  };

  const deleteAppointment = async (id: string) => {
    try {
      const success = await appointmentService.delete(id);
      if (success) {
        setAppointments(appointments.filter((a) => a.id !== id));
      }
    } catch (error) {
      console.error('Error deleting appointment:', error);
      setAppointments(appointments.filter((a) => a.id !== id));
    }
  };

  // Media
  const addMediaItem = async (media: Omit<MediaItem, 'id' | 'createdAt'>) => {
    try {
      const newMedia = await mediaItemService.create(media);
      if (newMedia) {
        setMediaItems([newMedia, ...mediaItems]);
      } else {
        const fallbackMedia: MediaItem = {
          ...media,
          id: `media-${Date.now()}`,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        setMediaItems([fallbackMedia, ...mediaItems]);
      }
    } catch (error) {
      console.error('Error adding media item:', error);
      const fallbackMedia: MediaItem = {
        ...media,
        id: `media-${Date.now()}`,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      setMediaItems([fallbackMedia, ...mediaItems]);
    }
  };

  const updateMediaItem = async (id: string, updates: Partial<MediaItem>) => {
    try {
      const updated = await mediaItemService.update(id, updates);
      if (updated) {
        setMediaItems(mediaItems.map((item) => (item.id === id ? updated : item)));
      }
    } catch (error) {
      console.error('Error updating media item:', error);
      setMediaItems(mediaItems.map((item) => (item.id === id ? { ...item, ...updates, updatedAt: new Date().toISOString() } : item)));
    }
  };

  const deleteMediaItem = async (id: string) => {
    try {
      const success = await mediaItemService.delete(id);
      if (success) {
        setMediaItems(mediaItems.filter((item) => item.id !== id));
      }
    } catch (error) {
      console.error('Error deleting media item:', error);
      setMediaItems(mediaItems.filter((item) => item.id !== id));
    }
  };

  const addMedicalRecord = async (record: Omit<MedicalRecord, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      const created = await medicalRecordService.create(record);
      if (created) {
        setMedicalRecords([created, ...medicalRecords]);
        return;
      }
    } catch (error) {
      console.error('Error adding medical record:', error);
    }

    const now = new Date().toISOString();
    const fallbackRecord: MedicalRecord = {
      ...record,
      id: `medrec-${Date.now()}`,
      createdAt: now,
      updatedAt: now,
    };
    setMedicalRecords([fallbackRecord, ...medicalRecords]);
  };

  const updateMedicalRecord = async (id: string, updates: Partial<MedicalRecord>) => {
    try {
      const updated = await medicalRecordService.update(id, updates);
      if (updated) {
        setMedicalRecords(medicalRecords.map((rec) => (rec.id === id ? updated : rec)));
        return;
      }
    } catch (error) {
      console.error('Error updating medical record:', error);
    }

    setMedicalRecords(
      medicalRecords.map((rec) =>
        rec.id === id ? { ...rec, ...updates, updatedAt: new Date().toISOString() } : rec
      )
    );
  };

  const deleteMedicalRecord = async (id: string) => {
    try {
      const success = await medicalRecordService.delete(id);
      if (success) {
        setMedicalRecords(medicalRecords.filter((rec) => rec.id !== id));
        return;
      }
    } catch (error) {
      console.error('Error deleting medical record:', error);
    }

    setMedicalRecords(medicalRecords.filter((rec) => rec.id !== id));
  };

  const addMedicationEntry = async (entry: Omit<MedicationEntry, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      const created = await medicationService.create(entry);
      if (created) {
        setMedications([created, ...medications]);
        return;
      }
    } catch (error) {
      console.error('Error adding medication entry:', error);
    }

    const now = new Date().toISOString();
    const fallbackEntry: MedicationEntry = {
      ...entry,
      id: `medication-${Date.now()}`,
      createdAt: now,
      updatedAt: now,
    };
    setMedications([fallbackEntry, ...medications]);
  };

  const updateMedicationEntry = async (id: string, updates: Partial<MedicationEntry>) => {
    try {
      const updated = await medicationService.update(id, updates);
      if (updated) {
        setMedications(medications.map((med) => (med.id === id ? updated : med)));
        return;
      }
    } catch (error) {
      console.error('Error updating medication entry:', error);
    }

    setMedications(
      medications.map((med) =>
        med.id === id ? { ...med, ...updates, updatedAt: new Date().toISOString() } : med
      )
    );
  };

  const deleteMedicationEntry = async (id: string) => {
    try {
      const success = await medicationService.delete(id);
      if (success) {
        setMedications(medications.filter((med) => med.id !== id));
        return;
      }
    } catch (error) {
      console.error('Error deleting medication entry:', error);
    }

    setMedications(medications.filter((med) => med.id !== id));
  };

  const addVetVisit = async (visit: Omit<VetVisit, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      const created = await vetVisitService.create(visit);
      if (created) {
        setVetVisits([created, ...vetVisits]);
        return;
      }
    } catch (error) {
      console.error('Error adding vet visit:', error);
    }

    const now = new Date().toISOString();
    const fallback: VetVisit = {
      ...visit,
      id: `visit-${Date.now()}`,
      createdAt: now,
      updatedAt: now,
    };
    setVetVisits([fallback, ...vetVisits]);
  };

  const updateVetVisit = async (id: string, updates: Partial<VetVisit>) => {
    try {
      const updated = await vetVisitService.update(id, updates);
      if (updated) {
        setVetVisits(vetVisits.map((visit) => (visit.id === id ? updated : visit)));
        return;
      }
    } catch (error) {
      console.error('Error updating vet visit:', error);
    }

    setVetVisits(
      vetVisits.map((visit) =>
        visit.id === id ? { ...visit, ...updates, updatedAt: new Date().toISOString() } : visit
      )
    );
  };

  const deleteVetVisit = async (id: string) => {
    try {
      const success = await vetVisitService.delete(id);
      if (success) {
        setVetVisits(vetVisits.filter((visit) => visit.id !== id));
        return;
      }
    } catch (error) {
      console.error('Error deleting vet visit:', error);
    }

    setVetVisits(vetVisits.filter((visit) => visit.id !== id));
  };

  const addImmunizationRecord = async (
    record: Omit<ImmunizationRecord, 'id' | 'createdAt' | 'updatedAt'>
  ) => {
    try {
      const created = await immunizationService.create(record);
      if (created) {
        setImmunizations([created, ...immunizations]);
        return;
      }
    } catch (error) {
      console.error('Error adding immunization record:', error);
    }

    const now = new Date().toISOString();
    const fallback: ImmunizationRecord = {
      ...record,
      id: `imm-${Date.now()}`,
      createdAt: now,
      updatedAt: now,
    };
    setImmunizations([fallback, ...immunizations]);
  };

  const updateImmunizationRecord = async (id: string, updates: Partial<ImmunizationRecord>) => {
    try {
      const updated = await immunizationService.update(id, updates);
      if (updated) {
        setImmunizations(immunizations.map((record) => (record.id === id ? updated : record)));
        return;
      }
    } catch (error) {
      console.error('Error updating immunization record:', error);
    }

    setImmunizations(
      immunizations.map((record) =>
        record.id === id ? { ...record, ...updates, updatedAt: new Date().toISOString() } : record
      )
    );
  };

  const deleteImmunizationRecord = async (id: string) => {
    try {
      const success = await immunizationService.delete(id);
      if (success) {
        setImmunizations(immunizations.filter((record) => record.id !== id));
        return;
      }
    } catch (error) {
      console.error('Error deleting immunization record:', error);
    }

    setImmunizations(immunizations.filter((record) => record.id !== id));
  };

  const addCanineAllergy = async (allergy: Omit<CanineAllergy, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      const created = await canineAllergyService.create(allergy);
      if (created) {
        setCanineAllergies([created, ...canineAllergies]);
        return;
      }
    } catch (error) {
      console.error('Error adding canine allergy:', error);
    }

    const now = new Date().toISOString();
    const fallback: CanineAllergy = {
      ...allergy,
      id: `allergy-${Date.now()}`,
      createdAt: now,
      updatedAt: now,
    };
    setCanineAllergies([fallback, ...canineAllergies]);
  };

  const updateCanineAllergy = async (id: string, updates: Partial<CanineAllergy>) => {
    try {
      const updated = await canineAllergyService.update(id, updates);
      if (updated) {
        setCanineAllergies(canineAllergies.map((allergy) => (allergy.id === id ? updated : allergy)));
        return;
      }
    } catch (error) {
      console.error('Error updating canine allergy:', error);
    }

    setCanineAllergies(
      canineAllergies.map((allergy) => (allergy.id === id ? { ...allergy, ...updates, updatedAt: new Date().toISOString() } : allergy))
    );
  };

  const deleteCanineAllergy = async (id: string) => {
    try {
      const success = await canineAllergyService.delete(id);
      if (success) {
        setCanineAllergies(canineAllergies.filter((allergy) => allergy.id !== id));
        return;
      }
    } catch (error) {
      console.error('Error deleting canine allergy:', error);
    }

    setCanineAllergies(canineAllergies.filter((allergy) => allergy.id !== id));
  };

  const changePassword = async (currentPassword: string, newPassword: string) => {
    if (!userProfile) {
      throw new Error('You must be logged in to change your password.');
    }

    if (!newPassword || newPassword.length < 8) {
      throw new Error('New password must be at least 8 characters long.');
    }

    console.log('[ChangePassword] Supabase configured:', isSupabaseConfigured);

    if (!isSupabaseConfigured) {
      console.warn('Supabase not configured. Simulating password change locally.');
      setUserProfile({
        ...userProfile,
        updatedAt: new Date().toISOString(),
      });
      return;
    }

    const passwordData = await userProfileService.getPasswordHashByEmail(userProfile.email);
    if (!passwordData) {
      throw new Error('Unable to locate your account. Please log in again.');
    }

    if (passwordData.password_hash) {
      const matchesCurrent = await verifyPassword(currentPassword, passwordData.password_hash);
      if (!matchesCurrent) {
        throw new Error('Current password is incorrect.');
      }

      const isSameAsCurrent = await verifyPassword(newPassword, passwordData.password_hash);
      if (isSameAsCurrent) {
        throw new Error('New password must be different from your current password.');
      }
    } else {
      console.warn('No password hash stored for this user. Setting password without current verification.');
    }

    const newHash = await hashPassword(newPassword);
    const success = await userProfileService.updatePasswordHash(passwordData.id, newHash);

    if (!success) {
      throw new Error('Failed to update password. Please try again.');
    }

    const updatedAt = new Date().toISOString();
    setUserProfile((prev) => (prev ? { ...prev, updatedAt } : prev));
    setAllUsers((prev) =>
      prev.map((u) => (u.id === passwordData.id ? { ...u, updatedAt } : u))
    );
  };

  // Authentication - App-based (not Supabase Auth)
  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      if (isSupabaseConfigured) {
        console.log('Attempting app-based authentication for:', email);
        
        // Get user's password hash from database
        const passwordData = await userProfileService.getPasswordHashByEmail(email);
        
        if (!passwordData) {
          throw new Error('No account found with this email address. Please sign up first.');
        }
        
        // Check if user exists but doesn't have a password_hash (legacy user)
        if (!passwordData.password_hash) {
          // This is a legacy user without a password - automatically set password on first login
          console.log('Legacy user found without password_hash. Setting password...');
          
          // Hash the provided password
          const passwordHash = await hashPassword(password);
          
          // Directly update password_hash in database using service client
          const { error: updateError } = await supabaseService
            .from('user_profiles')
            .update({ password_hash: passwordHash })
            .eq('id', passwordData.id);
          
          if (updateError) {
            console.error('Error updating password hash:', updateError);
            throw new Error('Failed to set password. Please try again or contact support.');
          }
          
          console.log('✅ Password set successfully for legacy user');
          
          // Now proceed with login
          const profile = await userProfileService.getById(passwordData.id);
          if (!profile) {
            throw new Error('User profile not found. Please contact support.');
          }
          
          setUserProfile(profile);
          setIsAuthenticated(true);
          await loadData();
          return true;
        }
        
        // Verify password
        const isValid = await verifyPassword(password, passwordData.password_hash);
        
        if (!isValid) {
          throw new Error('Invalid email or password.');
        }
        
        // Password is valid, get the full user profile
        const profile = await userProfileService.getById(passwordData.id);
        
        if (!profile) {
          throw new Error('User profile not found. Please contact support.');
        }
        
        console.log('✅ Authentication successful');
        setUserProfile(profile);
        setIsAuthenticated(true);
        await loadData();
        return true;
      } else {
        // Fallback: Simple email check (only if Supabase is NOT configured)
        console.warn('⚠️ Supabase not configured. Using test data authentication.');
        const testData = generateTestData();
        if (testData.userProfile.email === email && password.length > 0) {
          setUserProfile(testData.userProfile);
          setIsAuthenticated(true);
          await loadData();
          return true;
        } else {
          throw new Error('Invalid email or password. Use: john.doe@example.com / any password');
        }
      }
    } catch (error: any) {
      console.error('Login error:', error);
      // Re-throw the error so the login screen can show a specific message
      throw error;
    }
  };

  const signup = async (
    email: string,
    password: string,
    firstName: string,
    lastName: string,
    activationCode: string
  ): Promise<{ success: boolean; requiresEmailConfirmation?: boolean; message?: string }> => {
    try {
      // Validate activation code
      const activationCodeInfo = validateActivationCode(activationCode);
      if (!activationCodeInfo.valid) {
        throw new Error('Invalid activation code. Please enter a valid activation code to sign up.');
      }

      // Validate activation code for Pet Owner role (default role for signup)
      const role: UserRole = 'Pet Owner';
      const roleValidatedCode = validateActivationCode(activationCode, role);
      if (!roleValidatedCode.valid) {
        throw new Error(roleValidatedCode.description || 'Invalid activation code for this role.');
      }

      // Check if user already exists
      const existingUser = await userProfileService.getByEmail(email);
      if (existingUser) {
        throw new Error('An account with this email already exists. Please login instead.');
      }

      // If Supabase is configured, create app user (not Supabase Auth user)
      if (isSupabaseConfigured) {
        console.log('Creating app user account for:', email);
        
        // Hash the password
        const passwordHash = await hashPassword(password);
        
        // Create user profile with hashed password
        const newProfile = await userProfileService.create(
          {
            firstName,
            lastName,
            email,
            phone: '',
            country: 'US',
            role: 'Pet Owner',
          },
          passwordHash
        );
        
        if (!newProfile) {
          throw new Error('Failed to create account. Please try again.');
        }
        
        console.log('✅ Account created successfully');
        
        // Automatically log in the user
        setUserProfile(newProfile);
        setIsAuthenticated(true);
        await loadData();
        
        return { success: true };
      } else {
        // Fallback to test data mode (for development)
        console.warn('⚠️ Supabase not configured. Signup not available in test mode.');
        throw new Error('Signup is only available when Supabase is configured. Please set up your Supabase credentials.');
      }
    } catch (error: any) {
      console.error('Signup error:', error);
      throw error;
    }
  };

  const logout = async () => {
    // App-based authentication - just clear local state
    setIsAuthenticated(false);
    setUserProfile(null);
    setAllUsers([]);
    setCanines([]);
    setNutritionEntries([]);
    setTrainingLogs([]);
    setAppointments([]);
    setMediaItems([]);
    setMedicalRecords([]);
    setMedications([]);
    setVetVisits([]);
    setImmunizations([]);
    setCanineAllergies([]);
  };

  const refreshData = async () => {
    await loadData();
  };

  // Test Supabase connection
  const testConnection = async () => {
    const result = await testSupabaseConnection();
    printTestResults(result);
    return result;
  };

  const value: AppContextType = {
    // State
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
    isAuthenticated,
    isLoading,

    // User Profile
    setUserProfile,
    updateUserProfile,

    // User Management (Admin only)
    allUsers,
    addUser,
    updateUser,
    deleteUser,

    // Canine Profile
    addCanine,
    updateCanine,
    deleteCanine,
    getCanine,
    getNutritionEntriesByCanine,
    getTrainingLogsByCanine,
    getMediaItemsByCanine,
    getMedicationsByCanine,
    getVetVisitsByCanine,
    getImmunizationsByCanine,
    getCanineAllergiesByCanine,

    // Vet Profile
    addVet,
    updateVet,
    deleteVet,

    // Contact
    addContact,
    updateContact,
    deleteContact,

    // Nutrition
    addNutritionEntry,
    updateNutritionEntry,
    deleteNutritionEntry,

    // Training
    addTrainingLog,
    updateTrainingLog,
    deleteTrainingLog,

    // Appointment
    addAppointment,
    updateAppointment,
    deleteAppointment,

    // Media
    addMediaItem,
    updateMediaItem,
    deleteMediaItem,

    // Medical Records
    addMedicalRecord,
    updateMedicalRecord,
    deleteMedicalRecord,

    // Medications
    addMedicationEntry,
    updateMedicationEntry,
    deleteMedicationEntry,

    // Vet Visits
    addVetVisit,
    updateVetVisit,
    deleteVetVisit,

    // Immunizations
    addImmunizationRecord,
    updateImmunizationRecord,
    deleteImmunizationRecord,

    // Allergies
    addCanineAllergy,
    updateCanineAllergy,
    deleteCanineAllergy,

    // Authentication
    login,
    signup,
    changePassword,
    logout,
    refreshData,
    
    // Testing
    testConnection,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}
