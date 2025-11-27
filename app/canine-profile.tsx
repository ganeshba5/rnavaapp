import { ReactNode, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
  Animated,
  Easing,
  ActionSheetIOS,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { Image } from 'expo-image';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useApp } from '@/context/AppContext';
import { CanineProfile } from '@/types';
import { uploadMediaToSupabase, deleteMediaFromSupabase, extractFilePathFromUrl } from '@/services/storage';
import type { MediaItem } from '@/types';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { NUTRITION_DAY_COUNT } from '@/constants/nutrition';

const HERO_HEIGHT = Math.min(Dimensions.get('window').height * 0.35, 320);
const TAB_ITEMS = [
  { key: 'vet', label: 'Vet Profile', icon: 'cross.case.fill' },
  { key: 'schedule', label: 'Canine Schedule', icon: 'calendar' },
  { key: 'nutrition', label: 'Nutrition', icon: 'leaf.fill' },
  { key: 'training', label: 'Training', icon: 'star.fill' },
  { key: 'media', label: 'Media', icon: 'photo.on.rectangle' },
] as const;
type TabKey = (typeof TAB_ITEMS)[number]['key'];
type PetNote = {
  id: string;
  content: string;
  createdAt: string;
  updatedAt: string;
};
type VetSectionKey = 'medical' | 'medications' | 'visits' | 'immunization' | 'appointments';
type OverlayTab = TabKey | null;

const formatDateSafe = (value?: string) => {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString();
};

const formatTimeSafe = (value?: string) => {
  if (!value) return '—';
  return value.length > 5 ? value.slice(0, 5) : value;
};

