/**
 * Database Service Layer
 * 
 * This service provides CRUD operations for all entities using Supabase.
 * It abstracts the database operations from the AppContext.
 */

import { supabaseService, TABLES, isSupabaseConfigured } from '@/lib/supabase';
import {
  UserProfile,
  UserRole,
  CanineProfile,
  VetProfile,
  Contact,
  NutritionEntry,
  TrainingLog,
  Appointment,
  MediaItem,
  MedicalRecord,
  MedicalAttachment,
  MedicationEntry,
  VetVisit,
  ImmunizationRecord,
  CanineAllergy,
} from '@/types';
import { extractFilePathFromUrl, getFileUrl } from '@/services/storage';

// ============================================================================
// User Profile Operations
// ============================================================================

export const userProfileService = {
  async getById(id: string): Promise<UserProfile | null> {
    if (!isSupabaseConfigured) {
      return null;
    }

    const { data, error } = await supabaseService
      .from(TABLES.USER_PROFILES)
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error('Error fetching user profile:', error);
      return null;
    }
    return data ? this.mapFromDb(data) : null;
  },

  async getAll(): Promise<UserProfile[]> {
    if (!isSupabaseConfigured) {
      return [];
    }

    const { data, error } = await supabaseService
      .from(TABLES.USER_PROFILES)
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching all user profiles:', error);
      return [];
    }
    return (data || []).map((item) => this.mapFromDb(item));
  },

  async getByEmail(email: string): Promise<UserProfile | null> {
    if (!isSupabaseConfigured) {
      return null;
    }

    const { data, error } = await supabaseService
      .from(TABLES.USER_PROFILES)
      .select('*')
      .eq('email', email)
      .maybeSingle(); // Use maybeSingle() instead of single() to handle 0 rows gracefully

    if (error) {
      console.error('Error fetching user profile by email:', error);
      return null;
    }
    return data ? this.mapFromDb(data) : null;
  },

  /**
   * Get password hash for a user by email (for authentication)
   * Returns the password_hash field which is not included in the regular UserProfile
   */
  async getPasswordHashByEmail(email: string): Promise<{ id: string; password_hash: string | null } | null> {
    if (!isSupabaseConfigured) {
      return null;
    }

    const { data, error } = await supabaseService
      .from(TABLES.USER_PROFILES)
      .select('id, password_hash')
      .eq('email', email)
      .maybeSingle();

    if (error) {
      console.error('Error fetching password hash:', error);
      return null;
    }
    return data || null;
  },

  async create(profile: Omit<UserProfile, 'id' | 'createdAt' | 'updatedAt'> | UserProfile, passwordHash?: string): Promise<UserProfile | null> {
    if (!isSupabaseConfigured) {
      return null;
    }

    const now = new Date().toISOString();
    // Extract id if provided
    const { id, firstName, lastName, zipCode, createdAt, updatedAt, ...rest } = profile as any;
    
    // Map camelCase to snake_case for database
    // Note: zip_code is not in the schema, so we don't include it
    const insertData: any = {
      first_name: firstName || '',
      last_name: lastName || '',
      email: rest.email,
      phone: rest.phone || null,
      address: rest.address || null,
      city: rest.city || null,
      state: rest.state || null,
      country: rest.country || 'US',
      role: rest.role || 'Pet Owner',
      profile_photo_url: rest.profilePhotoUrl || null,
      created_at: now,
      updated_at: now,
    };
    
    // Add password_hash if provided
    if (passwordHash) {
      insertData.password_hash = passwordHash;
    }
    
    // If id is provided, use it
    if (id) {
      insertData.id = id;
    }

    const { data, error } = await supabaseService
      .from(TABLES.USER_PROFILES)
      .insert(insertData)
      .select()
      .single();

    if (error) {
      console.error('Error creating user profile:', error);
      console.error('Insert data attempted:', insertData);
      return null;
    }
    return data ? this.mapFromDb(data) : null;
  },

  async update(id: string, updates: Partial<UserProfile>): Promise<UserProfile | null> {
    if (!isSupabaseConfigured) {
      return null;
    }

    const { firstName, lastName, zipCode, createdAt, updatedAt, ...rest } = updates as any;
    
    // Map camelCase to snake_case for database
    // Note: zip_code is not in the schema, so we don't include it
    const dbUpdates: any = {
      updated_at: new Date().toISOString(),
    };
    
    if (firstName !== undefined) dbUpdates.first_name = firstName;
    if (lastName !== undefined) dbUpdates.last_name = lastName;
    // zipCode is not in database schema, skip it
    if (rest.email !== undefined) dbUpdates.email = rest.email;
    if (rest.phone !== undefined) dbUpdates.phone = rest.phone;
    if (rest.address !== undefined) dbUpdates.address = rest.address;
    if (rest.city !== undefined) dbUpdates.city = rest.city;
    if (rest.state !== undefined) dbUpdates.state = rest.state;
    if (rest.country !== undefined) dbUpdates.country = rest.country;
    if (rest.role !== undefined) dbUpdates.role = rest.role;
    if (rest.profilePhotoUrl !== undefined) dbUpdates.profile_photo_url = rest.profilePhotoUrl || null;

    const { data, error } = await supabaseService
      .from(TABLES.USER_PROFILES)
      .update(dbUpdates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating user profile:', error);
      return null;
    }
    return data ? this.mapFromDb(data) : null;
  },

  async delete(id: string): Promise<boolean> {
    if (!isSupabaseConfigured) {
      return false;
    }

    const { error } = await supabaseService
      .from(TABLES.USER_PROFILES)
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting user profile:', error);
      return false;
    }
    return true;
  },

  mapFromDb(data: any): UserProfile {
    return {
      id: data.id,
      firstName: data.first_name || '',
      lastName: data.last_name || '',
      email: data.email,
      phone: data.phone || '',
      address: data.address || '',
      city: data.city || '',
      state: data.state || '',
      country: (data.country as 'US' | 'India') || 'US',
      zipCode: '', // zip_code is not in database schema, default to empty string
      role: (data.role as UserRole) || 'Pet Owner',
      profilePhotoUrl: data.profile_photo_url || '',
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    };
  },
};

