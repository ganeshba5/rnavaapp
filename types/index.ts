/**
 * Type definitions for AVA Application
 * Phase 1: All core data models
 */

export type UserRole = 'Admin' | 'Pet Owner' | 'Vet' | 'Dog Walker';

export interface UserProfile {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  country: 'US' | 'India';
  role: UserRole;
  addressLine1?: string;
  addressLine2?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  profilePhotoUrl?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CanineProfile {
  id: string;
  userId: string; // Associated with Pet Owner
  name: string;
  breed?: string;
  dateOfBirth?: string;
  gender?: 'Male' | 'Female' | 'Unknown';
  weight?: number;
  weightUnit?: 'kg' | 'lbs';
  color?: string;
  microchipNumber?: string;
  profilePhotoId?: string; // ID of the media item used as profile photo
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface VetProfile {
  id: string;
  name: string;
  clinicName?: string;
  phone: string;
  email?: string;
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  country: 'US' | 'India';
  specialization?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Contact {
  id: string;
  name: string;
  relationship?: string;
  phone: string;
  email?: string;
  address?: string;
  isEmergency: boolean;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface NutritionEntry {
  id: string;
  canineId: string;
  date: string; // YYYY-MM-DD
  foodType: string;
  foodName: string;
  quantity: number;
  unit: 'grams' | 'cups' | 'oz' | 'pieces' | 'ml' | 'ounces';
  calories: number;
  addOns?: string;
  repeatDays?: number;
  actualDate?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CanineAllergy {
  id: string;
  canineId: string;
  foodType: string;
  name: string;
  createdAt: string;
  updatedAt: string;
}

export interface TrainingLog {
  id: string;
  canineId: string;
  date: string; // YYYY-MM-DD
  skill: string;
  duration?: number; // minutes
  success: boolean;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export type AppointmentStatus = 'Scheduled' | 'Completed' | 'Cancelled';

export interface Appointment {
  id: string;
  canineId: string;
  vetId?: string;
  category: string;
  title: string;
  description?: string;
  date: string; // YYYY-MM-DD
  startTime: string; // HH:mm
  endTime: string; // HH:mm
  status: AppointmentStatus;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export type MediaType = 'photo' | 'video';

export interface MediaItem {
  id: string;
  canineId: string; // Required - media is always associated with a pet
  type: MediaType;
  uri: string; // Local file path or URL
  caption?: string;
  date: string; // YYYY-MM-DD
  createdAt: string;
  updatedAt: string;
}

export type MedicalAttachmentType = 'photo' | 'file';

export interface MedicalAttachment {
  id: string;
  type: MedicalAttachmentType;
  uri: string;
  name: string;
  size?: number;
  mimeType?: string;
}

export interface MedicalRecord {
  id: string;
  canineId: string;
  vetName: string;
  clinicName: string;
  reportType: string;
  reportDate?: string;
  notes?: string;
  attachments: MedicalAttachment[];
  createdAt: string;
  updatedAt: string;
}

export interface MedicationEntry {
  id: string;
  canineId: string;
  vetId?: string;
  vetName: string;
  medicationName: string;
  reason: string;
  description?: string;
  quantity: number;
  dosageUnit: string;
  frequency: string;
  startDate: string;
  startTime?: string;
  endDate?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface VetVisit {
  id: string;
  canineId: string;
  vetId?: string;
  vetName: string;
  reason: string;
  endResults: string;
  visitDate: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ImmunizationRecord {
  id: string;
  canineId: string;
  vetId?: string;
  vetName: string;
  vaccineName: string;
  ageYears: number;
  ageMonths: number;
  immunizationDate: string;
  lastVaccinatedDate: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}
 
 