const formatTimestampSafe = (value?: string) => {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return `${date.toLocaleDateString()} ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
};

const buildNutritionDateWindow = (count: number) => {
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  return Array.from({ length: count }, (_, index) => {
    const next = new Date(start);
    next.setDate(start.getDate() + index);
    return next.toISOString().split('T')[0];
  });
};

const formatNutritionChipLabel = (value: string) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  const month = date.toLocaleString(undefined, { month: 'short' });
  const day = date.getDate().toString().padStart(2, '0');
  return `${month} ${day}`;
};

const formatNutritionCalendarBadge = (value?: string) => {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString(undefined, { day: '2-digit', month: '2-digit', year: 'numeric' });
};

export default function CanineProfileScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const params = useLocalSearchParams<{ id?: string }>();
  const {
    userProfile,
    canines,
    vets,
    appointments,
    nutritionEntries,
    trainingLogs,
    mediaItems,
    addCanine,
    updateCanine,
    deleteCanine,
    addMediaItem,
    deleteMediaItem,
    medicalRecords,
    medications,
    vetVisits,
    immunizations,
    deleteAppointment,
    deleteNutritionEntry,
    getCanineAllergiesByCanine,
    deleteCanineAllergy,
  } = useApp();

  const existingCanine = params.id ? canines.find((c) => c.id === params.id) : null;
  const [isEditing, setIsEditing] = useState(!existingCanine);
  const [isUploading, setIsUploading] = useState(false);
  const [activeTab, setActiveTab] = useState<TabKey | null>(null);
  const [formData, setFormData] = useState<Partial<CanineProfile>>({
    userId: userProfile?.id || '',
    name: '',
    breed: '',
    dateOfBirth: '',
    gender: 'Unknown',
    weight: undefined,
    weightUnit: 'lbs',
    color: '',
    microchipNumber: '',
    profilePhotoId: undefined,
    notes: '',
  });

  const canineMedia = existingCanine
    ? mediaItems.filter((m) => m.canineId === existingCanine.id)
    : [];
  const canineMedicalRecords = useMemo(
    () =>
      existingCanine
        ? medicalRecords
            .filter((record) => record.canineId === existingCanine.id)
            .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        : [],
    [medicalRecords, existingCanine?.id]
  );
  const [activeOverlayTab, setActiveOverlayTab] = useState<OverlayTab>(null);
  const overlayAnim = useRef(new Animated.Value(0)).current;
  const [activeVetSection, setActiveVetSection] = useState<VetSectionKey | null>(null);
  const [medicalSearch, setMedicalSearch] = useState('');
  const [medicationSearch, setMedicationSearch] = useState('');
  const [visitSearch, setVisitSearch] = useState('');
  const [immunizationSearch, setImmunizationSearch] = useState('');
  const [scheduleSearch, setScheduleSearch] = useState('');
  const [petNotes, setPetNotes] = useState<PetNote[]>([]);
  const [noteMenuForId, setNoteMenuForId] = useState<string | null>(null);
  const [infoMenuVisible, setInfoMenuVisible] = useState(false);
  const [noteQuickActionsVisible, setNoteQuickActionsVisible] = useState(false);
  const [noteListVisible, setNoteListVisible] = useState(false);
  const [noteModalVisible, setNoteModalVisible] = useState(false);
  const [noteDraft, setNoteDraft] = useState('');
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const noteMenuTarget = noteMenuForId
    ? petNotes.find((note) => note.id === noteMenuForId) ?? null
    : null;
  const insets = useSafeAreaInsets();
  const vetOptions = useMemo(
    () => [
      { key: 'medical' as VetSectionKey, title: 'Medical Records', icon: 'doc.text.fill', accent: '#E0F2FE' },
      { key: 'medications' as VetSectionKey, title: 'Medications/Vitamins', icon: 'pills', accent: '#FEF3C7' },
      { key: 'visits' as VetSectionKey, title: 'Vet Visits', icon: 'mappin.and.ellipse', accent: '#E0E7FF' },
      { key: 'immunization' as VetSectionKey, title: 'Immunization', icon: 'syringe', accent: '#FCE7F3' },
      { key: 'appointments' as VetSectionKey, title: 'Appointments', icon: 'calendar', accent: '#DCFCE7' },
    ],
    []
  );

  const filteredNutrition = useMemo(
    () =>
      nutritionEntries
        .filter((entry) => entry.canineId === existingCanine?.id)
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()),
    [nutritionEntries, existingCanine?.id]
  );

  const nutritionDateWindow = useMemo(() => buildNutritionDateWindow(NUTRITION_DAY_COUNT), []);
  const [selectedNutritionDate, setSelectedNutritionDate] = useState(() =>
    nutritionDateWindow[0] ?? new Date().toISOString().split('T')[0]
  );

  useEffect(() => {
    if (!nutritionDateWindow.includes(selectedNutritionDate)) {
      setSelectedNutritionDate(nutritionDateWindow[0] ?? new Date().toISOString().split('T')[0]);
    }
  }, [nutritionDateWindow, selectedNutritionDate]);

  const mealsForSelectedDate = useMemo(
    () => filteredNutrition.filter((entry) => entry.date === selectedNutritionDate),
    [filteredNutrition, selectedNutritionDate]
  );

  const allergiesForCanine = useMemo(() => {
    if (!existingCanine?.id) return [];
    return [...getCanineAllergiesByCanine(existingCanine.id)].sort(
      (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    );
  }, [existingCanine?.id, getCanineAllergiesByCanine]);

  useEffect(() => {
    if (existingCanine) {
      setFormData(existingCanine);
    }
  }, [existingCanine]);

  useEffect(() => {
    if (existingCanine?.notes) {
      try {
        const parsed = JSON.parse(existingCanine.notes);
        if (Array.isArray(parsed)) {
          const normalized = parsed
            .filter((note) => note && typeof note.content === 'string')
            .map((note) => ({
              id: note.id ?? `note-${Date.now()}-${Math.random().toString(36).slice(2)}`,
              content: note.content,
              createdAt: note.createdAt ?? new Date().toISOString(),
              updatedAt: note.updatedAt ?? new Date().toISOString(),
            }));
          setPetNotes(normalized);
          return;
        }
      } catch (error) {
        // Fallback to plain text parsing below
      }
      const fallback = existingCanine.notes
        .split('\n')
        .map((entry) => entry.trim())
        .filter(Boolean)
        .map((content, index) => ({
          id: `note-${index}-${Date.now()}`,
          content,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        }));
      setPetNotes(fallback);
    } else {
      setPetNotes([]);
    }
  }, [existingCanine?.notes]);

  useEffect(() => {
    setFormData((prev) => ({
      ...(prev ?? {}),
      notes: petNotes.length > 0 ? JSON.stringify(petNotes) : '',
    }));
  }, [petNotes]);

  useEffect(() => {
    if (!activeOverlayTab) {
      setActiveVetSection(null);
    }
  }, [activeOverlayTab]);

  useEffect(() => {
    if (activeVetSection !== 'medications') {
      setMedicationSearch('');
    }
    if (activeVetSection !== 'visits') {
      setVisitSearch('');
    }
    if (activeVetSection !== 'immunization') {
      setImmunizationSearch('');
    }
    if (activeVetSection !== 'schedule') {
      setScheduleSearch('');
    }
  }, [activeVetSection]);

  const persistNotes = (nextNotes: PetNote[]) => {
    setPetNotes(nextNotes);
    if (existingCanine) {
      void updateCanine(existingCanine.id, { notes: nextNotes.length > 0 ? JSON.stringify(nextNotes) : '' });
    }
  };

  const heroImage = useMemo(() => {
    if (existingCanine?.profilePhotoId) {
      const profileMedia = mediaItems.find((m) => m.id === existingCanine.profilePhotoId);
      if (profileMedia) return profileMedia.uri;
    }
    return undefined;
  }, [existingCanine?.profilePhotoId, canineMedia, mediaItems]);

  const ageDisplay = useMemo(() => {
    if (!existingCanine?.dateOfBirth) return '—';
    const birth = new Date(existingCanine.dateOfBirth);
    if (Number.isNaN(birth.getTime())) return '—';
    const now = new Date();
    let years = now.getFullYear() - birth.getFullYear();
    let months = now.getMonth() - birth.getMonth();
    if (now.getDate() < birth.getDate()) months -= 1;
    if (months < 0) {
      years -= 1;
      months += 12;
    }
    return `${Math.max(years, 0)} Yr ${Math.max(months, 0)} M`;
  }, [existingCanine?.dateOfBirth]);

  const infoMetrics = useMemo(() => {
    const metrics: { label: string; value: string }[] = [];
    metrics.push({ label: 'Age', value: ageDisplay });

    const weightValue = existingCanine?.weight ?? formData.weight;
    const weightUnit = existingCanine?.weightUnit ?? formData.weightUnit ?? '';
    const hasWeightValue =
      typeof weightValue === 'number'
        ? !Number.isNaN(weightValue)
        : typeof weightValue === 'string' && weightValue.trim().length > 0;
    metrics.push({
      label: 'Weight',
      value: hasWeightValue ? `${weightValue}${weightUnit ? ` ${weightUnit}` : ''}` : '—',
    });

    const breedValue = existingCanine?.breed ?? formData.breed;
    metrics.push({ label: 'Breed', value: breedValue && breedValue.length > 0 ? breedValue : 'Unknown' });

    const genderValue = existingCanine?.gender ?? formData.gender;
    metrics.push({ label: 'Gender', value: genderValue && genderValue.length > 0 ? genderValue : 'Unknown' });

    const colorValue = existingCanine?.color ?? formData.color;
    if (colorValue && colorValue.trim().length > 0) {
      metrics.push({ label: 'Color', value: colorValue.trim() });
    }

    return metrics;
  }, [ageDisplay, existingCanine?.weight, existingCanine?.weightUnit, existingCanine?.breed, existingCanine?.gender, existingCanine?.color, formData.weight, formData.weightUnit, formData.breed, formData.gender, formData.color]);

  const handleSave = () => {
    if (!formData.name) {
      Alert.alert('Error', 'Please enter a name');
      return;
    }

    if (!formData.userId) {
      Alert.alert('Error', 'User ID is required');
      return;
    }

    if (existingCanine) {
      updateCanine(existingCanine.id, formData);
      Alert.alert('Success', 'Canine profile updated successfully');
    } else {
      addCanine(formData as Omit<CanineProfile, 'id' | 'createdAt' | 'updatedAt'>);
      Alert.alert('Success', 'Canine profile created successfully');
      router.back();
    }
    setIsEditing(false);
  };

  const handleEditFromMenu = () => {
    setInfoMenuVisible(false);
    setIsEditing(true);
  };

  const handleDelete = () => {
    if (!existingCanine) return;

    setInfoMenuVisible(false);
    Alert.alert('Delete Pet', 'Are you sure you want to delete this pet? This action cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => {
          deleteCanine(existingCanine.id);
          Alert.alert('Success', 'Pet deleted successfully');
          router.back();
        },
      },
    ]);
  };

  const handleDeleteMedia = async (mediaId: string) => {
    const mediaItem = mediaItems.find((m) => m.id === mediaId);
    if (!mediaItem) return;

    Alert.alert('Delete Media', 'Remove this media item?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            const filePath = extractFilePathFromUrl(mediaItem.uri);
            if (filePath) {
              await deleteMediaFromSupabase(filePath);
            }
            await deleteMediaItem(mediaId);
            if (existingCanine?.profilePhotoId === mediaId) {
              await updateCanine(existingCanine.id, { profilePhotoId: undefined });
            }
            Alert.alert('Deleted', 'Media item removed');
          } catch (error) {
            console.error('Error deleting media:', error);
            Alert.alert('Error', 'Unable to delete media. Please try again.');
          }
        },
      },
    ]);
  };

  const openNoteModal = (note?: PetNote) => {
    setNoteQuickActionsVisible(false);
    if (note) {
      setEditingNoteId(note.id);
      setNoteDraft(note.content);
    } else {
      setEditingNoteId(null);
      setNoteDraft('');
    }
    setNoteModalVisible(true);
    setNoteMenuForId(null);
  };

  const closeNoteModal = () => {
    setNoteModalVisible(false);
    setNoteDraft('');
    setEditingNoteId(null);
  };

  const handleSaveNoteDraft = () => {
    const trimmed = noteDraft.trim();
    if (!trimmed) {
      Alert.alert('Note Required', 'Please enter some text for the note.');
      return;
    }

    const now = new Date().toISOString();
    let nextNotes: PetNote[];
    if (editingNoteId) {
      nextNotes = petNotes.map((note) =>
        note.id === editingNoteId
          ? {
              ...note,
              content: trimmed,
              updatedAt: now,
            }
          : note
      );
    } else {
      nextNotes = [
        ...petNotes,
        {
          id: `note-${Date.now()}-${Math.random().toString(36).slice(2)}`,
          content: trimmed,
          createdAt: now,
          updatedAt: now,
        },
      ];
    }

    persistNotes(nextNotes);

    closeNoteModal();
  };

  const handleDeleteNote = (noteId: string) => {
    Alert.alert('Delete Note', 'Are you sure you want to delete this note?', [
      { text: 'Cancel', style: 'cancel', onPress: () => setNoteMenuForId(null) },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => {
          const nextNotes = petNotes.filter((note) => note.id !== noteId);
          persistNotes(nextNotes);
          setNoteMenuForId(null);
        },
      },
    ]);
  };

  const openTabOverlay = (tab: TabKey) => {
    overlayAnim.setValue(0);
    setActiveOverlayTab(tab);
    Animated.timing(overlayAnim, {
      toValue: 1,
      duration: 280,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  };

  const closeTabOverlay = (onFinished?: () => void) => {
    if (activeOverlayTab === 'schedule') {
      setScheduleSearch('');
    }
    Animated.timing(overlayAnim, {
      toValue: 0,
      duration: 220,
      easing: Easing.in(Easing.cubic),
      useNativeDriver: true,
    }).start(({ finished }) => {
      if (finished) {
        setActiveOverlayTab(null);
        setActiveTab(null);
        setActiveVetSection(null);
        onFinished?.();
      }
    });
  };

  const handleOverlayBack = () => {
    if (activeOverlayTab === 'vet' && activeVetSection) {
      setActiveVetSection(null);
      return;
    }
    closeTabOverlay();
  };

  const handleTabPress = (tab: TabKey) => {
    setActiveTab(tab);
    openTabOverlay(tab);
  };

  const navigateAfterClose = (href: string) => {
    closeTabOverlay(() => router.push(href as any));
  };

  const handleMedicalAdd = () => {
    if (!existingCanine) {
      Alert.alert('Save Pet First', 'Please save the pet profile before adding medical records.');
      return;
    }
    navigateAfterClose(`/(tabs)/medical-records/create?canineId=${existingCanine.id}`);
  };

  const handleNutritionAdd = () => {
    if (!existingCanine) {
      Alert.alert('Save Pet First', 'Please save the pet profile before adding nutrition plans.');
      return;
    }
    navigateAfterClose(`/(tabs)/nutrition/create-plan?canineId=${existingCanine.id}`);
  };

  const handleNutritionSeeAll = () => {
    if (!existingCanine) {
      Alert.alert('Save Pet First', 'Please save the pet profile before viewing nutrition plans.');
      return;
    }
    navigateAfterClose(`/(tabs)/nutrition/schedule?canineId=${existingCanine.id}`);
  };

  const handleNutritionEdit = (entryId: string) => {
    if (!existingCanine) return;
    navigateAfterClose(`/(tabs)/nutrition/create-plan?canineId=${existingCanine.id}&recordId=${entryId}`);
  };

  const handleNutritionDelete = (entryId: string) => {
    Alert.alert('Delete Meal', 'Remove this meal from the schedule?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteNutritionEntry(entryId);
          } catch (error) {
            console.error('Error deleting nutrition entry:', error);
            Alert.alert('Error', 'Unable to delete meal. Please try again.');
          }
        },
      },
    ]);
  };

  const openNutritionOptions = (entryId: string) => {
    if (!existingCanine) {
      Alert.alert('Save Pet First', 'Save the pet profile to manage meals.');
      return;
    }

    const presentDelete = () => handleNutritionDelete(entryId);
    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options: ['Cancel', 'Edit', 'Delete'],
          cancelButtonIndex: 0,
          destructiveButtonIndex: 2,
        },
        (index) => {
          if (index === 1) {
            handleNutritionEdit(entryId);
          } else if (index === 2) {
            presentDelete();
          }
        }
      );
    } else {
      Alert.alert('Meal Options', undefined, [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Edit', onPress: () => handleNutritionEdit(entryId) },
        { text: 'Delete', style: 'destructive', onPress: presentDelete },
      ]);
    }
  };

  const handleAllergiesSeeAll = () => {
    if (!existingCanine) {
      Alert.alert('Save Pet First', 'Please save the pet profile before viewing allergy records.');
      return;
    }
    navigateAfterClose(`/(tabs)/nutrition/allergies?canineId=${existingCanine.id}`);
  };

  const handleAllergyEdit = (recordId: string) => {
    if (!existingCanine) return;
    navigateAfterClose(`/(tabs)/nutrition/create-allergy?canineId=${existingCanine.id}&recordId=${recordId}`);
  };

  const handleAllergyDelete = (recordId: string) => {
    Alert.alert('Delete Allergy', 'Remove this item from the allergy list?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteCanineAllergy(recordId);
          } catch (error) {
            console.error('Error deleting allergy:', error);
            Alert.alert('Error', 'Unable to delete allergy. Please try again.');
          }
        },
      },
    ]);
  };

  const openAllergyOptions = (recordId: string) => {
    if (!existingCanine) {
      Alert.alert('Save Pet First', 'Save the pet profile to manage allergies.');
      return;
    }

    const presentDelete = () => handleAllergyDelete(recordId);
    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options: ['Cancel', 'Edit', 'Delete'],
          cancelButtonIndex: 0,
          destructiveButtonIndex: 2,
        },
        (index) => {
          if (index === 1) {
            handleAllergyEdit(recordId);
          } else if (index === 2) {
            presentDelete();
          }
        }
      );
    } else {
      Alert.alert('Allergy Options', undefined, [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Edit', onPress: () => handleAllergyEdit(recordId) },
        { text: 'Delete', style: 'destructive', onPress: presentDelete },
      ]);
    }
  };

  const handleTrainingAdd = () => {
    navigateAfterClose('/(tabs)/training?mode=add');
  };

  const handleMedicationAdd = () => {
    if (!existingCanine) {
      Alert.alert('Save Pet First', 'Please save the pet profile before adding medications.');
      return;
    }
    navigateAfterClose(`/(tabs)/medications/create?canineId=${existingCanine.id}`);
  };

  const handleMedicationEdit = (entryId: string) => {
    if (!existingCanine) return;
    navigateAfterClose(`/(tabs)/medications/create?canineId=${existingCanine.id}&entryId=${entryId}`);
  };

  const handleMedicationSeeAll = () => {
    if (!existingCanine) {
      Alert.alert('Save Pet First', 'Please save the pet profile before viewing medications.');
      return;
    }
    navigateAfterClose(`/(tabs)/medications?canineId=${existingCanine.id}`);
  };

  const handleVetVisitAdd = () => {
    if (!existingCanine) {
      Alert.alert('Save Pet First', 'Please save the pet profile before adding vet visits.');
      return;
    }
    navigateAfterClose(`/(tabs)/vet-visits/create?canineId=${existingCanine.id}`);
  };

  const handleVetVisitEdit = (visitId: string) => {
    if (!existingCanine) return;
    navigateAfterClose(`/(tabs)/vet-visits/create?canineId=${existingCanine.id}&visitId=${visitId}`);
  };

  const handleVetVisitSeeAll = () => {
    if (!existingCanine) {
      Alert.alert('Save Pet First', 'Please save the pet profile before viewing vet visits.');
      return;
    }
    navigateAfterClose(`/(tabs)/vet-visits?canineId=${existingCanine.id}`);
  };

  const handleImmunizationAdd = () => {
    if (!existingCanine) {
      Alert.alert('Save Pet First', 'Please save the pet profile before adding immunizations.');
      return;
    }
    navigateAfterClose(`/(tabs)/immunizations/create?canineId=${existingCanine.id}`);
  };

  const handleImmunizationEdit = (recordId: string) => {
    if (!existingCanine) return;
    navigateAfterClose(`/(tabs)/immunizations/create?canineId=${existingCanine.id}&recordId=${recordId}`);
  };

  const handleImmunizationSeeAll = () => {
    if (!existingCanine) {
      Alert.alert('Save Pet First', 'Please save the pet profile before viewing immunizations.');
      return;
    }
    navigateAfterClose(`/(tabs)/immunizations?canineId=${existingCanine.id}`);
  };

  const handleScheduleAdd = () => {
    if (!existingCanine) {
      Alert.alert('Save Pet First', 'Please save the pet profile before adding a schedule entry.');
      return;
    }
    navigateAfterClose(`/(tabs)/appointments/create?canineId=${existingCanine.id}`);
  };

  const handleScheduleEdit = (appointmentId: string) => {
    if (!existingCanine) return;
    navigateAfterClose(`/(tabs)/appointments/create?canineId=${existingCanine.id}&recordId=${appointmentId}`);
  };

  const handleScheduleDelete = async (appointmentId: string) => {
    try {
      await deleteAppointment(appointmentId);
    } catch (error) {
      console.error('Error deleting appointment:', error);
      Alert.alert('Error', 'Unable to delete appointment. Please try again.');
    }
  };

  const openScheduleOptions = (appointmentId: string) => {
    const presentDelete = () => {
      Alert.alert('Delete Appointment', 'Are you sure you want to delete this appointment?', [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => void handleScheduleDelete(appointmentId),
        },
      ]);
    };

    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options: ['Cancel', 'Edit', 'Delete'],
          cancelButtonIndex: 0,
          destructiveButtonIndex: 2,
        },
        (buttonIndex) => {
          if (buttonIndex === 1) {
            handleScheduleEdit(appointmentId);
          } else if (buttonIndex === 2) {
            presentDelete();
          }
        }
      );
    } else {
      Alert.alert('Appointment Options', undefined, [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Edit', onPress: () => handleScheduleEdit(appointmentId) },
        { text: 'Delete', style: 'destructive', onPress: presentDelete },
      ]);
    }
  };

  const handleMediaOptions = (media: MediaItem) => {
    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options: ['Cancel', 'Set as Profile Photo', 'Delete'],
          cancelButtonIndex: 0,
          destructiveButtonIndex: 2,
        },
        (buttonIndex) => {
          if (buttonIndex === 1) {
            handleSetProfilePhoto(media.id);
          } else if (buttonIndex === 2) {
            handleDeleteMedia(media.id);
          }
        }
      );
    } else {
      Alert.alert('Media Options', 'Choose an action', [
        {
          text: 'Set as Profile Photo',
          onPress: () => handleSetProfilePhoto(media.id),
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => handleDeleteMedia(media.id),
        },
        { text: 'Cancel', style: 'cancel' },
      ]);
    }
  };

  const handleSetProfilePhoto = async (mediaId: string) => {
    if (existingCanine) {
      await updateCanine(existingCanine.id, { profilePhotoId: mediaId });
      Alert.alert('Success', 'Profile photo updated');
    }
  };

  const requestLibraryPermission = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    return status === 'granted';
  };

  const launchImageLibrary = async () => {
    if (!existingCanine) return;

    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.All,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
        allowsMultipleSelection: false,
        videoMaxDuration: 60,
      });

      if (!result.canceled && result.assets?.length) {
        const asset = result.assets[0];
        const mediaType = asset.type === 'video' ? 'video' : 'photo';

        if (asset.fileSize) {
          const maxSize = mediaType === 'video' ? 100 * 1024 * 1024 : 50 * 1024 * 1024;
          if (asset.fileSize > maxSize) {
            const maxSizeMB = Math.round(maxSize / (1024 * 1024));
            const fileSizeMB = (asset.fileSize / (1024 * 1024)).toFixed(2);
            Alert.alert(
              'File Too Large',
              `File size (${fileSizeMB}MB) exceeds the maximum allowed size of ${maxSizeMB}MB. Please compress and try again.`
            );
            return;
          }
        }

        await uploadMedia(asset.uri, mediaType);
      }
    } catch (error) {
      console.error('Error picking media:', error);
      Alert.alert('Error', 'Failed to pick media. Please try again.');
    }
  };

  const handleAddMedia = async () => {
    if (!existingCanine) {
      Alert.alert('Save Pet First', 'Please save the profile before adding media.');
      return;
    }

    const granted = await requestLibraryPermission();
    if (!granted) {
      Alert.alert('Permission needed', 'Allow media library access to add photos and videos.');
      return;
    }

    await launchImageLibrary();
  };

  const uploadMedia = async (uri: string, type: 'photo' | 'video') => {
    if (!existingCanine) return;

    setIsUploading(true);
    try {
      const uploadedUrl = await uploadMediaToSupabase(uri, existingCanine.id, type);
      await addMediaItem({
        canineId: existingCanine.id,
        type,
        uri: uploadedUrl,
        caption: '',
        date: new Date().toISOString().split('T')[0],
      });
      Alert.alert('Success', 'Media uploaded successfully');
    } catch (error: any) {
      console.error('Error uploading media:', error);
      Alert.alert('Upload failed', error.message || 'Please try again later.');
    } finally {
      setIsUploading(false);
    }
  };

  const filteredAppointments = useMemo(
    () =>
      appointments
        .filter((a) => a.canineId === existingCanine?.id)
        .sort((a, b) => {
          const aDate = new Date(`${a.date}T${a.startTime || '00:00'}`);
          const bDate = new Date(`${b.date}T${b.startTime || '00:00'}`);
          return aDate.getTime() - bDate.getTime();
        }),
    [appointments, existingCanine?.id]
  );

  const searchedAppointments = useMemo(() => {
    const term = scheduleSearch.trim().toLowerCase();
    if (!term) return filteredAppointments;
    return filteredAppointments.filter((apt) =>
      [apt.title, apt.category, apt.description]
        .filter(Boolean)
        .some((value) => value!.toLowerCase().includes(term))
    );
  }, [filteredAppointments, scheduleSearch]);

  const filteredTraining = useMemo(
    () =>
      trainingLogs
        .filter((log) => log.canineId === existingCanine?.id)
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()),
    [trainingLogs, existingCanine?.id]
  );

  const filteredMedications = useMemo(
    () =>
      existingCanine
        ? medications
            .filter((med) => med.canineId === existingCanine.id)
            .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
        : [],
    [medications, existingCanine?.id]
  );

  const searchedMedications = useMemo(() => {
    const term = medicationSearch.trim().toLowerCase();
    if (!term) return filteredMedications;
    return filteredMedications.filter((med) =>
      [med.medicationName, med.vetName, med.reason, med.frequency]
        .filter(Boolean)
        .some((value) => value.toLowerCase().includes(term))
    );
  }, [filteredMedications, medicationSearch]);

  const filteredVetVisits = useMemo(
    () =>
      existingCanine
        ? vetVisits
            .filter((visit) => visit.canineId === existingCanine.id)
            .sort((a, b) => new Date(b.visitDate).getTime() - new Date(a.visitDate).getTime())
        : [],
    [vetVisits, existingCanine?.id]
  );

  const searchedVetVisits = useMemo(() => {
    const term = visitSearch.trim().toLowerCase();
    if (!term) return filteredVetVisits;
    return filteredVetVisits.filter((visit) =>
      [visit.vetName, visit.reason, visit.endResults]
        .filter(Boolean)
        .some((value) => value.toLowerCase().includes(term))
    );
  }, [filteredVetVisits, visitSearch]);

  const filteredImmunizations = useMemo(
    () =>
      existingCanine
        ? immunizations
            .filter((record) => record.canineId === existingCanine.id)
            .sort((a, b) => new Date(b.immunizationDate).getTime() - new Date(a.immunizationDate).getTime())
        : [],
    [immunizations, existingCanine?.id]
  );

  const searchedImmunizations = useMemo(() => {
    const term = immunizationSearch.trim().toLowerCase();
    if (!term) return filteredImmunizations;
    return filteredImmunizations.filter((record) =>
      [record.vetName, record.vaccineName]
        .filter(Boolean)
        .some((value) => value.toLowerCase().includes(term))
    );
  }, [filteredImmunizations, immunizationSearch]);

  const primaryVet = useMemo(() => {
    if (!existingCanine?.vetId) return null;
    return vets.find((vet) => vet.id === existingCanine.vetId) ?? null;
  }, [existingCanine?.vetId, vets]);

  const renderInputField = useCallback(
    (
      label: string,
      value: string,
      onChangeText: (text: string) => void,
      options: {
        placeholder?: string;
        keyboardType?: 'default' | 'numeric' | 'email-address';
        multiline?: boolean;
      } = {}
    ) => {
      const { placeholder, keyboardType = 'default', multiline = false } = options;
      return (
        <ThemedView style={styles.inputContainer}>
          <ThemedText style={[styles.label, { color: colors.secondaryText }]}>{label}</ThemedText>
          <TextInput
            style={[
              styles.input,
              {
                borderColor: colors.border,
                backgroundColor: colors.surface,
                color: colors.text,
                selectionColor: colors.tint,
              },
              multiline && styles.textArea,
            ]}
            value={value}
            onChangeText={onChangeText}
            placeholder={placeholder}
            placeholderTextColor={`${colors.secondaryText}99`}
            keyboardType={keyboardType}
            editable={isEditing || !existingCanine}
            multiline={multiline}
            autoCapitalize="words"
            autoCorrect={false}
          />
        </ThemedView>
      );
    },
    [colors.border, colors.secondaryText, colors.surface, colors.text, colors.tint, existingCanine, isEditing, styles.input, styles.inputContainer, styles.label, styles.textArea]
  );

  const getOverlayConfig = (): {
    title: string;
    body: ReactNode;
    showFab: boolean;
    fabAction?: () => void;
    fabLabel?: string;
  } => {
    const buildAppointmentsOverlay = (overlayTitle: string, sectionLabel: string) => {
      const body = (
        <View style={styles.vetDetailContainer}>
          <View style={styles.vetDetailCountRow}>
            <View style={styles.vetDetailCountLeft}>
              <ThemedText style={[styles.vetDetailCountLabel, { color: colors.text }]}>{sectionLabel}</ThemedText>
              <View
                style={[styles.vetDetailCountBadge, { backgroundColor: `${colors.tint}22` }]}
                accessibilityRole="text">
                <ThemedText style={[styles.vetDetailCountText, { color: colors.tint }]}>{filteredAppointments.length}</ThemedText>
              </View>
            </View>
          </View>

          <View style={[styles.vetSearchBar, { borderColor: colors.icon, backgroundColor: colors.surface }]}
            accessibilityRole="search">
            <IconSymbol name="magnifyingglass" size={18} color={colors.icon} />
            <TextInput
              style={[styles.vetSearchInput, { color: colors.text }]}
              placeholder="Search schedule"
              placeholderTextColor={`${colors.icon}99`}
              value={scheduleSearch}
              onChangeText={setScheduleSearch}
            />
            {scheduleSearch.length > 0 && (
              <TouchableOpacity onPress={() => setScheduleSearch('')} accessibilityRole="button">
                <IconSymbol name="xmark.circle.fill" size={18} color={colors.icon} />
              </TouchableOpacity>
            )}
          </View>

          {searchedAppointments.length === 0 ? (
            <View style={styles.vetEmptyState}>
              <IconSymbol name="calendar" size={48} color={colors.tint} />
              <ThemedText style={[styles.vetEmptyTitle, { color: colors.text }]}>No appointments yet</ThemedText>
              <ThemedText style={[styles.vetEmptySubtitle, { color: colors.secondaryText }]}>Tap add to create one.</ThemedText>
            </View>
          ) : (
            <View style={styles.overlayList}>
              {searchedAppointments.map((apt) => (
                <View
                  key={apt.id}
                  style={[styles.scheduleOverlayCard, { backgroundColor: colors.surface, borderColor: colors.border, shadowColor: colors.shadow }]}
                  accessibilityRole="summary">
                  <View style={styles.visitOverlayHeader}>
                    <ThemedText style={[styles.scheduleOverlayTitle, { color: colors.text }]} numberOfLines={1}>
                      {apt.title || apt.category}
                    </ThemedText>
                    <TouchableOpacity
                      style={styles.scheduleOverlayMore}
                      onPress={() => openScheduleOptions(apt.id)}
                      accessibilityRole="button"
                      accessibilityLabel="Appointment options">
                      <IconSymbol
                        name="ellipsis"
                        size={18}
                        color={colors.icon}
                        style={styles.scheduleOverlayMoreIcon}
                      />
                    </TouchableOpacity>
                  </View>
                  <View style={styles.visitOverlayRow}>
                    <ThemedText style={[styles.visitOverlayLabel, { color: colors.secondaryText }]}>Category</ThemedText>
                    <ThemedText style={[styles.visitOverlayValue, { color: colors.text }]}>{apt.category}</ThemedText>
                  </View>
                  {apt.description ? (
                    <ThemedText style={[styles.scheduleOverlayDescription, { color: colors.secondaryText }]} numberOfLines={2}>
                      {apt.description}
                    </ThemedText>
                  ) : null}
                  <View style={styles.scheduleOverlayRow}>
                    <View style={styles.scheduleOverlayColumn}>
                      <ThemedText style={[styles.scheduleOverlayLabel, { color: colors.secondaryText }]}>Date</ThemedText>
                      <ThemedText style={[styles.scheduleOverlayValue, { color: colors.text }]}>{formatDateSafe(apt.date)}</ThemedText>
                    </View>
                    <View style={styles.scheduleOverlayColumn}>
                      <ThemedText style={[styles.scheduleOverlayLabel, { color: colors.secondaryText }]}>Start</ThemedText>
                      <ThemedText style={[styles.scheduleOverlayValue, { color: colors.text }]}>{formatTimeSafe(apt.startTime)}</ThemedText>
                    </View>
                    <View style={styles.scheduleOverlayColumn}>
                      <ThemedText style={[styles.scheduleOverlayLabel, { color: colors.secondaryText }]}>End</ThemedText>
                      <ThemedText style={[styles.scheduleOverlayValue, { color: colors.text }]}>{formatTimeSafe(apt.endTime)}</ThemedText>
                    </View>
                  </View>
                  <View style={[styles.visitTimestampChip, { backgroundColor: `${colors.tint}1A` }]} accessibilityRole="text">
                    <IconSymbol name="clock" size={14} color={colors.tint} />
                    <ThemedText style={[styles.visitTimestampText, { color: colors.tint }]}>
                      {formatTimestampSafe(apt.updatedAt)}
                    </ThemedText>
                  </View>
                </View>
              ))}
            </View>
          )}
        </View>
      );

      return {
        title: overlayTitle,
        body,
        showFab: true,
        fabAction: handleScheduleAdd,
        fabLabel: 'Add Appointment',
      };
    };

    if (!activeOverlayTab) {
      return { title: '', body: null, showFab: false };
    }

    switch (activeOverlayTab) {
      case 'vet': {
        if (!activeVetSection) {
          return {
            title: 'Vet Profile',
            body: (
              <View style={styles.vetGrid}>
                {vetOptions.map((option) => (
                  <TouchableOpacity
                    key={option.key}
                    style={styles.vetCard}
                    onPress={() => setActiveVetSection(option.key)}>
                    <View style={[styles.vetCardIcon, { backgroundColor: option.accent }]}>
                      <IconSymbol name={option.icon as any} size={28} color="#0E1A4F" />
                    </View>
                    <ThemedText style={styles.vetCardLabel}>{option.title}</ThemedText>
                  </TouchableOpacity>
                ))}
                {primaryVet ? (
                  <ThemedView style={styles.vetPrimaryCard}>
                    <ThemedText style={styles.vetPrimaryTitle}>{primaryVet.name}</ThemedText>
                    <ThemedText style={styles.vetPrimarySubtitle}>
                      {primaryVet.clinicName || 'Clinic information unavailable'}
                    </ThemedText>
                    <View style={styles.vetPrimaryRow}>
                      <IconSymbol name="phone.fill" size={16} color={colors.tint} />
                      <ThemedText style={styles.vetPrimaryDetail}>{primaryVet.phone}</ThemedText>
                    </View>
                    {primaryVet.email ? (
                      <View style={styles.vetPrimaryRow}>
                        <IconSymbol name="envelope.fill" size={16} color={colors.tint} />
                        <ThemedText style={styles.vetPrimaryDetail}>{primaryVet.email}</ThemedText>
                      </View>
                    ) : null}
                  </ThemedView>
                ) : null}
              </View>
            ),
            showFab: false,
          };
        }

        const selected = vetOptions.find((opt) => opt.key === activeVetSection);
        const detailTitle = selected?.title ?? 'Details';

        if (activeVetSection === 'medical') {
          return {
            title: detailTitle,
            body: (
              <View style={styles.vetDetailContainer}>
                <TouchableOpacity
                  style={styles.vetDetailCountRow}
                  activeOpacity={0.8}
                  onPress={() => navigateAfterClose(`/(tabs)/medical-records?canineId=${existingCanine?.id ?? ''}`)}>
                  <ThemedText style={styles.vetDetailCountLabel}>Medical Records</ThemedText>
                  <View style={styles.vetDetailCountBadge}>
                    <ThemedText style={styles.vetDetailCountText}>{canineMedicalRecords.length}</ThemedText>
                  </View>
                </TouchableOpacity>
                <View style={[styles.vetSearchBar, { borderColor: colors.icon }]}>
                  <IconSymbol name="magnifyingglass" size={18} color={colors.icon} />
                  <TextInput
                    style={[styles.vetSearchInput, { color: colors.text }]}
                    placeholder="Search..."
                    placeholderTextColor={`${colors.icon}99`}
                    value={medicalSearch}
                    onChangeText={setMedicalSearch}
                  />
                  {medicalSearch.length > 0 && (
                    <TouchableOpacity onPress={() => setMedicalSearch('')} style={styles.clearSearchButton}>
                      <IconSymbol name="xmark.circle.fill" size={18} color={colors.icon} />
                    </TouchableOpacity>
                  )}
                </View>

                {canineMedicalRecords.length === 0 ? (
                  <View style={styles.vetEmptyState}>
                    <IconSymbol name="doc.text.fill" size={56} color={colors.tint} />
                    <ThemedText style={styles.vetEmptyTitle}>No medical records yet</ThemedText>
                    <ThemedText style={styles.vetEmptySubtitle}>
                      Tap the plus button to add your first medical record.
                    </ThemedText>
                  </View>
                ) : (
                  <View style={styles.overlayList}>
                    {canineMedicalRecords.map((record) => (
                      <View key={record.id} style={styles.medicalCard}>
                        <View style={styles.medicalHeader}>
                          <View style={styles.medicalHeaderText}>
                            <ThemedText style={styles.medicalVetName}>{record.vetName}</ThemedText>
                            <ThemedText style={styles.medicalClinic}>{record.clinicName}</ThemedText>
                          </View>
                          <TouchableOpacity
                            style={styles.medicalMenuButton}
                            onPress={() => navigateAfterClose(`/(tabs)/medical-records?canineId=${existingCanine?.id ?? ''}&recordId=${record.id}`)}>
                            <IconSymbol name="ellipsis" size={18} color={colors.icon} />
                          </TouchableOpacity>
                        </View>
                        <View style={styles.medicalMetaRow}>
                          <ThemedText style={styles.medicalMetaLabel}>Medical Report Type</ThemedText>
                          <ThemedText style={styles.medicalMetaValue}>{record.reportType}</ThemedText>
                        </View>
                        {record.attachments.length > 0 && (
                          <View style={styles.medicalAttachmentRow}>
                            <ThemedText style={styles.medicalMetaLabel}>Upload Medical Report</ThemedText>
                            <View style={styles.medicalAttachmentList}>
                              {record.attachments.map((attachment) => (
                                <View key={attachment.id} style={styles.attachmentChip}>
                                  <IconSymbol
                                    name={attachment.type === 'photo' ? 'photo' : 'doc.fill'}
                                    size={14}
                                    color={colors.tint}
                                  />
                                  <ThemedText style={styles.attachmentLabel} numberOfLines={1}>
                                    {attachment.name}
                                  </ThemedText>
                                </View>
                              ))}
                            </View>
                          </View>
                        )}
                        <View style={styles.medicalTimestampBadge}>
                          <ThemedText style={styles.medicalTimestampText}>
                            {new Date(record.createdAt).toLocaleString()}
                          </ThemedText>
                        </View>
                      </View>
                    ))}
                  </View>
                )}
              </View>
            ),
            showFab: true,
            fabAction: handleMedicalAdd,
            fabLabel: 'Add Medical Record',
          };
        }

        if (activeVetSection === 'medications') {
          return {
            title: detailTitle,
            body: (
              <View style={styles.vetDetailContainer}>
                <View style={styles.vetDetailCountRow}>
                  <View style={styles.vetDetailCountLeft}>
                    <ThemedText style={[styles.vetDetailCountLabel, { color: colors.text }]}>Active medications</ThemedText>
                    <View style={[styles.vetDetailCountBadge, { backgroundColor: `${colors.tint}22` }]}>
                      <ThemedText style={[styles.vetDetailCountText, { color: colors.tint }]}>{filteredMedications.length}</ThemedText>
                    </View>
                  </View>
                  <TouchableOpacity onPress={handleMedicationSeeAll} accessibilityRole="button">
                    <ThemedText style={[styles.vetDetailLink, { color: colors.tint }]}>See All</ThemedText>
                  </TouchableOpacity>
                </View>

                <View style={[styles.vetSearchBar, { borderColor: colors.icon, backgroundColor: colors.surface }]}>
                  <IconSymbol name="magnifyingglass" size={18} color={colors.icon} />
                  <TextInput
                    style={[styles.vetSearchInput, { color: colors.text }]}
                    placeholder="Search medications"
                    placeholderTextColor={`${colors.icon}99`}
                    value={medicationSearch}
                    onChangeText={setMedicationSearch}
                  />
                  {medicationSearch.length > 0 && (
                    <TouchableOpacity onPress={() => setMedicationSearch('')} accessibilityRole="button">
                      <IconSymbol name="xmark.circle.fill" size={18} color={colors.icon} />
                    </TouchableOpacity>
                  )}
                </View>

                {searchedMedications.length === 0 ? (
                  <View style={styles.vetEmptyState}>
                    <IconSymbol name="pills" size={48} color={colors.tint} />
                    <ThemedText style={[styles.vetEmptyTitle, { color: colors.text }]}>No medications yet</ThemedText>
                    <ThemedText style={[styles.vetEmptySubtitle, { color: colors.secondaryText }]}>Tap add to record a medication.</ThemedText>
                  </View>
                ) : (
                  <View style={styles.overlayList}>
                    {searchedMedications.map((med) => (
                      <TouchableOpacity
                        key={med.id}
                        style={[styles.medicationOverlayCard, { backgroundColor: colors.surface, borderColor: colors.border, shadowColor: colors.shadow }]}
                        onPress={() => handleMedicationEdit(med.id)}
                        accessibilityRole="button">
                        <View style={styles.medicationOverlayHeader}>
                          <View style={styles.medicationOverlayTitleBlock}>
                            <ThemedText style={[styles.medicationOverlayTitle, { color: colors.text }]} numberOfLines={1}>
                              {med.medicationName}
                            </ThemedText>
                            <ThemedText style={[styles.medicationOverlaySubtitle, { color: colors.secondaryText }]} numberOfLines={1}>
                              {med.vetName}
                            </ThemedText>
                          </View>
                          <IconSymbol name="chevron.right" size={18} color={colors.icon} />
                        </View>
                        {med.reason ? (
                          <ThemedText style={[styles.medicationOverlayReason, { color: colors.secondaryText }]} numberOfLines={2}>
                            {med.reason}
                          </ThemedText>
                        ) : null}
                        <View style={styles.medicationOverlayRow}>
                          <View style={styles.medicationOverlayColumn}>
                            <ThemedText style={[styles.medicationOverlayLabel, { color: colors.secondaryText }]}>Dosage</ThemedText>
                            <ThemedText style={[styles.medicationOverlayValue, { color: colors.text }]}>{med.quantity} {med.dosageUnit}</ThemedText>
                          </View>
                          <View style={styles.medicationOverlayColumn}>
                            <ThemedText style={[styles.medicationOverlayLabel, { color: colors.secondaryText }]}>Frequency</ThemedText>
                            <ThemedText style={[styles.medicationOverlayValue, { color: colors.text }]}>{med.frequency}</ThemedText>
                          </View>
                        </View>
                        <View style={styles.medicationOverlayRow}>
                          <View style={styles.medicationOverlayColumn}>
                            <ThemedText style={[styles.medicationOverlayLabel, { color: colors.secondaryText }]}>Start</ThemedText>
                            <ThemedText style={[styles.medicationOverlayValue, { color: colors.text }]}>{formatDateSafe(med.startDate)}</ThemedText>
                          </View>
                          <View style={styles.medicationOverlayColumn}>
                            <ThemedText style={[styles.medicationOverlayLabel, { color: colors.secondaryText }]}>End</ThemedText>
                            <ThemedText style={[styles.medicationOverlayValue, { color: colors.text }]}>{formatDateSafe(med.endDate)}</ThemedText>
                          </View>
                        </View>
                        <View style={[styles.medicationTimestampChip, { backgroundColor: `${colors.tint}1A` }]}
                          accessibilityRole="text">
                          <IconSymbol name="clock" size={14} color={colors.tint} />
                          <ThemedText style={[styles.medicationTimestampText, { color: colors.tint }]}>
                            {formatTimestampSafe(med.updatedAt)}
                          </ThemedText>
                        </View>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
              </View>
            ),
            showFab: true,
            fabAction: handleMedicationAdd,
            fabLabel: 'Add Medication',
          };
        }

        if (activeVetSection === 'visits') {
          return {
            title: detailTitle,
            body: (
              <View style={styles.vetDetailContainer}>
                <View style={styles.vetDetailCountRow}>
                  <View style={styles.vetDetailCountLeft}>
                    <ThemedText style={[styles.vetDetailCountLabel, { color: colors.text }]}>Recorded visits</ThemedText>
                    <View style={[styles.vetDetailCountBadge, { backgroundColor: `${colors.tint}22` }]}
                      accessibilityRole="text">
                      <ThemedText style={[styles.vetDetailCountText, { color: colors.tint }]}>{filteredVetVisits.length}</ThemedText>
                    </View>
                  </View>
                  <TouchableOpacity onPress={handleVetVisitSeeAll} accessibilityRole="button">
                    <ThemedText style={[styles.vetDetailLink, { color: colors.tint }]}>See All</ThemedText>
                  </TouchableOpacity>
                </View>

                <View style={[styles.vetSearchBar, { borderColor: colors.icon, backgroundColor: colors.surface }]}>
                  <IconSymbol name="magnifyingglass" size={18} color={colors.icon} />
                  <TextInput
                    style={[styles.vetSearchInput, { color: colors.text }]}
                    placeholder="Search visits"
                    placeholderTextColor={`${colors.icon}99`}
                    value={visitSearch}
                    onChangeText={setVisitSearch}
                  />
                  {visitSearch.length > 0 && (
                    <TouchableOpacity onPress={() => setVisitSearch('')} accessibilityRole="button">
                      <IconSymbol name="xmark.circle.fill" size={18} color={colors.icon} />
                    </TouchableOpacity>
                  )}
                </View>

                {searchedVetVisits.length === 0 ? (
                  <View style={styles.vetEmptyState}>
                    <IconSymbol name="calendar" size={48} color={colors.tint} />
                    <ThemedText style={[styles.vetEmptyTitle, { color: colors.text }]}>No vet visits yet</ThemedText>
                    <ThemedText style={[styles.vetEmptySubtitle, { color: colors.secondaryText }]}>Tap add to log a visit.</ThemedText>
                  </View>
                ) : (
                  <View style={styles.overlayList}>
                    {searchedVetVisits.map((visit) => (
                      <TouchableOpacity
                        key={visit.id}
                        style={[styles.visitOverlayCard, { backgroundColor: colors.surface, borderColor: colors.border, shadowColor: colors.shadow }]}
                        onPress={() => handleVetVisitEdit(visit.id)}
                        accessibilityRole="button">
                        <View style={styles.visitOverlayHeader}>
                          <ThemedText style={[styles.visitOverlayTitle, { color: colors.text }]} numberOfLines={1}>
                            {visit.vetName}
                          </ThemedText>
                          <IconSymbol name="chevron.right" size={18} color={colors.icon} />
                        </View>
                        <View style={styles.visitOverlayRow}>
                          <ThemedText style={[styles.visitOverlayLabel, { color: colors.secondaryText }]}>Date</ThemedText>
                          <ThemedText style={[styles.visitOverlayValue, { color: colors.text }]}>
                            {formatDateSafe(visit.visitDate)}
                          </ThemedText>
                        </View>
                        <View style={styles.visitOverlayRow}>
                          <ThemedText style={[styles.visitOverlayLabel, { color: colors.secondaryText }]}>Reason</ThemedText>
                          <ThemedText style={[styles.visitOverlayValue, { color: colors.text }]} numberOfLines={2}>
                            {visit.reason}
                          </ThemedText>
                        </View>
                        <View style={styles.visitOverlayRow}>
                          <ThemedText style={[styles.visitOverlayLabel, { color: colors.secondaryText }]}>End Results</ThemedText>
                          <ThemedText style={[styles.visitOverlayValue, { color: colors.text }]} numberOfLines={2}>
                            {visit.endResults}
                          </ThemedText>
                        </View>
                        <View style={[styles.visitTimestampChip, { backgroundColor: `${colors.tint}1A` }]}
                          accessibilityRole="text">
                          <IconSymbol name="clock" size={14} color={colors.tint} />
                          <ThemedText style={[styles.visitTimestampText, { color: colors.tint }]}>
                            {formatTimestampSafe(visit.updatedAt)}
                          </ThemedText>
                        </View>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
              </View>
            ),
            showFab: true,
            fabAction: handleVetVisitAdd,
            fabLabel: 'Add Vet Visit',
          };
        }

        if (activeVetSection === 'immunization') {
          return {
            title: detailTitle,
            body: (
              <View style={styles.vetDetailContainer}>
                <View style={styles.vetDetailCountRow}>
                  <View style={styles.vetDetailCountLeft}>
                    <ThemedText style={[styles.vetDetailCountLabel, { color: colors.text }]}>Immunizations</ThemedText>
                    <View style={[styles.vetDetailCountBadge, { backgroundColor: `${colors.tint}22` }]}
                      accessibilityRole="text">
                      <ThemedText style={[styles.vetDetailCountText, { color: colors.tint }]}>{filteredImmunizations.length}</ThemedText>
                    </View>
                  </View>
                  <TouchableOpacity onPress={handleImmunizationSeeAll} accessibilityRole="button">
                    <ThemedText style={[styles.vetDetailLink, { color: colors.tint }]}>See All</ThemedText>
                  </TouchableOpacity>
                </View>

                <View style={[styles.vetSearchBar, { borderColor: colors.icon, backgroundColor: colors.surface }]}>
                  <IconSymbol name="magnifyingglass" size={18} color={colors.icon} />
                  <TextInput
                    style={[styles.vetSearchInput, { color: colors.text }]}
                    placeholder="Search immunizations"
                    placeholderTextColor={`${colors.icon}99`}
                    value={immunizationSearch}
                    onChangeText={setImmunizationSearch}
                  />
                  {immunizationSearch.length > 0 && (
                    <TouchableOpacity onPress={() => setImmunizationSearch('')} accessibilityRole="button">
                      <IconSymbol name="xmark.circle.fill" size={18} color={colors.icon} />
                    </TouchableOpacity>
                  )}
                </View>

                {searchedImmunizations.length === 0 ? (
                  <View style={styles.vetEmptyState}>
                    <IconSymbol name="syringe" size={48} color={colors.tint} />
                    <ThemedText style={[styles.vetEmptyTitle, { color: colors.text }]}>No immunizations yet</ThemedText>
                    <ThemedText style={[styles.vetEmptySubtitle, { color: colors.secondaryText }]}>Tap add to log an immunization.</ThemedText>
                  </View>
                ) : (
                  <View style={styles.overlayList}>
                    {searchedImmunizations.map((record) => (
                      <TouchableOpacity
                        key={record.id}
                        style={[styles.immunizationOverlayCard, { backgroundColor: colors.surface, borderColor: colors.border, shadowColor: colors.shadow }]}
                        onPress={() => handleImmunizationEdit(record.id)}
                        accessibilityRole="button">
                        <View style={styles.visitOverlayHeader}>
                          <ThemedText style={[styles.visitOverlayTitle, { color: colors.text }]} numberOfLines={1}>
                            {record.vetName}
                          </ThemedText>
                          <IconSymbol name="chevron.right" size={18} color={colors.icon} />
                        </View>
                        <View style={styles.immunizationOverlayRow}>
                          <ThemedText style={[styles.immunizationOverlayLabel, { color: colors.secondaryText }]}>Vaccine</ThemedText>
                          <ThemedText style={[styles.immunizationOverlayValue, { color: colors.text }]}>{record.vaccineName}</ThemedText>
                        </View>
                        <View style={styles.immunizationOverlayRow}>
                          <ThemedText style={[styles.immunizationOverlayLabel, { color: colors.secondaryText }]}>Age</ThemedText>
                          <ThemedText style={[styles.immunizationOverlayValue, { color: colors.text }]}>
                            {`${record.ageYears}y${record.ageMonths}m`}
                          </ThemedText>
                        </View>
                        <View style={styles.immunizationOverlayRow}>
                          <ThemedText style={[styles.immunizationOverlayLabel, { color: colors.secondaryText }]}>Immunized</ThemedText>
                          <ThemedText style={[styles.immunizationOverlayValue, { color: colors.text }]}>
                            {formatDateSafe(record.immunizationDate)}
                          </ThemedText>
                        </View>
                        <View style={styles.immunizationOverlayRow}>
                          <ThemedText style={[styles.immunizationOverlayLabel, { color: colors.secondaryText }]}>Last Vaccinated</ThemedText>
                          <ThemedText style={[styles.immunizationOverlayValue, { color: colors.text }]}>
                            {formatDateSafe(record.lastVaccinatedDate)}
                          </ThemedText>
                        </View>
                        <View style={[styles.visitTimestampChip, { backgroundColor: `${colors.tint}1A` }]} accessibilityRole="text">
                          <IconSymbol name="clock" size={14} color={colors.tint} />
                          <ThemedText style={[styles.visitTimestampText, { color: colors.tint }]}>
                            {formatTimestampSafe(record.updatedAt)}
                          </ThemedText>
                        </View>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
              </View>
            ),
            showFab: true,
            fabAction: handleImmunizationAdd,
            fabLabel: 'Add Immunization',
          };
        }

        if (activeVetSection === 'appointments') {
          return buildAppointmentsOverlay('Appointments', 'Appointments');
        }

        return {
          title: detailTitle,
          body: (
            <View style={styles.vetEmptyState}>
              <IconSymbol name="doc.plaintext" size={56} color={colors.tint} />
              <ThemedText style={styles.vetEmptyTitle}>No records yet</ThemedText>
              <ThemedText style={styles.vetEmptySubtitle}>This section is coming soon.</ThemedText>
            </View>
          ),
          showFab: false,
        };
      }
      case 'schedule':
        return buildAppointmentsOverlay('Canine Schedule', 'Schedule');
      case 'nutrition': {
        const body = (
          <View style={styles.nutritionSummaryContainer}>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.nutritionDateRow}>
              {nutritionDateWindow.map((date) => {
                const isActive = date === selectedNutritionDate;
                return (
                  <TouchableOpacity
                    key={date}
                    style={[styles.nutritionDateChip, isActive && { backgroundColor: colors.tint }]}
                    onPress={() => setSelectedNutritionDate(date)}
                    accessibilityRole="button">
                    <ThemedText style={[styles.nutritionDateLabel, { color: isActive ? colors.inverseText : colors.text }]}>
                      {formatNutritionChipLabel(date)}
                    </ThemedText>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            <View style={styles.nutritionSectionHeader}>
              <ThemedText style={[styles.nutritionSectionTitle, { color: colors.text }]}>Schedule Daily Meal</ThemedText>
              <TouchableOpacity onPress={handleNutritionSeeAll} accessibilityRole="button">
                <ThemedText style={[styles.nutritionSectionLink, { color: colors.tint }]}>See All</ThemedText>
              </TouchableOpacity>
            </View>

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.nutritionCardRow}>
              {mealsForSelectedDate.length === 0 ? (
                <ThemedView style={[styles.nutritionEmptyCard, { borderColor: colors.border, backgroundColor: colors.surfaceMuted }]}>
                  <IconSymbol name="leaf" size={28} color={colors.tint} />
                  <ThemedText style={[styles.nutritionEmptyTitle, { color: colors.text }]}>No meals for this day</ThemedText>
                  <ThemedText style={[styles.nutritionEmptySubtitle, { color: colors.secondaryText }]}>Plan a meal to get started.</ThemedText>
                </ThemedView>
              ) : (
                mealsForSelectedDate.map((entry) => (
                  <ThemedView
                    key={entry.id}
                    style={[
                      styles.nutritionSummaryCard,
                      { backgroundColor: colors.surface, borderColor: colors.border, shadowColor: colors.shadow },
                    ]}>
                    <View style={styles.nutritionSummaryHeader}>
                      <View style={styles.nutritionSummaryHeading}>
                        <ThemedText style={[styles.nutritionSummaryTitle, { color: colors.text }]} numberOfLines={1}>
                          {entry.foodType}
                        </ThemedText>
                        <ThemedText style={[styles.nutritionSummarySubtitle, { color: colors.secondaryText }]} numberOfLines={1}>
                          {entry.foodName}
                        </ThemedText>
                      </View>
                      <TouchableOpacity
                        style={styles.nutritionSummaryMore}
                        onPress={() => openNutritionOptions(entry.id)}
                        accessibilityRole="button"
                        accessibilityLabel="Meal options">
                        <IconSymbol name="ellipsis.circle" size={18} color={colors.icon} />
                      </TouchableOpacity>
                    </View>
                    <View style={styles.nutritionSummaryMetaRow}>
                      <IconSymbol name="scalemass" size={14} color={colors.icon} />
                      <ThemedText style={[styles.nutritionSummaryMeta, { color: colors.text }]}>
                        {`${entry.quantity} ${entry.unit} · ${entry.calories} cal`}
                      </ThemedText>
                    </View>
                    <View style={styles.nutritionSummaryMetaRow}>
                      <IconSymbol name="calendar" size={14} color={colors.icon} />
                      <ThemedText style={[styles.nutritionSummaryMeta, { color: colors.text }]}>
                        Planned: {formatNutritionCalendarBadge(entry.date)}
                      </ThemedText>
                    </View>
                    <View style={styles.nutritionSummaryMetaRow}>
                      <IconSymbol name="checkmark.circle" size={14} color={colors.icon} />
                      <ThemedText style={[styles.nutritionSummaryMeta, { color: colors.text }]}>
                        Actual: {entry.actualDate ? formatNutritionCalendarBadge(entry.actualDate) : 'Not recorded'}
                      </ThemedText>
                    </View>
                    {entry.addOns ? (
                      <View style={styles.nutritionSummaryMetaRow}>
                        <IconSymbol name="plus.circle" size={14} color={colors.icon} />
                        <ThemedText
                          style={[styles.nutritionSummaryMeta, { color: colors.secondaryText }]}
                          numberOfLines={1}>
                          {entry.addOns}
                        </ThemedText>
                      </View>
                    ) : null}
                    <View
                      style={[styles.nutritionSummaryBadge, { backgroundColor: `${colors.tint}1A` }]}
                      accessibilityRole="text">
                      <ThemedText style={[styles.nutritionSummaryBadgeText, { color: colors.tint }]}>
                        {formatNutritionCalendarBadge(entry.date)}
                      </ThemedText>
                    </View>
                  </ThemedView>
                ))
              )}
            </ScrollView>

            <View style={styles.nutritionSectionHeader}>
              <ThemedText style={[styles.nutritionSectionTitle, { color: colors.text }]}>The canine Eats & Allergies</ThemedText>
              <TouchableOpacity onPress={handleAllergiesSeeAll} accessibilityRole="button">
                <ThemedText style={[styles.nutritionSectionLink, { color: colors.tint }]}>See All</ThemedText>
              </TouchableOpacity>
            </View>

            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.nutritionCardRow}>
              {allergiesForCanine.length === 0 ? (
                <ThemedView style={[styles.nutritionEmptyCard, { borderColor: colors.border, backgroundColor: colors.surfaceMuted }]}>
                  <IconSymbol name="exclamationmark.shield" size={28} color={colors.tint} />
                  <ThemedText style={[styles.nutritionEmptyTitle, { color: colors.text }]}>No allergies recorded</ThemedText>
                  <ThemedText style={[styles.nutritionEmptySubtitle, { color: colors.secondaryText }]}>Add items from the allergies screen.</ThemedText>
                </ThemedView>
              ) : (
                allergiesForCanine.map((item) => (
                  <ThemedView
                    key={item.id}
                    style={[
                      styles.allergySummaryCard,
                      { backgroundColor: colors.surface, borderColor: colors.border, shadowColor: colors.shadow },
                    ]}>
                    <View style={styles.nutritionSummaryHeader}>
                      <View style={styles.nutritionSummaryHeading}>
                        <ThemedText style={[styles.nutritionSummaryTitle, { color: colors.text }]} numberOfLines={1}>
                          {item.foodType}
                        </ThemedText>
                        <ThemedText style={[styles.nutritionSummarySubtitle, { color: colors.secondaryText }]} numberOfLines={1}>
                          {item.name}
                        </ThemedText>
                      </View>
                      <TouchableOpacity
                        style={styles.nutritionSummaryMore}
                        onPress={() => openAllergyOptions(item.id)}
                        accessibilityRole="button"
                        accessibilityLabel="Allergy options">
                        <IconSymbol name="ellipsis.circle" size={18} color={colors.icon} />
                      </TouchableOpacity>
                    </View>
                    <ThemedText style={[styles.allergySummaryMeta, { color: colors.secondaryText }]} numberOfLines={2}>
                      Updated {formatDateSafe(item.updatedAt)}
                    </ThemedText>
                  </ThemedView>
                ))
              )}
            </ScrollView>
          </View>
        );
        return {
          title: 'Nutrition Summary',
          body,
          showFab: false,
        };
      }
      case 'training': {
        const body =
          filteredTraining.length === 0 ? (
            <ThemedText style={styles.emptyText}>No training sessions logged yet.</ThemedText>
          ) : (
            <View style={styles.overlayList}>
              {filteredTraining.map((log) => (
                <View key={log.id} style={styles.tabCard}>
                  <ThemedText style={styles.tabPrimary}>{log.skill}</ThemedText>
                  <ThemedText style={styles.tabSecondary}>
                    {new Date(log.date).toLocaleDateString()} • {log.duration ?? 0} mins
                  </ThemedText>
                  <ThemedText style={styles.tabDetailText}>Success: {log.success ? 'Yes' : 'Not yet'}</ThemedText>
                  {log.notes && <ThemedText style={styles.tabDetailText}>{log.notes}</ThemedText>}
                </View>
              ))}
            </View>
          );
        return {
          title: 'Training',
          body,
          showFab: true,
          fabAction: handleTrainingAdd,
          fabLabel: 'Add Training Log',
        };
      }
      case 'media': {
        const body =
          canineMedia.length === 0 ? (
            <View style={styles.mediaEmptyState}>
              <ThemedText style={styles.emptyText}>No media yet. Add your first photo!</ThemedText>
              <TouchableOpacity
                style={[styles.addMediaButton, { borderColor: colors.tint }]}
                onPress={handleAddMedia}
                disabled={isUploading}>
                {isUploading ? (
                  <ActivityIndicator size="small" color={colors.tint} />
                ) : (
                  <>
                    <IconSymbol name="plus.circle" size={28} color={colors.tint} />
                    <ThemedText style={styles.addMediaText}>Add Media</ThemedText>
                  </>
                )}
              </TouchableOpacity>
            </View>
          ) : (
            <>
              <FlatList
                horizontal
                data={canineMedia}
                keyExtractor={(item) => item.id}
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.mediaCarousel}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    key={item.id}
                    activeOpacity={0.85}
                    onLongPress={() => handleMediaOptions(item)}
                    onPress={() => handleSetProfilePhoto(item.id)}
                    style={styles.mediaCard}>
                    <Image source={{ uri: item.uri }} style={styles.mediaImage} contentFit="cover" />
                    {item.caption ? (
                      <ThemedText style={styles.mediaCaption} numberOfLines={2}>
                        {item.caption}
                      </ThemedText>
                    ) : null}
                  </TouchableOpacity>
                )}
              />
              <TouchableOpacity
                style={[styles.addMediaButton, { borderColor: colors.tint }]}
                onPress={handleAddMedia}
                disabled={isUploading}>
                {isUploading ? (
                  <ActivityIndicator size="small" color={colors.tint} />
                ) : (
                  <>
                    <IconSymbol name="plus.circle" size={28} color={colors.tint} />
                    <ThemedText style={styles.addMediaText}>Add Media</ThemedText>
                  </>
                )}
              </TouchableOpacity>
            </>
          );
        return { title: 'Media', body, showFab: false };
      }
      default:
        return { title: '', body: null, showFab: false };
    }
  };

  const renderOverlay = () => {
    if (!activeOverlayTab) {
      return null;
    }

    const { title, body, showFab, fabAction, fabLabel } = getOverlayConfig();
    const translateX = overlayAnim.interpolate({
      inputRange: [0, 1],
      outputRange: [Dimensions.get('window').width, 0],
    });

    return (
      <Modal transparent visible animationType="fade" onRequestClose={handleOverlayBack}>
        <View style={styles.overlayModalRoot}>
          <View style={styles.overlayBackdrop} />
          <Animated.View
            style={[
              styles.overlayCard,
              {
                paddingTop: insets.top + 16,
                paddingBottom: Math.max(insets.bottom, 20),
                backgroundColor: colors.surface,
                borderColor: colors.border,
                transform: [{ translateX }],
              },
            ]}>
            <View style={styles.overlayHeader}>
              <TouchableOpacity
                style={styles.overlayBackButton}
                onPress={handleOverlayBack}
                accessibilityRole="button"
                accessibilityLabel="Go back">
                <IconSymbol name="chevron.left" size={22} color={colors.text} />
                <ThemedText style={[styles.overlayBackLabel, { color: colors.text }]}>Back</ThemedText>
              </TouchableOpacity>
              <ThemedText style={styles.overlayTitle}>{title}</ThemedText>
              <View style={{ width: 44 }} />
            </View>
            <ScrollView
              style={styles.overlayScroll}
              contentContainerStyle={styles.overlayContent}
              bounces={false}
              alwaysBounceVertical={false}
              overScrollMode="never"
              contentInsetAdjustmentBehavior="never"
              showsVerticalScrollIndicator={false}>
              {body}
            </ScrollView>
            {showFab && fabAction ? (
              <TouchableOpacity
                style={[styles.overlayFab, { backgroundColor: colors.tint, bottom: 24 + insets.bottom }]}
                onPress={fabAction}
                accessibilityRole="button"
                accessibilityLabel={fabLabel ?? 'Add'}>
                <IconSymbol name="plus" size={24} color="#FFFFFF" />
              </TouchableOpacity>
            ) : null}
          </Animated.View>
        </View>
      </Modal>
    );
  };

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      enabled={Platform.OS !== 'web'}>
      <ScrollView style={styles.scrollView} keyboardShouldPersistTaps="handled">
        <View style={styles.heroContainer}>
          <TouchableOpacity
            style={styles.heroBackButton}
            onPress={() => router.back()}
            accessibilityRole="button"
            accessibilityLabel="Go back">
            <IconSymbol name="arrow.left.circle.fill" size={32} color="#FFFFFF" />
          </TouchableOpacity>
          <View style={styles.heroImageWrapper}>
            {heroImage ? (
              <Image source={{ uri: heroImage }} style={styles.heroImage} contentFit="cover" />
            ) : (
              <View style={styles.heroPlaceholder}>
                <IconSymbol name="photo" size={48} color="#FFFFFF" />
              </View>
            )}
          </View>
          {existingCanine && (
            <TouchableOpacity
              style={styles.heroEditButton}
              onPress={() => setIsEditing((prev) => !prev)}
              accessibilityRole="button"
              accessibilityLabel={isEditing ? 'Close edit mode' : 'Edit canine'}>
              <IconSymbol name={isEditing ? 'checkmark' : 'pencil'} size={20} color="#FFFFFF" />
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.infoCard}>
          <View style={styles.infoHeader}>
            <ThemedText style={styles.petName}>{existingCanine?.name || 'New Pet'}</ThemedText>
            {existingCanine && (
              <TouchableOpacity
                onPress={() => setInfoMenuVisible(true)}
                style={styles.moreButton}
                accessibilityRole="button"
                accessibilityLabel="Pet options">
                <IconSymbol name="ellipsis.circle" size={22} color={colors.text} />
              </TouchableOpacity>
            )}
          </View>
          <Modal
            transparent
            visible={infoMenuVisible}
            animationType="fade"
            onRequestClose={() => setInfoMenuVisible(false)}>
            <View style={styles.menuWrapper}>
              <TouchableOpacity
                style={styles.menuBackdrop}
                activeOpacity={1}
                onPress={() => setInfoMenuVisible(false)}
              />
              <View style={styles.menuContainer}>
                <ThemedView style={[styles.menuCard, { backgroundColor: colors.surface, borderColor: colors.border, shadowColor: colors.shadow }]}>
                  <TouchableOpacity style={styles.menuItem} onPress={handleEditFromMenu}>
                    <IconSymbol name="pencil" size={18} color={colors.text} />
                    <ThemedText style={styles.menuItemText}>Edit</ThemedText>
                  </TouchableOpacity>
                  <View style={styles.menuDivider} />
                  <TouchableOpacity style={styles.menuItem} onPress={handleDelete}>
                    <IconSymbol name="trash" size={18} color="#DC2626" />
                    <ThemedText style={[styles.menuItemText, styles.menuItemDanger]}>Delete</ThemedText>
                  </TouchableOpacity>
                </ThemedView>
              </View>
            </View>
          </Modal>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.metricsScroll}
            contentContainerStyle={styles.metricsContent}>
            {infoMetrics.map((metric) => (
              <ThemedView
                key={`${metric.label}-${metric.value}`}
                style={[styles.metricPill, { backgroundColor: colors.surfaceMuted, borderColor: `${colors.icon}22` }]}>
                <ThemedText style={[styles.metricLabel, { color: colors.secondaryText }]}>{metric.label}</ThemedText>
                <ThemedText style={[styles.metricValue, { color: colors.text }]} numberOfLines={1}>
                  {metric.value}
                </ThemedText>
              </ThemedView>
            ))}
          </ScrollView>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.tabRowContainer}
          style={styles.tabRowScroller}>
          {TAB_ITEMS.map((tab) => {
            const isActive = tab.key === activeTab;
            return (
              <TouchableOpacity
                key={tab.key}
                style={[
                  styles.tabPill,
                  {
                    backgroundColor: isActive ? colors.tint : colors.background,
                    borderColor: isActive ? colors.tint : `${colors.icon}55`,
                  },
                ]}
                onPress={() => handleTabPress(tab.key)}>
                <IconSymbol
                  name={tab.icon as any}
                  size={16}
                  color={isActive ? '#FFFFFF' : colors.text}
                />
                <ThemedText
                  style={[styles.tabLabel, { color: isActive ? '#FFFFFF' : colors.text }]}
                  numberOfLines={1}>
                  {tab.label}
                </ThemedText>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        <View style={styles.notesSection}>
          <View style={styles.notesHeader}>
            <ThemedText style={[styles.notesTitle, { color: colors.text }]}>My Notes</ThemedText>
            <TouchableOpacity
              onPress={() => setNoteQuickActionsVisible(true)}
              style={[styles.addNoteButton, { borderColor: colors.tint }]}
              accessibilityRole="button"
              accessibilityLabel="Add note">
              <IconSymbol name="plus" size={16} color={colors.tint} />
              <ThemedText style={[styles.addNoteLabel, { color: colors.tint }]}>Add Note</ThemedText>
            </TouchableOpacity>
          </View>

          {petNotes.length === 0 ? (
            <ThemedView style={[styles.notesEmptyCard, { borderColor: `${colors.icon}33` }]}>
              <IconSymbol name="text.bubble" size={22} color={colors.icon} />
              <ThemedText style={styles.notesEmptyText}>No notes yet. Tap Add Note to create one.</ThemedText>
            </ThemedView>
          ) : (
            petNotes.map((note) => (
              <ThemedView key={note.id} style={styles.noteCard}>
                <ThemedText style={styles.noteContent}>{note.content}</ThemedText>
                <TouchableOpacity
                  onPress={() => setNoteMenuForId(note.id)}
                  style={styles.noteMoreButton}
                  accessibilityRole="button"
                  accessibilityLabel="Note options">
                  <IconSymbol name="ellipsis" size={18} color="#1F2937" />
                </TouchableOpacity>
              </ThemedView>
            ))
          )}
        </View>

        {isEditing && (
          <ThemedView
            style={[styles.editCard, { backgroundColor: colors.surface, borderColor: colors.border, shadowColor: colors.shadow }]}>
            <ThemedText style={[styles.editTitle, { color: colors.text }]}>Edit Details</ThemedText>
            {renderInputField('Name *', formData.name || '', (text) => setFormData((prev) => ({ ...prev, name: text })), {
              placeholder: 'Enter pet name',
            })}
            {renderInputField('Breed', formData.breed || '', (text) => setFormData((prev) => ({ ...prev, breed: text })), {
              placeholder: 'Enter breed',
            })}
            {renderInputField(
              'Date of Birth',
              formData.dateOfBirth || '',
              (text) => setFormData((prev) => ({ ...prev, dateOfBirth: text })),
              { placeholder: 'YYYY-MM-DD' }
            )}
            <View style={styles.row}>
              <View style={styles.halfWidth}>
                {renderInputField(
                  'Weight',
                  formData.weight?.toString() || '',
                  (text) =>
                    setFormData((prev) => ({
                      ...prev,
                      weight: text ? parseFloat(text) : undefined,
                    })),
                  { placeholder: '0', keyboardType: 'numeric' }
                )}
              </View>
              <View style={styles.halfWidth}>
                <ThemedText style={styles.label}>Unit</ThemedText>
                <View style={styles.roleButtons}>
                  {(['lbs', 'kg'] as const).map((unit) => (
                    <TouchableOpacity
                      key={unit}
                      style={[
                        styles.roleButton,
                        formData.weightUnit === unit && { backgroundColor: colors.tint },
                      ]}
                      onPress={() => setFormData((prev) => ({ ...prev, weightUnit: unit }))}>
                      <ThemedText
                        style={[
                          styles.roleButtonText,
                          formData.weightUnit === unit && { color: '#FFFFFF' },
                        ]}>
                        {unit.toUpperCase()}
                      </ThemedText>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            </View>
            {renderInputField('Color', formData.color || '', (text) => setFormData((prev) => ({ ...prev, color: text })), {
              placeholder: 'Enter color',
            })}
            {renderInputField(
              'Microchip Number',
              formData.microchipNumber || '',
              (text) => setFormData((prev) => ({ ...prev, microchipNumber: text })),
              { placeholder: 'Enter microchip number' }
            )}
            <View style={styles.editActions}>
              <TouchableOpacity
                style={[styles.secondaryButton, { borderColor: colors.icon }]}
                onPress={() => {
                  setIsEditing(false);
                  if (existingCanine) {
                    setFormData(existingCanine);
                  }
                }}>
                <ThemedText style={[styles.secondaryButtonText, { color: colors.text }]}>Cancel</ThemedText>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.primaryButton, { backgroundColor: colors.tint }]}
                onPress={handleSave}>
                <ThemedText style={styles.primaryButtonText}>Save</ThemedText>
              </TouchableOpacity>
            </View>
          </ThemedView>
        )}

        {!existingCanine && (
          <TouchableOpacity
            style={[styles.primaryButton, { backgroundColor: colors.tint, marginHorizontal: 20, marginBottom: 24 }]}
            onPress={handleSave}>
            <ThemedText style={styles.primaryButtonText}>Create Pet Profile</ThemedText>
          </TouchableOpacity>
        )}
      </ScrollView>

      {renderOverlay()}

      <Modal
        transparent
        visible={noteQuickActionsVisible}
        animationType="fade"
        onRequestClose={() => setNoteQuickActionsVisible(false)}>
        <View style={styles.noteQuickWrapper}>
          <TouchableOpacity
            style={StyleSheet.absoluteFill}
            activeOpacity={1}
            onPress={() => setNoteQuickActionsVisible(false)}
          />
          <ThemedView style={[styles.noteQuickCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <TouchableOpacity style={styles.noteQuickOption} onPress={() => openNoteModal()}>
              <View style={[styles.noteQuickIcon, { backgroundColor: `${colors.tint}1A` }]}>
                <IconSymbol name="plus" size={18} color={colors.tint} />
              </View>
              <ThemedText style={styles.noteQuickLabel}>Create</ThemedText>
            </TouchableOpacity>
            <View style={styles.noteQuickDivider} />
            <TouchableOpacity
              style={styles.noteQuickOption}
              onPress={() => {
                setNoteQuickActionsVisible(false);
                setNoteListVisible(true);
              }}>
              <View style={[styles.noteQuickIcon, { backgroundColor: `${colors.tint}1A` }]}>
                <IconSymbol name="list.bullet" size={18} color={colors.tint} />
              </View>
              <ThemedText style={styles.noteQuickLabel}>See More</ThemedText>
            </TouchableOpacity>
          </ThemedView>
        </View>
      </Modal>

      <Modal
        transparent
        visible={!!noteMenuForId}
        animationType="fade"
        onRequestClose={() => setNoteMenuForId(null)}>
        <View style={styles.noteMenuWrapper}>
          <TouchableOpacity
            style={styles.menuBackdrop}
            activeOpacity={1}
            onPress={() => setNoteMenuForId(null)}
          />
          <View style={styles.noteMenuContainer}>
            <ThemedView style={[styles.menuCard, { backgroundColor: colors.surface, borderColor: colors.border, shadowColor: colors.shadow }]}>
              <TouchableOpacity
                style={styles.menuItem}
                onPress={() => noteMenuTarget && openNoteModal(noteMenuTarget)}>
                <IconSymbol name="pencil" size={18} color={colors.text} />
                <ThemedText style={styles.menuItemText}>Edit</ThemedText>
              </TouchableOpacity>
              <View style={styles.menuDivider} />
              <TouchableOpacity
                style={styles.menuItem}
                onPress={() => noteMenuTarget && handleDeleteNote(noteMenuTarget.id)}>
                <IconSymbol name="trash" size={18} color="#DC2626" />
                <ThemedText style={[styles.menuItemText, styles.menuItemDanger]}>Delete</ThemedText>
              </TouchableOpacity>
            </ThemedView>
          </View>
        </View>
      </Modal>

      <Modal
        transparent
        visible={noteListVisible}
        animationType="fade"
        onRequestClose={() => setNoteListVisible(false)}>
        <View style={[styles.noteListOverlay, { backgroundColor: colors.surface }]}>
          <View style={styles.noteListHeader}>
            <TouchableOpacity
              style={styles.noteListBackButton}
              onPress={() => setNoteListVisible(false)}
              accessibilityRole="button"
              accessibilityLabel="Back to profile">
              <IconSymbol name="chevron.left" size={22} color={colors.text} />
              <ThemedText style={[styles.noteListBackLabel, { color: colors.text }]}>Back</ThemedText>
            </TouchableOpacity>
            <ThemedText style={styles.noteListTitle}>Notes</ThemedText>
          </View>
          {petNotes.length === 0 ? (
            <ThemedView style={[styles.noteListEmptyCard, { borderColor: `${colors.icon}33` }]}>
              <IconSymbol name="text.alignleft" size={28} color={colors.icon} />
              <ThemedText style={styles.noteListEmptyText}>No notes yet. Tap plus to create one.</ThemedText>
            </ThemedView>
          ) : (
            <ScrollView
              style={styles.noteListScroll}
              contentContainerStyle={styles.noteListScrollContent}
              showsVerticalScrollIndicator={false}>
              {petNotes.map((note) => (
                <ThemedView key={note.id} style={styles.noteListItem}>
                  <View style={styles.noteListItemContent}>
                    <IconSymbol name="star" size={18} color={colors.tint} />
                    <ThemedText style={styles.noteListItemText}>{note.content}</ThemedText>
                  </View>
                  <TouchableOpacity
                    onPress={() => setNoteMenuForId(note.id)}
                    style={styles.noteListItemMore}
                    accessibilityRole="button"
                    accessibilityLabel="Note options">
                    <IconSymbol name="ellipsis" size={18} color="#1F2937" />
                  </TouchableOpacity>
                </ThemedView>
              ))}
            </ScrollView>
          )}
          <TouchableOpacity
            style={[styles.noteListAddButton, { backgroundColor: colors.tint }]}
            onPress={() => openNoteModal()}
            accessibilityRole="button"
            accessibilityLabel="Add note">
            <IconSymbol name="plus" size={24} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      </Modal>

      <Modal
        transparent
        visible={noteModalVisible}
        animationType="fade"
        onRequestClose={closeNoteModal}>
        <View style={styles.noteModalBackdrop}>
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            style={styles.noteModalWrapper}>
            <ThemedView style={[styles.noteModalCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <ThemedText style={styles.noteModalTitle}>
                {editingNoteId ? 'Edit Note' : 'Add Note'}
              </ThemedText>
              <TextInput
                value={noteDraft}
                onChangeText={setNoteDraft}
                placeholder="Enter note"
                placeholderTextColor={`${colors.icon}AA`}
                style={[styles.noteInput, { borderColor: colors.icon, color: colors.text }]}
                multiline
                numberOfLines={4}
              />
              <View style={styles.noteModalActions}>
                <TouchableOpacity
                  onPress={closeNoteModal}
                  style={[styles.noteModalButton, styles.noteModalCancel]}>
                  <ThemedText style={styles.noteModalCancelText}>Cancel</ThemedText>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={handleSaveNoteDraft}
                  style={[styles.noteModalButton, styles.noteModalSave]}>
                  <ThemedText style={styles.noteModalSaveText}>Save</ThemedText>
                </TouchableOpacity>
              </View>
            </ThemedView>
          </KeyboardAvoidingView>
        </View>
      </Modal>

      <View style={[styles.bottomBar, { shadowColor: colors.shadow, backgroundColor: colors.surface }]}
        pointerEvents="box-none">
        <View style={[styles.bottomBarInner, { backgroundColor: colors.surface, borderColor: colors.border }]}
          pointerEvents="auto">
          {[
            { key: 'home', label: 'Home', icon: 'house.fill', route: '/(tabs)' },
            { key: 'contacts', label: 'Contact List', icon: 'person.2.fill', route: '/(tabs)/contacts' },
            { key: 'reminders', label: 'Reminders', icon: 'bell.fill', route: '/(tabs)/appointments' },
          ].map((item) => (
            <TouchableOpacity
              key={item.key}
              style={styles.bottomItem}
              onPress={() => router.replace(item.route as any)}>
              <IconSymbol name={item.icon as any} size={18} color={colors.text} />
              <ThemedText style={styles.bottomLabel}>{item.label}</ThemedText>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  heroContainer: {
    height: HERO_HEIGHT,
    position: 'relative',
    backgroundColor: '#111826',
  },
  heroImageWrapper: {
    flex: 1,
    overflow: 'hidden',
  },
  heroImage: {
    width: '100%',
    height: '100%',
  },
  heroPlaceholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1F2937',
  },
  heroBackButton: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 48 : 24,
    left: 16,
    zIndex: 10,
  },
  heroEditButton: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 48 : 24,
    right: 16,
    backgroundColor: 'rgba(17, 24, 39, 0.65)',
    borderRadius: 18,
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoCard: {
    marginTop: -32,
    marginHorizontal: 12,
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 14,
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  infoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  petName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0F172A',
  },
  moreButton: {
    padding: 6,
    borderRadius: 16,
  },
  menuWrapper: {
    flex: 1,
    paddingTop: Math.max(HERO_HEIGHT - 40, 120),
    paddingRight: 24,
    alignItems: 'flex-end',
  },
  menuBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(15, 23, 42, 0.25)',
  },
  menuContainer: {
    width: 180,
  },
  menuCard: {
    borderRadius: 14,
    paddingVertical: 8,
    paddingHorizontal: 12,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 5,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 10,
    paddingHorizontal: 4,
  },
  menuItemText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#0F172A',
  },
  menuItemDanger: {
    color: '#DC2626',
  },
  menuDivider: {
    height: 1,
    backgroundColor: '#E2E8F0',
    marginHorizontal: 4,
  },
  metricsScroll: {
    marginTop: 16,
  },
  metricsContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingRight: 20,
  },
  metricPill: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 18,
    borderWidth: 1,
    minWidth: 120,
    gap: 6,
  },
  metricLabel: {
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  metricValue: {
    fontSize: 14,
    fontWeight: '700',
  },
  tabRowContainer: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  tabRowScroller: {
    marginTop: 8,
  },
  tabPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 20,
    borderWidth: 1,
    gap: 6,
  },
  tabLabel: {
    fontSize: 13,
    fontWeight: '600',
  },
  tabContent: {
    marginHorizontal: 20,
    marginTop: 16,
    gap: 12,
  },
  notesSection: {
    marginHorizontal: 20,
    marginTop: 12,
    marginBottom: 4,
    gap: 12,
  },
  notesHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  notesTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  addNoteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 8,
    gap: 6,
  },
  addNoteLabel: {
    fontSize: 14,
    fontWeight: '600',
  },
  notesEmptyCard: {
    borderWidth: 1,
    borderRadius: 16,
    paddingVertical: 20,
    paddingHorizontal: 16,
    alignItems: 'center',
    gap: 10,
  },
  notesEmptyText: {
    fontSize: 13,
    color: '#6B7280',
    textAlign: 'center',
  },
  noteCard: {
    position: 'relative',
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    paddingVertical: 16,
    paddingHorizontal: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  noteContent: {
    fontSize: 15,
    lineHeight: 22,
    color: '#1F2937',
    paddingRight: 32,
  },
  noteMoreButton: {
    position: 'absolute',
    top: 10,
    right: 10,
    padding: 6,
    borderRadius: 16,
  },
  overlayContainer: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 30,
  },
  overlayBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(15, 23, 42, 0.25)',
  },
  overlayCard: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    right: 0,
    width: '100%',
    borderTopLeftRadius: 24,
    borderBottomLeftRadius: 24,
    paddingHorizontal: 20,
    shadowColor: '#000',
    shadowOffset: { width: -6, height: 0 },
    shadowOpacity: 0.16,
    shadowRadius: 20,
    elevation: 10,
  },
  overlayHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  overlayBackButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  overlayBackLabel: {
    fontSize: 16,
    fontWeight: '600',
  },
  overlayTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
  },
  overlayScroll: {
    flex: 1,
  },
  overlayContent: {
    paddingBottom: 40,
    gap: 16,
  },
  overlayFab: {
    position: 'absolute',
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 14,
    elevation: 6,
  },
  overlayList: {
    gap: 12,
  },
  vetGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 12,
    paddingBottom: 16,
  },
  vetCard: {
    width: '48%',
    borderRadius: 18,
    paddingVertical: 24,
    paddingHorizontal: 16,
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
    alignItems: 'center',
    gap: 14,
  },
  vetCardIcon: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
  },
  vetCardLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0F172A',
    textAlign: 'center',
  },
  vetPrimaryCard: {
    width: '100%',
    marginTop: 12,
    borderRadius: 18,
    padding: 18,
    backgroundColor: '#F3F4F6',
    gap: 8,
  },
  vetPrimaryTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
  },
  vetPrimarySubtitle: {
    fontSize: 13,
    color: '#4B5563',
  },
  vetPrimaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  vetPrimaryDetail: {
    fontSize: 13,
    color: '#1F2937',
  },
  vetDetailContainer: {
    gap: 20,
  },
  vetDetailCountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  vetDetailCountLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
  },
  vetDetailCountBadge: {
    minWidth: 34,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: '#EEF2FF',
    alignItems: 'center',
  },
  vetDetailCountText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#312E81',
  },
  vetDetailCountLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  vetDetailLink: {
    fontSize: 13,
    fontWeight: '600',
  },
  vetSearchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 24,
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#FFFFFF',
    gap: 10,
  },
  vetSearchInput: {
    flex: 1,
    fontSize: 15,
    paddingVertical: 0,
  },
  vetEmptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 48,
    backgroundColor: '#F9FAFB',
    borderRadius: 18,
  },
  vetEmptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
  },
  vetEmptySubtitle: {
    fontSize: 13,
    color: '#6B7280',
    textAlign: 'center',
    paddingHorizontal: 16,
  },
  noteQuickWrapper: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    backgroundColor: 'rgba(15, 23, 42, 0.2)',
  },
  noteQuickCard: {
    width: 260,
    borderRadius: 24,
    paddingVertical: 20,
    paddingHorizontal: 18,
    gap: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.18,
    shadowRadius: 18,
    elevation: 6,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  noteQuickOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingVertical: 12,
  },
  noteQuickIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  noteQuickLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  noteQuickDivider: {
    height: 1,
    backgroundColor: '#E5E7EB',
    marginVertical: 6,
  },
  tabCard: {
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
    marginBottom: 12,
  },
  tabRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  tabRowText: {
    flex: 1,
  },
  tabPrimary: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1E293B',
  },
  tabSecondary: {
    fontSize: 13,
    color: '#64748B',
    marginTop: 2,
  },
  tabDetailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 10,
  },
  tabDetailText: {
    fontSize: 13,
    color: '#475569',
  },
  emptyText: {
    textAlign: 'center',
    color: '#64748B',
    paddingVertical: 24,
  },
  mediaCarousel: {
    paddingVertical: 12,
    gap: 16,
  },
  mediaCard: {
    width: 160,
    marginRight: 16,
  },
  mediaImage: {
    width: '100%',
    height: 160,
    borderRadius: 16,
    backgroundColor: '#E2E8F0',
  },
  mediaCaption: {
    marginTop: 8,
    fontSize: 12,
    color: '#475569',
  },
  mediaEmptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 24,
  },
  addMediaButton: {
    borderWidth: 1,
    borderStyle: 'dashed',
    borderRadius: 16,
    paddingVertical: 18,
    paddingHorizontal: 24,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 12,
  },
  addMediaText: {
    fontSize: 14,
    fontWeight: '600',
  },
  noteMenuWrapper: {
    flex: 1,
    justifyContent: 'flex-end',
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  noteMenuContainer: {
    alignItems: 'flex-end',
  },
  noteListOverlay: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 72 : 48,
    paddingBottom: 32,
  },
  noteListHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  noteListBackButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  noteListBackLabel: {
    fontSize: 16,
    fontWeight: '600',
  },
  noteListTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
  },
  noteListEmptyCard: {
    borderWidth: 1,
    borderRadius: 18,
    paddingVertical: 32,
    paddingHorizontal: 20,
    alignItems: 'center',
    gap: 12,
  },
  noteListEmptyText: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
  },
  noteListScroll: {
    flex: 1,
  },
  noteListScrollContent: {
    gap: 12,
    paddingBottom: 80,
  },
  noteListItem: {
    position: 'relative',
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 3,
  },
  noteListItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingRight: 36,
  },
  noteListItemText: {
    flex: 1,
    fontSize: 15,
    lineHeight: 22,
    color: '#1F2937',
  },
  noteListItemMore: {
    position: 'absolute',
    top: 10,
    right: 8,
    padding: 6,
    borderRadius: 16,
  },
  noteListAddButton: {
    position: 'absolute',
    bottom: 32,
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.18,
    shadowRadius: 14,
    elevation: 6,
  },
  noteModalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.3)',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  noteModalWrapper: {
    width: '100%',
  },
  noteModalCard: {
    borderRadius: 20,
    padding: 20,
    gap: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 6,
  },
  noteModalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
  },
  noteInput: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    minHeight: 100,
    textAlignVertical: 'top',
    fontSize: 15,
  },
  noteModalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
  },
  noteModalButton: {
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 999,
  },
  noteModalCancel: {
    backgroundColor: '#E5E7EB',
  },
  noteModalSave: {
    backgroundColor: '#0E1A4F',
  },
  noteModalCancelText: {
    color: '#1F2937',
    fontWeight: '600',
  },
  noteModalSaveText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  editCard: {
    marginTop: 24,
    marginHorizontal: 20,
    marginBottom: 24,
    borderRadius: 20,
    padding: 20,
    backgroundColor: '#FFFFFF',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
    borderWidth: StyleSheet.hairlineWidth,
  },
  editTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 16,
  },
  inputContainer: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 6,
  },
  input: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
    borderColor: '#E2E8F0',
  },
  textArea: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  halfWidth: {
    flex: 1,
  },
  roleButtons: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 8,
  },
  roleButton: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: 'center',
    borderColor: '#E2E8F0',
    backgroundColor: '#F8FAFC',
  },
  roleButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#475569',
  },
  editActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 12,
  },
  secondaryButton: {
    flex: 1,
    paddingVertical: 14,
    borderWidth: 1,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  primaryButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  bottomBar: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: Platform.OS === 'ios' ? 20 : 10,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
    pointerEvents: 'box-none',
  },
  bottomBarInner: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    width: '100%',
    maxWidth: 420,
    borderRadius: 28,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: 'rgba(15,23,42,0.06)',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  bottomItem: {
    alignItems: 'center',
    flex: 1,
    gap: 4,
  },
  bottomLabel: {
    fontSize: 12,
    fontWeight: '600',
  },
  medicalCard: {
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
    marginBottom: 12,
    gap: 12,
  },
  medicalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  medicalHeaderText: {
    flex: 1,
    gap: 4,
  },
  medicalVetName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
  },
  medicalClinic: {
    fontSize: 13,
    color: '#6B7280',
  },
  medicalMenuButton: {
    padding: 6,
    borderRadius: 16,
  },
  medicalMetaRow: {
    gap: 6,
  },
  medicalMetaLabel: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
    color: '#6B7280',
  },
  medicalMetaValue: {
    fontSize: 14,
    color: '#1F2937',
    fontWeight: '600',
  },
  medicalAttachmentRow: {
    gap: 8,
  },
  medicalAttachmentList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  attachmentChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#EEF2FF',
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  attachmentLabel: {
    fontSize: 12,
    color: '#1F2937',
    maxWidth: 160,
  },
  medicalTimestampBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#DBEAFE',
  },
  medicalTimestampText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1D4ED8',
  },
  clearSearchButton: {
    padding: 4,
  },
  overlayModalRoot: {
    flex: 1,
    position: 'relative',
  },
  medicationOverlayCard: {
    borderRadius: 18,
    borderWidth: 1,
    padding: 16,
    gap: 12,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  medicationOverlayHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  medicationOverlayTitleBlock: {
    flex: 1,
    gap: 4,
  },
  medicationOverlayTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  medicationOverlaySubtitle: {
    fontSize: 13,
    fontWeight: '500',
  },
  medicationOverlayReason: {
    fontSize: 13,
    fontWeight: '500',
  },
  medicationOverlayRow: {
    flexDirection: 'row',
    gap: 16,
  },
  medicationOverlayColumn: {
    flex: 1,
    gap: 4,
  },
  medicationOverlayLabel: {
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  medicationOverlayValue: {
    fontSize: 14,
    fontWeight: '700',
  },
  medicationTimestampChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  medicationTimestampText: {
    fontSize: 12,
    fontWeight: '600',
  },
  visitOverlayCard: {
    borderRadius: 18,
    borderWidth: 1,
    padding: 16,
    gap: 12,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  visitOverlayHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  visitOverlayTitle: {
    fontSize: 16,
    fontWeight: '700',
    flex: 1,
    marginRight: 12,
  },
  visitOverlayRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  visitOverlayLabel: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  visitOverlayValue: {
    fontSize: 14,
    fontWeight: '600',
    flex: 1,
    textAlign: 'right',
  },
  visitTimestampChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  visitTimestampText: {
    fontSize: 12,
    fontWeight: '600',
  },
  immunizationOverlayCard: {
    borderRadius: 18,
    borderWidth: 1,
    padding: 16,
    gap: 12,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  immunizationOverlayRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  immunizationOverlayLabel: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  immunizationOverlayValue: {
    fontSize: 14,
    fontWeight: '700',
    textAlign: 'right',
    flex: 1,
  },
  scheduleOverlayCard: {
    borderRadius: 18,
    borderWidth: 1,
    padding: 16,
    gap: 12,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  scheduleOverlayTitle: {
    fontSize: 16,
    fontWeight: '700',
    flex: 1,
    marginRight: 12,
  },
  scheduleOverlayMore: {
    padding: 4,
    marginRight: -4,
  },
  scheduleOverlayMoreIcon: {
    transform: [{ rotate: '90deg' }],
  },
  scheduleOverlayDescription: {
    fontSize: 13,
    fontWeight: '500',
  },
  scheduleOverlayRow: {
    flexDirection: 'row',
    gap: 12,
  },
  scheduleOverlayColumn: {
    flex: 1,
    gap: 4,
  },
  scheduleOverlayLabel: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  scheduleOverlayValue: {
    fontSize: 14,
    fontWeight: '700',
  },
  nutritionOverlayCard: {
    borderRadius: 18,
    borderWidth: 1,
    padding: 16,
    gap: 10,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  nutritionOverlayTitle: {
    fontSize: 16,
    fontWeight: '700',
    flex: 1,
    marginRight: 12,
  },
  nutritionOverlaySubtitle: {
    fontSize: 13,
    fontWeight: '500',
  },
  nutritionOverlayRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  nutritionOverlayValue: {
    fontSize: 13,
    fontWeight: '600',
    flex: 1,
  },
  nutritionTimestampChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  nutritionTimestampText: {
    fontSize: 12,
    fontWeight: '600',
  },
  nutritionSummaryContainer: {
    gap: 20,
    paddingBottom: 8,
  },
  nutritionDateRow: {
    gap: 12,
    paddingHorizontal: 4,
    paddingBottom: 4,
  },
  nutritionDateChip: {
    minWidth: 72,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFF',
  },
  nutritionDateLabel: {
    fontSize: 13,
    fontWeight: '600',
  },
  nutritionSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  nutritionSectionTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  nutritionSectionLink: {
    fontSize: 13,
    fontWeight: '600',
  },
  nutritionCardRow: {
    gap: 14,
    paddingVertical: 6,
    paddingRight: 8,
  },
  nutritionEmptyCard: {
    width: 220,
    borderRadius: 18,
    borderWidth: 1,
    paddingVertical: 32,
    paddingHorizontal: 18,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  nutritionEmptyTitle: {
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
  nutritionEmptySubtitle: {
    fontSize: 12,
    textAlign: 'center',
  },
  nutritionSummaryCard: {
    width: 240,
    borderRadius: 18,
    borderWidth: 1,
    padding: 16,
    gap: 10,
    shadowOpacity: 0.08,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 6 },
    elevation: 3,
  },
  nutritionSummaryHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 12,
  },
  nutritionSummaryHeading: {
    flex: 1,
    gap: 4,
  },
  nutritionSummaryTitle: {
    fontSize: 15,
    fontWeight: '700',
  },
  nutritionSummarySubtitle: {
    fontSize: 13,
    fontWeight: '500',
  },
  nutritionSummaryMore: {
    padding: 4,
  },
  nutritionSummaryMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  nutritionSummaryMeta: {
    fontSize: 13,
    flex: 1,
  },
  nutritionSummaryBadge: {
    alignSelf: 'flex-start',
    marginTop: 4,
    paddingVertical: 4,
    paddingHorizontal: 12,
    borderRadius: 999,
  },
  nutritionSummaryBadgeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  allergySummaryCard: {
    width: 200,
    borderRadius: 18,
    borderWidth: 1,
    padding: 16,
    gap: 8,
    shadowOpacity: 0.08,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 6 },
    elevation: 3,
  },
  allergySummaryMeta: {
    fontSize: 12,
  },
  appointmentSummaryCard: {
    borderRadius: 18,
    borderWidth: 1,
    padding: 16,
    gap: 12,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  appointmentSummaryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  appointmentSummaryTitle: {
    fontSize: 16,
    fontWeight: '700',
    flex: 1,
    marginRight: 12,
  },
  appointmentSummaryStatus: {
    paddingVertical: 4,
    paddingHorizontal: 12,
    borderRadius: 999,
  },
  appointmentSummaryStatusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  appointmentSummaryCategory: {
    fontSize: 13,
    fontWeight: '500',
  },
  appointmentSummaryDescription: {
    fontSize: 12,
    fontWeight: '500',
  },
  appointmentSummaryMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  appointmentSummaryMeta: {
    fontSize: 12,
  },
  appointmentSummaryRow: {
    gap: 16,
    paddingVertical: 8,
    paddingRight: 8,
  },
});