// ============================================================================
// Canine Profile Operations
// ============================================================================

export const canineProfileService = {
  async getAll(userId?: string): Promise<CanineProfile[]> {
    if (!isSupabaseConfigured) {
      return [];
    }

    let query = supabaseService.from(TABLES.CANINE_PROFILES).select('*');
    
    if (userId) {
      query = query.eq('user_id', userId);
    }

    const { data, error } = await query.order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching canine profiles:', error);
      return [];
    }
    return data ? data.map(this.mapFromDb) : [];
  },

  async getById(id: string): Promise<CanineProfile | null> {
    if (!isSupabaseConfigured) {
      return null;
    }

    const { data, error } = await supabaseService
      .from(TABLES.CANINE_PROFILES)
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error('Error fetching canine profile:', error);
      return null;
    }
    return data ? this.mapFromDb(data) : null;
  },

  async create(canine: Omit<CanineProfile, 'id' | 'createdAt' | 'updatedAt'>): Promise<CanineProfile | null> {
    if (!isSupabaseConfigured) {
      return null;
    }

    const now = new Date().toISOString();
    const { data, error } = await supabaseService
      .from(TABLES.CANINE_PROFILES)
      .insert({
        user_id: canine.userId,
        name: canine.name,
        breed: canine.breed,
        date_of_birth: canine.dateOfBirth,
        gender: canine.gender,
        weight: canine.weight,
        weight_unit: canine.weightUnit,
        color: canine.color,
        microchip_number: canine.microchipNumber,
        profile_photo_id: canine.profilePhotoId,
        notes: canine.notes,
        created_at: now,
        updated_at: now,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating canine profile:', error);
      return null;
    }
    return data ? this.mapFromDb(data) : null;
  },

  async update(id: string, updates: Partial<CanineProfile>): Promise<CanineProfile | null> {
    if (!isSupabaseConfigured) {
      return null;
    }
    const {
      userId,
      dateOfBirth,
      weightUnit,
      microchipNumber,
      profilePhotoId,
      createdAt,
      updatedAt,
      ...rest
    } = updates as any;

    const dbUpdates: any = {
      ...rest,
      updated_at: new Date().toISOString(),
    };

    if (userId !== undefined) dbUpdates.user_id = userId;
    if (dateOfBirth !== undefined) dbUpdates.date_of_birth = dateOfBirth;
    if (weightUnit !== undefined) dbUpdates.weight_unit = weightUnit;
    if (microchipNumber !== undefined) dbUpdates.microchip_number = microchipNumber;
    if (profilePhotoId !== undefined) dbUpdates.profile_photo_id = profilePhotoId;

    const { data, error } = await supabaseService
      .from(TABLES.CANINE_PROFILES)
      .update(dbUpdates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating canine profile:', error);
      return null;
    }
    return data ? this.mapFromDb(data) : null;
  },

  async delete(id: string): Promise<boolean> {
    if (!isSupabaseConfigured) {
      return false;
    }

    const { error } = await supabaseService.from(TABLES.CANINE_PROFILES).delete().eq('id', id);

    if (error) {
      console.error('Error deleting canine profile:', error);
      return false;
    }
    return true;
  },

  mapFromDb(data: any): CanineProfile {
    return {
      id: data.id,
      userId: data.user_id,
      name: data.name,
      breed: data.breed,
      dateOfBirth: data.date_of_birth,
      gender: data.gender,
      weight: data.weight,
      weightUnit: data.weight_unit,
      color: data.color,
      microchipNumber: data.microchip_number,
      profilePhotoId: data.profile_photo_id,
      notes: data.notes,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    };
  },
};

// ============================================================================
// Vet Profile Operations
// ============================================================================

export const vetProfileService = {
  async getAll(): Promise<VetProfile[]> {
    if (!isSupabaseConfigured) {
      return [];
    }

    const { data, error } = await supabaseService
      .from(TABLES.VET_PROFILES)
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching vet profiles:', error);
      return [];
    }
    return data ? data.map(this.mapFromDb) : [];
  },

  async getById(id: string): Promise<VetProfile | null> {
    if (!isSupabaseConfigured) {
      return null;
    }

    const { data, error } = await supabaseService
      .from(TABLES.VET_PROFILES)
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error('Error fetching vet profile:', error);
      return null;
    }
    return data ? this.mapFromDb(data) : null;
  },

  async create(vet: Omit<VetProfile, 'id' | 'createdAt' | 'updatedAt'>): Promise<VetProfile | null> {
    if (!isSupabaseConfigured) {
      return null;
    }

    const now = new Date().toISOString();
    const { data, error } = await supabaseService
      .from(TABLES.VET_PROFILES)
      .insert({
        name: vet.name,
        clinic_name: vet.clinicName,
        phone: vet.phone,
        email: vet.email,
        address: vet.address,
        city: vet.city,
        state: vet.state,
        zip_code: vet.zipCode,
        country: vet.country,
        specialization: vet.specialization,
        notes: vet.notes,
        created_at: now,
        updated_at: now,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating vet profile:', error);
      return null;
    }
    return data ? this.mapFromDb(data) : null;
  },

  async update(id: string, updates: Partial<VetProfile>): Promise<VetProfile | null> {
    if (!isSupabaseConfigured) {
      return null;
    }
    const { clinicName, zipCode, createdAt, updatedAt, ...rest } = updates as any;

    const dbUpdates: any = {
      ...rest,
      updated_at: new Date().toISOString(),
    };

    if (clinicName !== undefined) dbUpdates.clinic_name = clinicName;
    if (zipCode !== undefined) dbUpdates.zip_code = zipCode;

    const { data, error } = await supabaseService
      .from(TABLES.VET_PROFILES)
      .update(dbUpdates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating vet profile:', error);
      return null;
    }
    return data ? this.mapFromDb(data) : null;
  },

  async delete(id: string): Promise<boolean> {
    if (!isSupabaseConfigured) {
      return false;
    }

    const { error } = await supabaseService.from(TABLES.VET_PROFILES).delete().eq('id', id);

    if (error) {
      console.error('Error deleting vet profile:', error);
      return false;
    }
    return true;
  },

  mapFromDb(data: any): VetProfile {
    return {
      id: data.id,
      name: data.name,
      clinicName: data.clinic_name,
      phone: data.phone,
      email: data.email,
      address: data.address,
      city: data.city,
      state: data.state,
      zipCode: data.zip_code,
      country: data.country,
      specialization: data.specialization,
      notes: data.notes,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    };
  },
};

// ============================================================================
// Contact Operations
// ============================================================================

export const contactService = {
  async getAll(): Promise<Contact[]> {
    if (!isSupabaseConfigured) {
      return [];
    }

    const { data, error } = await supabaseService
      .from(TABLES.CONTACTS)
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching contacts:', error);
      return [];
    }
    return data ? data.map(this.mapFromDb) : [];
  },

  async getById(id: string): Promise<Contact | null> {
    if (!isSupabaseConfigured) {
      return null;
    }

    const { data, error } = await supabaseService
      .from(TABLES.CONTACTS)
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error('Error fetching contact:', error);
      return null;
    }
    return data ? this.mapFromDb(data) : null;
  },

  async create(contact: Omit<Contact, 'id' | 'createdAt' | 'updatedAt'>): Promise<Contact | null> {
    if (!isSupabaseConfigured) {
      return null;
    }

    const now = new Date().toISOString();
    const { data, error } = await supabaseService
      .from(TABLES.CONTACTS)
      .insert({
        name: contact.name,
        relationship: contact.relationship,
        phone: contact.phone,
        email: contact.email,
        address: contact.address,
        is_emergency: contact.isEmergency,
        notes: contact.notes,
        created_at: now,
        updated_at: now,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating contact:', error);
      return null;
    }
    return data ? this.mapFromDb(data) : null;
  },

  async update(id: string, updates: Partial<Contact>): Promise<Contact | null> {
    if (!isSupabaseConfigured) {
      return null;
    }
    const { isEmergency, createdAt, updatedAt, ...rest } = updates as any;

    const dbUpdates: any = {
      ...rest,
      updated_at: new Date().toISOString(),
    };

    if (isEmergency !== undefined) dbUpdates.is_emergency = isEmergency;

    const { data, error } = await supabaseService
      .from(TABLES.CONTACTS)
      .update(dbUpdates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating contact:', error);
      return null;
    }
    return data ? this.mapFromDb(data) : null;
  },

  async delete(id: string): Promise<boolean> {
    if (!isSupabaseConfigured) {
      return false;
    }

    const { error } = await supabaseService.from(TABLES.CONTACTS).delete().eq('id', id);

    if (error) {
      console.error('Error deleting contact:', error);
      return false;
    }
    return true;
  },

  mapFromDb(data: any): Contact {
    return {
      id: data.id,
      name: data.name,
      relationship: data.relationship,
      phone: data.phone,
      email: data.email,
      address: data.address,
      isEmergency: data.is_emergency,
      notes: data.notes,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    };
  },
};

// ============================================================================
// Nutrition Entry Operations
// ============================================================================

export const nutritionEntryService = {
  async getAll(canineId?: string): Promise<NutritionEntry[]> {
    if (!isSupabaseConfigured) {
      return [];
    }
 
    let query = supabaseService.from(TABLES.NUTRITION_ENTRIES).select('*');
 
    if (canineId) {
      query = query.eq('canine_id', canineId);
    }
 
    const { data, error } = await query.order('date', { ascending: false });
 
    if (error) {
      console.error('Error fetching nutrition entries:', error);
      return [];
    }
    return data ? data.map(this.mapFromDb) : [];
  },
 
  async getById(id: string): Promise<NutritionEntry | null> {
    if (!isSupabaseConfigured) {
      return null;
    }
 
    const { data, error } = await supabaseService
      .from(TABLES.NUTRITION_ENTRIES)
      .select('*')
      .eq('id', id)
      .single();
 
    if (error) {
      console.error('Error fetching nutrition entry:', error);
      return null;
    }
    return data ? this.mapFromDb(data) : null;
  },
 
  async create(entry: Omit<NutritionEntry, 'id' | 'createdAt' | 'updatedAt'>): Promise<NutritionEntry | null> {
    if (!isSupabaseConfigured) {
      return null;
    }
 
    const now = new Date().toISOString();
 
    const { data, error } = await supabaseService
      .from(TABLES.NUTRITION_ENTRIES)
      .insert({
        canine_id: entry.canineId,
        date: entry.date,
        food_type: entry.foodType,
        food_name: entry.foodName,
        quantity: entry.quantity,
        unit: entry.unit,
        calories: entry.calories,
        add_ons: entry.addOns ?? null,
        repeat_days: entry.repeatDays ?? 0,
        actual_date: entry.actualDate ?? null,
        notes: entry.notes ?? null,
        created_at: now,
        updated_at: now,
      })
      .select()
      .single();
 
    if (error) {
      console.error('Error creating nutrition entry:', error);
      return null;
    }
    return data ? this.mapFromDb(data) : null;
  },
 
  async update(id: string, updates: Partial<NutritionEntry>): Promise<NutritionEntry | null> {
    if (!isSupabaseConfigured) {
      return null;
    }
    const {
      canineId,
      foodType,
      foodName,
      quantity,
      unit,
      calories,
      addOns,
      repeatDays,
      actualDate,
      date,
      notes,
    } = updates as any;
 
    const dbUpdates: Record<string, any> = {
      updated_at: new Date().toISOString(),
    };
 
    if (canineId !== undefined) dbUpdates.canine_id = canineId;
    if (date !== undefined) dbUpdates.date = date;
    if (foodType !== undefined) dbUpdates.food_type = foodType;
    if (foodName !== undefined) dbUpdates.food_name = foodName;
    if (quantity !== undefined) dbUpdates.quantity = quantity;
    if (unit !== undefined) dbUpdates.unit = unit;
    if (calories !== undefined) dbUpdates.calories = calories;
    if (addOns !== undefined) dbUpdates.add_ons = addOns ?? null;
    if (repeatDays !== undefined) dbUpdates.repeat_days = repeatDays ?? 0;
    if (actualDate !== undefined) dbUpdates.actual_date = actualDate ?? null;
    if (notes !== undefined) dbUpdates.notes = notes ?? null;
 
    const { data, error } = await supabaseService
      .from(TABLES.NUTRITION_ENTRIES)
      .update(dbUpdates)
      .eq('id', id)
      .select()
      .single();
 
    if (error) {
      console.error('Error updating nutrition entry:', error);
      return null;
    }
    return data ? this.mapFromDb(data) : null;
  },
 
  async delete(id: string): Promise<boolean> {
    if (!isSupabaseConfigured) {
      return false;
    }
 
    const { error } = await supabaseService.from(TABLES.NUTRITION_ENTRIES).delete().eq('id', id);
 
    if (error) {
      console.error('Error deleting nutrition entry:', error);
      return false;
    }
    return true;
  },
 
  mapFromDb(data: any): NutritionEntry {
    return {
      id: data.id,
      canineId: data.canine_id,
      date: data.date,
      foodType: data.food_type ?? 'Food',
      foodName: data.food_name ?? '',
      quantity: typeof data.quantity === 'number' ? data.quantity : Number(data.quantity) || 0,
      unit: (data.unit ?? 'cups') as NutritionEntry['unit'],
      calories: typeof data.calories === 'number' ? data.calories : Number(data.calories) || 0,
      addOns: data.add_ons ?? undefined,
      repeatDays: typeof data.repeat_days === 'number' ? data.repeat_days : Number(data.repeat_days) || 0,
      actualDate: data.actual_date ?? undefined,
      notes: data.notes ?? undefined,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    };
  },
};

// ============================================================================
// Training Log Operations
// ============================================================================

export const trainingLogService = {
  async getAll(canineId?: string): Promise<TrainingLog[]> {
    if (!isSupabaseConfigured) {
      return [];
    }

    let query = supabaseService.from(TABLES.TRAINING_LOGS).select('*');

    if (canineId) {
      query = query.eq('canine_id', canineId);
    }

    const { data, error } = await query.order('date', { ascending: false });

    if (error) {
      console.error('Error fetching training logs:', error);
      return [];
    }
    return data ? data.map(this.mapFromDb) : [];
  },

  async getById(id: string): Promise<TrainingLog | null> {
    if (!isSupabaseConfigured) {
      return null;
    }

    const { data, error } = await supabaseService
      .from(TABLES.TRAINING_LOGS)
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error('Error fetching training log:', error);
      return null;
    }
    return data ? this.mapFromDb(data) : null;
  },

  async create(log: Omit<TrainingLog, 'id' | 'createdAt' | 'updatedAt'>): Promise<TrainingLog | null> {
    if (!isSupabaseConfigured) {
      return null;
    }

    const now = new Date().toISOString();
    const { canineId, ...rest } = log;

    const { data, error } = await supabaseService
      .from(TABLES.TRAINING_LOGS)
      .insert({
        canine_id: canineId,
        date: log.date,
        skill: log.skill,
        duration: log.duration,
        activity: log.activity,
        success: log.success,
        notes: log.notes,
        created_at: now,
        updated_at: now,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating training log:', error);
      return null;
    }
    return data ? this.mapFromDb(data) : null;
  },

  async update(id: string, updates: Partial<TrainingLog>): Promise<TrainingLog | null> {
    if (!isSupabaseConfigured) {
      return null;
    }
    const { canineId, createdAt, updatedAt, ...rest } = updates as any;

    const dbUpdates: any = {
      ...rest,
      updated_at: new Date().toISOString(),
    };

    if (canineId !== undefined) dbUpdates.canine_id = canineId;

    const { data, error } = await supabaseService
      .from(TABLES.TRAINING_LOGS)
      .update(dbUpdates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating training log:', error);
      return null;
    }
    return data ? this.mapFromDb(data) : null;
  },

  async delete(id: string): Promise<boolean> {
    if (!isSupabaseConfigured) {
      return false;
    }

    const { error } = await supabaseService.from(TABLES.TRAINING_LOGS).delete().eq('id', id);

    if (error) {
      console.error('Error deleting training log:', error);
      return false;
    }
    return true;
  },

  mapFromDb(data: any): TrainingLog {
    return {
      id: data.id,
      canineId: data.canine_id,
      date: data.date,
      skill: data.skill,
      duration: data.duration,
      activity: data.activity,
      success: data.success,
      notes: data.notes,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    };
  },
};

// ============================================================================
// Appointment Operations
// ============================================================================

export const appointmentService = {
  async getAll(canineId?: string): Promise<Appointment[]> {
    if (!isSupabaseConfigured) {
      return [];
    }
 
    let query = supabaseService.from(TABLES.APPOINTMENTS).select('*');
 
    if (canineId) {
      query = query.eq('canine_id', canineId);
    }
 
    const { data, error } = await query.order('date', { ascending: false });
 
    if (error) {
      console.error('Error fetching appointments:', error);
      return [];
    }
    return data ? data.map(this.mapFromDb) : [];
  },
 
  async getById(id: string): Promise<Appointment | null> {
    if (!isSupabaseConfigured) {
      return null;
    }
 
    const { data, error } = await supabaseService
      .from(TABLES.APPOINTMENTS)
      .select('*')
      .eq('id', id)
      .single();
 
    if (error) {
      console.error('Error fetching appointment:', error);
      return null;
    }
    return data ? this.mapFromDb(data) : null;
  },
 
  async create(appointment: Omit<Appointment, 'id' | 'createdAt' | 'updatedAt'>): Promise<Appointment | null> {
    if (!isSupabaseConfigured) {
      return null;
    }
 
    const now = new Date().toISOString();
    const { data, error } = await supabaseService
      .from(TABLES.APPOINTMENTS)
      .insert({
        canine_id: appointment.canineId,
        vet_id: appointment.vetId ?? null,
        category: appointment.category,
        type: appointment.category,
        title: appointment.title,
        description: appointment.description ?? null,
        date: appointment.date,
        start_time: appointment.startTime,
        end_time: appointment.endTime,
        status: appointment.status,
        notes: appointment.notes ?? null,
        created_at: now,
        updated_at: now,
      })
      .select()
      .single();
 
    if (error) {
      console.error('Error creating appointment:', error);
      return null;
    }
    return data ? this.mapFromDb(data) : null;
  },
 
  async update(id: string, updates: Partial<Appointment>): Promise<Appointment | null> {
    if (!isSupabaseConfigured) {
      return null;
    }
 
    const {
      canineId,
      vetId,
      category,
      title,
      description,
      date,
      startTime,
      endTime,
      status,
      notes,
    } = updates as any;
 
    const dbUpdates: Record<string, any> = {
      updated_at: new Date().toISOString(),
    };
 
    if (canineId !== undefined) dbUpdates.canine_id = canineId;
    if (vetId !== undefined) dbUpdates.vet_id = vetId ?? null;
    if (category !== undefined) {
      dbUpdates.category = category;
      dbUpdates.type = category;
    }
    if (title !== undefined) dbUpdates.title = title;
    if (description !== undefined) dbUpdates.description = description ?? null;
    if (date !== undefined) dbUpdates.date = date;
    if (startTime !== undefined) dbUpdates.start_time = startTime;
    if (endTime !== undefined) dbUpdates.end_time = endTime;
    if (status !== undefined) dbUpdates.status = status;
    if (notes !== undefined) dbUpdates.notes = notes ?? null;
 
    const { data, error } = await supabaseService
      .from(TABLES.APPOINTMENTS)
      .update(dbUpdates)
      .eq('id', id)
      .select()
      .single();
 
    if (error) {
      console.error('Error updating appointment:', error);
      return null;
    }
    return data ? this.mapFromDb(data) : null;
  },
 
  async delete(id: string): Promise<boolean> {
    if (!isSupabaseConfigured) {
      return false;
    }
 
    const { error } = await supabaseService.from(TABLES.APPOINTMENTS).delete().eq('id', id);
 
    if (error) {
      console.error('Error deleting appointment:', error);
      return false;
    }
    return true;
  },
 
  mapFromDb(data: any): Appointment {
    return {
      id: data.id,
      canineId: data.canine_id,
      vetId: data.vet_id ?? undefined,
      category: data.category ?? '',
      title: data.title ?? '',
      description: data.description ?? undefined,
      date: data.date,
      startTime: data.start_time ?? '',
      endTime: data.end_time ?? '',
      status: data.status ?? 'Scheduled',
      notes: data.notes ?? undefined,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    };
  },
};

// ============================================================================
// Media Item Operations
// ============================================================================

export const mediaItemService = {
  async getAll(canineId?: string): Promise<MediaItem[]> {
    if (!isSupabaseConfigured) {
      return [];
    }

    let query = supabaseService.from(TABLES.MEDIA_ITEMS).select('*');

    if (canineId) {
      query = query.eq('canine_id', canineId);
    }

    const { data, error } = await query.order('created_at', { ascending: false });

        if (error) {
          console.error('Error fetching media items:', error);
          return [];
        }
        if (!data) return [];
        
        // Map all items and refresh URLs asynchronously
        const mappedItems = await Promise.all(data.map((item) => this.mapFromDb(item)));
        return mappedItems;
  },

  async getById(id: string): Promise<MediaItem | null> {
    if (!isSupabaseConfigured) {
      return null;
    }

    const { data, error } = await supabaseService
      .from(TABLES.MEDIA_ITEMS)
      .select('*')
      .eq('id', id)
      .single();

        if (error) {
          console.error('Error fetching media item:', error);
          return null;
        }
        return data ? await this.mapFromDb(data) : null;
  },

  async create(media: Omit<MediaItem, 'id' | 'createdAt'>): Promise<MediaItem | null> {
    if (!isSupabaseConfigured) {
      return null;
    }

    const now = new Date().toISOString();
    const { canineId, thumbnailUri, ...rest } = media;

    const { data, error } = await supabaseService
      .from(TABLES.MEDIA_ITEMS)
      .insert({
        canine_id: canineId,
        type: media.type,
        uri: media.uri,
        thumbnail_uri: thumbnailUri,
        caption: media.caption,
        date: media.date,
        created_at: now,
      })
      .select()
      .single();

        if (error) {
          console.error('Error creating media item:', error);
          return null;
        }
        return data ? await this.mapFromDb(data) : null;
  },

  async update(id: string, updates: Partial<MediaItem>): Promise<MediaItem | null> {
    if (!isSupabaseConfigured) {
      return null;
    }
    const { canineId, thumbnailUri, createdAt, ...rest } = updates as any;

    const dbUpdates: any = {
      ...rest,
    };

    if (canineId !== undefined) dbUpdates.canine_id = canineId;
    if (thumbnailUri !== undefined) dbUpdates.thumbnail_uri = thumbnailUri;

    const { data, error } = await supabaseService
      .from(TABLES.MEDIA_ITEMS)
      .update(dbUpdates)
      .eq('id', id)
      .select()
      .single();

        if (error) {
          console.error('Error updating media item:', error);
          return null;
        }
        return data ? await this.mapFromDb(data) : null;
  },

  async delete(id: string): Promise<boolean> {
    if (!isSupabaseConfigured) {
      return false;
    }

    const { error } = await supabaseService.from(TABLES.MEDIA_ITEMS).delete().eq('id', id);

    if (error) {
      console.error('Error deleting media item:', error);
      return false;
    }
    return true;
  },

      async mapFromDb(data: any): Promise<MediaItem> {
        // For private buckets, we need to refresh URLs if they're expired or public URLs
        let uri = data.uri;
        
        // If the URI is a Supabase Storage URL and bucket is private, refresh it
        if (isSupabaseConfigured && uri && uri.includes('supabase.co/storage')) {
          const filePath = extractFilePathFromUrl(uri);
          if (filePath) {
            try {
              // Get a fresh signed URL (works for private buckets)
              uri = await getFileUrl(filePath);
            } catch (error) {
              console.warn('Failed to refresh media URL, using original:', error);
              // Keep the original URI if refresh fails
            }
          }
        }

        return {
          id: data.id,
          canineId: data.canine_id,
          type: data.type,
          uri,
          thumbnailUri: data.thumbnail_uri,
          caption: data.caption,
          date: data.date,
          createdAt: data.created_at,
        };
      },
};

// ============================================================================
// Medical Record Operations
// ============================================================================

function mapAttachmentsFromDb(value: any): MedicalAttachment[] {
  if (!value) return [];
  if (Array.isArray(value)) return value as MedicalAttachment[];
  try {
    const parsed = typeof value === 'string' ? JSON.parse(value) : value;
    return Array.isArray(parsed) ? (parsed as MedicalAttachment[]) : [];
  } catch {
    return [];
  }
}

function mapAttachmentsToDb(attachments: MedicalAttachment[]): any {
  return attachments;
}

export const medicalRecordService = {
  async getAll(canineId?: string): Promise<MedicalRecord[]> {
    if (!isSupabaseConfigured) {
      return [];
    }

    let query = supabaseService.from(TABLES.MEDICAL_RECORDS).select('*');
    if (canineId) {
      query = query.eq('canine_id', canineId);
    }

    const { data, error } = await query.order('created_at', { ascending: false });
    if (error) {
      console.error('Error fetching medical records:', error);
      return [];
    }
    return data ? data.map(this.mapFromDb) : [];
  },

  async create(record: Omit<MedicalRecord, 'id' | 'createdAt' | 'updatedAt'>): Promise<MedicalRecord | null> {
    if (!isSupabaseConfigured) {
      return null;
    }

    const now = new Date().toISOString();
    const { data, error } = await supabaseService
      .from(TABLES.MEDICAL_RECORDS)
      .insert({
        canine_id: record.canineId,
        vet_name: record.vetName,
        clinic_name: record.clinicName,
        report_type: record.reportType,
        report_date: record.reportDate || null,
        notes: record.notes || null,
        attachments: mapAttachmentsToDb(record.attachments),
        created_at: now,
        updated_at: now,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating medical record:', error);
      return null;
    }
    return data ? this.mapFromDb(data) : null;
  },

  async update(id: string, updates: Partial<MedicalRecord>): Promise<MedicalRecord | null> {
    if (!isSupabaseConfigured) {
      return null;
    }

    const {
      canineId,
      vetName,
      clinicName,
      reportType,
      reportDate,
      notes,
      attachments,
      createdAt,
      updatedAt,
    } = updates as any;

    const dbUpdates: any = {
      updated_at: new Date().toISOString(),
    };

    if (canineId !== undefined) dbUpdates.canine_id = canineId;
    if (vetName !== undefined) dbUpdates.vet_name = vetName;
    if (clinicName !== undefined) dbUpdates.clinic_name = clinicName;
    if (reportType !== undefined) dbUpdates.report_type = reportType;
    if (reportDate !== undefined) dbUpdates.report_date = reportDate;
    if (notes !== undefined) dbUpdates.notes = notes;
    if (attachments !== undefined) dbUpdates.attachments = mapAttachmentsToDb(attachments);

    const { data, error } = await supabaseService
      .from(TABLES.MEDICAL_RECORDS)
      .update(dbUpdates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating medical record:', error);
      return null;
    }
    return data ? this.mapFromDb(data) : null;
  },

  async delete(id: string): Promise<boolean> {
    if (!isSupabaseConfigured) {
      return true;
    }

    const { error } = await supabaseService.from(TABLES.MEDICAL_RECORDS).delete().eq('id', id);
    if (error) {
      console.error('Error deleting medical record:', error);
      return false;
    }
    return true;
  },

  mapFromDb(data: any): MedicalRecord {
    return {
      id: data.id,
      canineId: data.canine_id,
      vetName: data.vet_name,
      clinicName: data.clinic_name,
      reportType: data.report_type,
      reportDate: data.report_date || undefined,
      notes: data.notes || undefined,
      attachments: mapAttachmentsFromDb(data.attachments),
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    };
  },
};

export const medicationService = {
  async getAll(canineId?: string): Promise<MedicationEntry[]> {
    if (!isSupabaseConfigured) {
      return [];
    }

    let query = supabaseService.from(TABLES.MEDICATIONS).select('*');
    if (canineId) {
      query = query.eq('canine_id', canineId);
    }

    const { data, error } = await query.order('created_at', { ascending: false });
    if (error) {
      console.error('Error fetching medications:', error);
      return [];
    }
    return data ? data.map(this.mapFromDb) : [];
  },

  async getById(id: string): Promise<MedicationEntry | null> {
    if (!isSupabaseConfigured) {
      return null;
    }

    const { data, error } = await supabaseService
      .from(TABLES.MEDICATIONS)
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error('Error fetching medication entry:', error);
      return null;
    }
    return data ? this.mapFromDb(data) : null;
  },

  async create(entry: Omit<MedicationEntry, 'id' | 'createdAt' | 'updatedAt'>): Promise<MedicationEntry | null> {
    if (!isSupabaseConfigured) {
      return null;
    }

    const now = new Date().toISOString();
    const { data, error } = await supabaseService
      .from(TABLES.MEDICATIONS)
      .insert({
        canine_id: entry.canineId,
        vet_id: entry.vetId ?? null,
        vet_name: entry.vetName,
        medication_name: entry.medicationName,
        reason: entry.reason,
        description: entry.description ?? null,
        quantity: entry.quantity,
        dosage_unit: entry.dosageUnit,
        frequency: entry.frequency,
        start_date: entry.startDate,
        start_time: entry.startTime ?? null,
        end_date: entry.endDate ?? null,
        notes: entry.notes ?? null,
        created_at: now,
        updated_at: now,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating medication entry:', error);
      return null;
    }
    return data ? this.mapFromDb(data) : null;
  },

  async update(id: string, updates: Partial<MedicationEntry>): Promise<MedicationEntry | null> {
    if (!isSupabaseConfigured) {
      return null;
    }

    const {
      canineId,
      vetId,
      vetName,
      medicationName,
      reason,
      description,
      quantity,
      dosageUnit,
      frequency,
      startDate,
      startTime,
      endDate,
      notes,
    } = updates as any;

    const dbUpdates: Record<string, any> = {
      updated_at: new Date().toISOString(),
    };

    if (canineId !== undefined) dbUpdates.canine_id = canineId;
    if (vetId !== undefined) dbUpdates.vet_id = vetId ?? null;
    if (vetName !== undefined) dbUpdates.vet_name = vetName;
    if (medicationName !== undefined) dbUpdates.medication_name = medicationName;
    if (reason !== undefined) dbUpdates.reason = reason;
    if (description !== undefined) dbUpdates.description = description ?? null;
    if (quantity !== undefined) dbUpdates.quantity = quantity;
    if (dosageUnit !== undefined) dbUpdates.dosage_unit = dosageUnit;
    if (frequency !== undefined) dbUpdates.frequency = frequency;
    if (startDate !== undefined) dbUpdates.start_date = startDate;
    if (startTime !== undefined) dbUpdates.start_time = startTime ?? null;
    if (endDate !== undefined) dbUpdates.end_date = endDate ?? null;
    if (notes !== undefined) dbUpdates.notes = notes ?? null;

    const { data, error } = await supabaseService
      .from(TABLES.MEDICATIONS)
      .update(dbUpdates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating medication entry:', error);
      return null;
    }
    return data ? this.mapFromDb(data) : null;
  },

  async delete(id: string): Promise<boolean> {
    if (!isSupabaseConfigured) {
      return true;
    }

    const { error } = await supabaseService.from(TABLES.MEDICATIONS).delete().eq('id', id);
    if (error) {
      console.error('Error deleting medication entry:', error);
      return false;
    }
    return true;
  },

  mapFromDb(data: any): MedicationEntry {
    return {
      id: data.id,
      canineId: data.canine_id,
      vetId: data.vet_id ?? undefined,
      vetName: data.vet_name,
      medicationName: data.medication_name,
      reason: data.reason ?? '',
      description: data.description ?? undefined,
      quantity: typeof data.quantity === 'number' ? data.quantity : Number(data.quantity) || 0,
      dosageUnit: data.dosage_unit ?? '',
      frequency: data.frequency ?? '',
      startDate: data.start_date,
      startTime: data.start_time ?? undefined,
      endDate: data.end_date ?? undefined,
      notes: data.notes ?? undefined,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    };
  },
};

export const vetVisitService = {
  async getAll(canineId?: string): Promise<VetVisit[]> {
    if (!isSupabaseConfigured) {
      return [];
    }

    let query = supabaseService.from(TABLES.VET_VISITS).select('*');
    if (canineId) {
      query = query.eq('canine_id', canineId);
    }

    const { data, error } = await query.order('visit_date', { ascending: false });
    if (error) {
      console.error('Error fetching vet visits:', error);
      return [];
    }
    return data ? data.map(this.mapFromDb) : [];
  },

  async create(visit: Omit<VetVisit, 'id' | 'createdAt' | 'updatedAt'>): Promise<VetVisit | null> {
    if (!isSupabaseConfigured) {
      return null;
    }

    const now = new Date().toISOString();
    const { data, error } = await supabaseService
      .from(TABLES.VET_VISITS)
      .insert({
        canine_id: visit.canineId,
        vet_id: visit.vetId ?? null,
        vet_name: visit.vetName,
        reason: visit.reason,
        end_results: visit.endResults,
        visit_date: visit.visitDate,
        notes: visit.notes ?? null,
        created_at: now,
        updated_at: now,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating vet visit:', error);
      return null;
    }
    return data ? this.mapFromDb(data) : null;
  },

  async update(id: string, updates: Partial<VetVisit>): Promise<VetVisit | null> {
    if (!isSupabaseConfigured) {
      return null;
    }

    const { canineId, vetId, vetName, reason, endResults, visitDate, notes } = updates as any;

    const dbUpdates: Record<string, any> = {
      updated_at: new Date().toISOString(),
    };

    if (canineId !== undefined) dbUpdates.canine_id = canineId;
    if (vetId !== undefined) dbUpdates.vet_id = vetId ?? null;
    if (vetName !== undefined) dbUpdates.vet_name = vetName;
    if (reason !== undefined) dbUpdates.reason = reason;
    if (endResults !== undefined) dbUpdates.end_results = endResults;
    if (visitDate !== undefined) dbUpdates.visit_date = visitDate;
    if (notes !== undefined) dbUpdates.notes = notes ?? null;

    const { data, error } = await supabaseService
      .from(TABLES.VET_VISITS)
      .update(dbUpdates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating vet visit:', error);
      return null;
    }
    return data ? this.mapFromDb(data) : null;
  },

  async delete(id: string): Promise<boolean> {
    if (!isSupabaseConfigured) {
      return true;
    }

    const { error } = await supabaseService.from(TABLES.VET_VISITS).delete().eq('id', id);
    if (error) {
      console.error('Error deleting vet visit:', error);
      return false;
    }
    return true;
  },

  mapFromDb(data: any): VetVisit {
    return {
      id: data.id,
      canineId: data.canine_id,
      vetId: data.vet_id ?? undefined,
      vetName: data.vet_name,
      reason: data.reason,
      endResults: data.end_results,
      visitDate: data.visit_date,
      notes: data.notes ?? undefined,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    };
  },
};

export const immunizationService = {
  async getAll(canineId?: string): Promise<ImmunizationRecord[]> {
    if (!isSupabaseConfigured) {
      return [];
    }

    let query = supabaseService.from(TABLES.IMMUNIZATIONS).select('*');
    if (canineId) {
      query = query.eq('canine_id', canineId);
    }

    const { data, error } = await query.order('immunization_date', { ascending: false });
    if (error) {
      console.error('Error fetching immunizations:', error);
      return [];
    }
    return data ? data.map(this.mapFromDb) : [];
  },

  async create(record: Omit<ImmunizationRecord, 'id' | 'createdAt' | 'updatedAt'>): Promise<ImmunizationRecord | null> {
    if (!isSupabaseConfigured) {
      return null;
    }

    const now = new Date().toISOString();
    const { data, error } = await supabaseService
      .from(TABLES.IMMUNIZATIONS)
      .insert({
        canine_id: record.canineId,
        vet_id: record.vetId ?? null,
        vet_name: record.vetName,
        vaccine_name: record.vaccineName,
        age_years: record.ageYears,
        age_months: record.ageMonths,
        immunization_date: record.immunizationDate,
        last_vaccinated_date: record.lastVaccinatedDate,
        notes: record.notes ?? null,
        created_at: now,
        updated_at: now,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating immunization record:', error);
      return null;
    }
    return data ? this.mapFromDb(data) : null;
  },

  async update(id: string, updates: Partial<ImmunizationRecord>): Promise<ImmunizationRecord | null> {
    if (!isSupabaseConfigured) {
      return null;
    }

    const {
      canineId,
      vetId,
      vetName,
      vaccineName,
      ageYears,
      ageMonths,
      immunizationDate,
      lastVaccinatedDate,
      notes,
    } = updates as any;

    const dbUpdates: Record<string, any> = {
      updated_at: new Date().toISOString(),
    };

    if (canineId !== undefined) dbUpdates.canine_id = canineId;
    if (vetId !== undefined) dbUpdates.vet_id = vetId ?? null;
    if (vetName !== undefined) dbUpdates.vet_name = vetName;
    if (vaccineName !== undefined) dbUpdates.vaccine_name = vaccineName;
    if (ageYears !== undefined) dbUpdates.age_years = ageYears;
    if (ageMonths !== undefined) dbUpdates.age_months = ageMonths;
    if (immunizationDate !== undefined) dbUpdates.immunization_date = immunizationDate;
    if (lastVaccinatedDate !== undefined) dbUpdates.last_vaccinated_date = lastVaccinatedDate;
    if (notes !== undefined) dbUpdates.notes = notes ?? null;

    const { data, error } = await supabaseService
      .from(TABLES.IMMUNIZATIONS)
      .update(dbUpdates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating immunization record:', error);
      return null;
    }
    return data ? this.mapFromDb(data) : null;
  },

  async delete(id: string): Promise<boolean> {
    if (!isSupabaseConfigured) {
      return true;
    }

    const { error } = await supabaseService.from(TABLES.IMMUNIZATIONS).delete().eq('id', id);
    if (error) {
      console.error('Error deleting immunization record:', error);
      return false;
    }
    return true;
  },

  mapFromDb(data: any): ImmunizationRecord {
    return {
      id: data.id,
      canineId: data.canine_id,
      vetId: data.vet_id ?? undefined,
      vetName: data.vet_name,
      vaccineName: data.vaccine_name,
      ageYears: Number(data.age_years) || 0,
      ageMonths: Number(data.age_months) || 0,
      immunizationDate: data.immunization_date,
      lastVaccinatedDate: data.last_vaccinated_date,
      notes: data.notes ?? undefined,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    };
  },
};

export const canineAllergyService = {
  async getAll(canineId?: string): Promise<CanineAllergy[]> {
    if (!isSupabaseConfigured) {
      return [];
    }

    let query = supabaseService.from(TABLES.CANINE_ALLERGIES).select('*');
    if (canineId) {
      query = query.eq('canine_id', canineId);
    }

    const { data, error } = await query.order('food_type', { ascending: true });
    if (error) {
      console.error('Error fetching canine allergies:', error);
      return [];
    }
    return data ? data.map(this.mapFromDb) : [];
  },

  async create(allergy: Omit<CanineAllergy, 'id' | 'createdAt' | 'updatedAt'>): Promise<CanineAllergy | null> {
    if (!isSupabaseConfigured) {
      return null;
    }

    const now = new Date().toISOString();
    const { data, error } = await supabaseService
      .from(TABLES.CANINE_ALLERGIES)
      .insert({
        canine_id: allergy.canineId,
        food_type: allergy.foodType,
        name: allergy.name,
        created_at: now,
        updated_at: now,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating canine allergy:', error);
      return null;
    }
    return data ? this.mapFromDb(data) : null;
  },

  async update(id: string, updates: Partial<CanineAllergy>): Promise<CanineAllergy | null> {
    if (!isSupabaseConfigured) {
      return null;
    }

    const { canineId, foodType, name } = updates as any;
    const dbUpdates: Record<string, any> = {
      updated_at: new Date().toISOString(),
    };

    if (canineId !== undefined) dbUpdates.canine_id = canineId;
    if (foodType !== undefined) dbUpdates.food_type = foodType;
    if (name !== undefined) dbUpdates.name = name;

    const { data, error } = await supabaseService
      .from(TABLES.CANINE_ALLERGIES)
      .update(dbUpdates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating canine allergy:', error);
      return null;
    }
    return data ? this.mapFromDb(data) : null;
  },

  async delete(id: string): Promise<boolean> {
    if (!isSupabaseConfigured) {
      return false;
    }

    const { error } = await supabaseService.from(TABLES.CANINE_ALLERGIES).delete().eq('id', id);
    if (error) {
      console.error('Error deleting canine allergy:', error);
      return false;
    }
    return true;
  },

  mapFromDb(data: any): CanineAllergy {
    return {
      id: data.id,
      canineId: data.canine_id,
      foodType: data.food_type ?? 'Food',
      name: data.name ?? '',
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    };
  },
};

