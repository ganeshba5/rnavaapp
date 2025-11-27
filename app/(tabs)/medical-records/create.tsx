import { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Platform,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
  Modal,
  ActionSheetIOS,
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system/legacy';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Colors, ThemeColors } from '@/constants/theme';
import { useApp } from '@/context/AppContext';
import { MedicalAttachment, MedicalRecord, VetProfile } from '@/types';

const REPORT_TYPES = ['Vaccine', 'General Checkup', 'Surgery', 'Lab Results', 'Prescription', 'Other'];
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB

interface NewVetData {
  name: string;
  clinicName: string;
  phone: string;
  email: string;
}

const EMPTY_NEW_VET: NewVetData = {
  name: '',
  clinicName: '',
  phone: '',
  email: '',
};

export default function MedicalRecordForm() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const styles = useMemo(() => createStyles(colors), [colors]);
  const params = useLocalSearchParams<{ canineId?: string; recordId?: string }>();
  const { canineId: canineIdParam, recordId } = params;

  const {
    addMedicalRecord,
    updateMedicalRecord,
    medicalRecords,
    vets,
    addVet,
  } = useApp();

  const existingRecord = useMemo<MedicalRecord | undefined>(
    () => (recordId ? medicalRecords.find((record) => record.id === recordId) : undefined),
    [medicalRecords, recordId]
  );
  const resolvedCanineId = canineIdParam || existingRecord?.canineId;
  const isEditing = !!existingRecord;

  const [vetName, setVetName] = useState('');
  const [clinicName, setClinicName] = useState('');
  const [reportType, setReportType] = useState('');
  const [attachments, setAttachments] = useState<MedicalAttachment[]>([]);
  const [selectedVetId, setSelectedVetId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const [showVetModal, setShowVetModal] = useState(false);
  const [vetSearch, setVetSearch] = useState('');
  const [showAddVetForm, setShowAddVetForm] = useState(false);
  const [newVetData, setNewVetData] = useState<NewVetData>(EMPTY_NEW_VET);

  const filteredVets = useMemo(() => {
    const term = vetSearch.trim().toLowerCase();
    if (!term) {
      return vets;
    }
    return vets.filter((vet) =>
      vet.name.toLowerCase().includes(term) || (vet.clinicName ?? '').toLowerCase().includes(term)
    );
  }, [vetSearch, vets]);

  useEffect(() => {
    if (existingRecord) {
      setVetName(existingRecord.vetName);
      setClinicName(existingRecord.clinicName);
      setReportType(existingRecord.reportType);
      setAttachments(existingRecord.attachments ?? []);
      const matchedVet = vets.find(
        (vet) => vet.name.toLowerCase() === existingRecord.vetName.toLowerCase()
      );
      if (matchedVet) {
        setSelectedVetId(matchedVet.id);
      } else {
        setSelectedVetId(null);
      }
    }
  }, [existingRecord, vets]);

  const openVetModal = () => {
    setVetSearch('');
    setShowAddVetForm(false);
    setNewVetData(EMPTY_NEW_VET);
    setShowVetModal(true);
  };

  const closeVetModal = () => {
    setShowVetModal(false);
    setShowAddVetForm(false);
    setNewVetData(EMPTY_NEW_VET);
  };

  const handleSelectVet = (vet: VetProfile) => {
    setSelectedVetId(vet.id);
    setVetName(vet.name);
    setClinicName(vet.clinicName ?? '');
    closeVetModal();
  };

  const handleAddNewVet = async () => {
    if (!newVetData.name.trim()) {
      Alert.alert('Validation', 'Please enter the veterinarian name.');
      return;
    }
    const created = await addVet({
      name: newVetData.name.trim(),
      clinicName: newVetData.clinicName.trim(),
      phone: newVetData.phone.trim(),
      email: newVetData.email.trim(),
      address: '',
      city: '',
      state: '',
      zipCode: '',
      country: 'US',
      specialization: '',
      notes: '',
    });
    handleSelectVet(created);
  };

  const validateForm = () => {
    if (!resolvedCanineId) {
      Alert.alert('Error', 'Missing canine information. Please go back and try again.');
      return false;
    }
    if (!vetName.trim()) {
      Alert.alert('Validation', 'Please enter the veterinarian name.');
      return false;
    }
    if (!clinicName.trim()) {
      Alert.alert('Validation', 'Please enter the clinic name.');
      return false;
    }
    if (!reportType.trim()) {
      Alert.alert('Validation', 'Please select the medical report type.');
      return false;
    }
    if (attachments.length === 0) {
      Alert.alert('Validation', 'Please upload at least one medical report.');
      return false;
    }
    return true;
  };

  const handlePickReportType = () => {
    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options: ['Cancel', ...REPORT_TYPES],
          cancelButtonIndex: 0,
        },
        (index) => {
          if (index > 0) {
            setReportType(REPORT_TYPES[index - 1]);
          }
        }
      );
    } else {
      Alert.alert('Select Report Type', undefined, [
        ...REPORT_TYPES.map((type) => ({ text: type, onPress: () => setReportType(type) })),
        { text: 'Cancel', style: 'cancel' },
      ]);
    }
  };

  const handleUploadPhoto = async () => {
    try {
      const granted = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!granted.granted) {
        Alert.alert('Permission needed', 'Allow photo library access to upload images.');
        return;
      }

      console.log('[MedicalRecord] Opening image picker');
      const result = await ImagePicker.launchImageLibraryAsync({
        allowsEditing: false,
        quality: 0.8,
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
      });

      console.log('[MedicalRecord] Image picker result:', result);
      if (!result.canceled && result.assets?.length) {
        const asset = result.assets[0];
        if (asset.uri) {
          let size = asset.fileSize;
          try {
            const info = await FileSystem.getInfoAsync(asset.uri);
            if ('size' in info && typeof info.size === 'number') size = info.size;
          } catch (error) {
            console.warn('Unable to determine image size:', error);
          }
          if (size && size > MAX_FILE_SIZE) {
            Alert.alert('File too large', 'Maximum file size is 10 MB.');
            return;
          }
          const attachment: MedicalAttachment = {
            id: `att-${Date.now()}`,
            type: 'photo',
            uri: asset.uri,
            name: asset.fileName || 'Photo.jpg',
            size,
            mimeType: asset.mimeType || 'image/jpeg',
          };
          console.log('[MedicalRecord] Adding photo attachment:', attachment);
          setAttachments((prev) => [...prev, attachment]);
        }
      } else {
        console.log('[MedicalRecord] Image picker cancelled or no assets selected');
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Unable to pick photo. Please try again.');
    }
  };

  const handleUploadFile = async () => {
    try {
      console.log('[MedicalRecord] Opening document picker');
      const result = await DocumentPicker.getDocumentAsync({
        copyToCacheDirectory: true,
        type: [
          'application/pdf',
          'application/msword',
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          'application/rtf',
          '*/*',
        ],
      });

      console.log('[MedicalRecord] Document picker result:', result);
      if (!result.canceled && result.assets?.length) {
        const asset = result.assets[0];
        if (!asset?.uri) {
          console.warn('[MedicalRecord] Document picker returned asset without URI');
          return;
        }

        let size = asset.size;
        try {
          const info = await FileSystem.getInfoAsync(asset.uri);
          if ('size' in info && typeof info.size === 'number') size = info.size;
        } catch (error) {
          console.warn('Unable to determine document size:', error);
        }
        if (size && size > MAX_FILE_SIZE) {
          Alert.alert('File too large', 'Maximum file size is 10 MB.');
          return;
        }
        const attachment: MedicalAttachment = {
          id: `att-${Date.now()}`,
          type: 'file',
          uri: asset.uri,
          name: asset.name ?? 'Document',
          size,
          mimeType: asset.mimeType ?? undefined,
        };
        console.log('[MedicalRecord] Adding document attachment:', attachment);
        setAttachments((prev) => [...prev, attachment]);
      } else {
        console.log('[MedicalRecord] Document picker cancelled');
      }
    } catch (error) {
      console.error('Error picking file:', error);
      Alert.alert('Error', 'Unable to pick file. Please try again.');
    }
  };

  const handleRemoveAttachment = (id: string) => {
    setAttachments((prev) => prev.filter((attachment) => attachment.id !== id));
  };

  const handleSave = async () => {
    if (!validateForm() || !resolvedCanineId) return;

    setIsSaving(true);
    try {
      const payload = {
        canineId: resolvedCanineId,
        vetName: vetName.trim(),
        clinicName: clinicName.trim(),
        reportType,
        attachments,
      };
      if (isEditing && recordId) {
        await updateMedicalRecord(recordId, payload);
      } else {
        await addMedicalRecord(payload);
      }
      Alert.alert('Success', `Medical record ${isEditing ? 'updated' : 'saved'} successfully.`, [
        {
          text: 'OK',
          onPress: () => router.back(),
        },
      ]);
    } catch (error) {
      console.error('Error saving medical record:', error);
      Alert.alert('Error', 'Unable to save medical record. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <>
      <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 40 }}>
        <ThemedView style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <IconSymbol name="chevron.left" size={24} color={Colors[colorScheme ?? 'light'].text} />
            <ThemedText style={styles.backLabel}>Back</ThemedText>
          </TouchableOpacity>
          <ThemedText type="title" style={styles.headerTitle}>
            {isEditing ? 'Edit Medical Record' : 'Create Medical Record'}
          </ThemedText>
          <View style={{ width: 44 }} />
        </ThemedView>

        <ThemedView style={styles.form}>
          <ThemedText style={styles.label}>Veterinarian Name *</ThemedText>
          <View style={styles.inputWithIcon}>
            <TextInput
              style={styles.inputField}
              value={vetName}
              onChangeText={(text) => {
                setVetName(text);
                if (selectedVetId) {
                  setSelectedVetId(null);
                }
              }}
              placeholder="Enter veterinarian name"
              maxLength={60}
            />
            <TouchableOpacity
              style={styles.inputIconButton}
              onPress={openVetModal}
              accessibilityRole="button"
              accessibilityLabel="Select or add veterinarian">
              <IconSymbol name="chevron.down" size={18} color={Colors[colorScheme ?? 'light'].icon} />
            </TouchableOpacity>
          </View>

          <ThemedText style={styles.label}>Clinic Name *</ThemedText>
          <TextInput
            style={styles.input}
            value={clinicName}
            onChangeText={(text) => {
              setClinicName(text);
              if (selectedVetId) {
                setSelectedVetId(null);
              }
            }}
            placeholder="Enter clinic name"
            maxLength={80}
          />

          <ThemedText style={styles.label}>Medical Report Type *</ThemedText>
          <TouchableOpacity style={styles.selectInput} onPress={handlePickReportType}>
            <ThemedText style={[styles.selectText, !reportType && styles.placeholderText]}>
              {reportType || 'Select type'}
            </ThemedText>
            <IconSymbol name="chevron.down" size={18} color={Colors[colorScheme ?? 'light'].icon} />
          </TouchableOpacity>

          <ThemedText style={styles.label}>Upload Medical Reports *</ThemedText>
          <View style={styles.uploadRow}>
            <TouchableOpacity style={styles.uploadButton} onPress={handleUploadPhoto}>
              <IconSymbol name="camera" size={18} color={Colors[colorScheme ?? 'light'].tint} />
              <ThemedText style={styles.uploadText}>Upload Photo</ThemedText>
            </TouchableOpacity>
            <TouchableOpacity style={styles.uploadButton} onPress={handleUploadFile}>
              <IconSymbol name="paperclip" size={18} color={Colors[colorScheme ?? 'light'].tint} />
              <ThemedText style={styles.uploadText}>Upload File</ThemedText>
            </TouchableOpacity>
          </View>
          <ThemedText style={styles.supportText}>
            {`Supported File Formats Pdf, Doc, Docx, RTF.
Supported Image Formats JPG, PNG. Maximum File Size 10 MB`}
          </ThemedText>

          {attachments.length > 0 && (
            <View style={styles.attachmentList}>
              {attachments.map((attachment) => (
                <View key={attachment.id} style={styles.attachmentChip}>
                  <IconSymbol
                    name={attachment.type === 'photo' ? 'photo' : 'doc.fill'}
                    size={16}
                    color={Colors[colorScheme ?? 'light'].tint}
                  />
                  <ThemedText style={styles.attachmentLabel} numberOfLines={1}>
                    {attachment.name}
                  </ThemedText>
                  <TouchableOpacity onPress={() => handleRemoveAttachment(attachment.id)}>
                    <IconSymbol name="xmark.circle.fill" size={18} color="#9CA3AF" />
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          )}

          <View style={styles.actionsRow}>
            <TouchableOpacity
              style={[styles.actionButton, styles.cancelButton]}
              onPress={() => router.back()}
              disabled={isSaving}>
              <ThemedText style={[styles.actionButtonText, styles.cancelText]}>Cancel</ThemedText>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionButton, styles.saveButton]}
              onPress={handleSave}
              disabled={isSaving}>
              <ThemedText style={[styles.actionButtonText, styles.saveText]}>
                {isSaving ? 'Saving...' : 'Save'}
              </ThemedText>
            </TouchableOpacity>
          </View>
        </ThemedView>
      </ScrollView>

      <Modal visible={showVetModal} animationType="slide" transparent onRequestClose={closeVetModal}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, { backgroundColor: colors.background }]}> 
            <View style={styles.modalHeader}>
              <TouchableOpacity onPress={closeVetModal} style={styles.modalBackButton}>
                <IconSymbol name="xmark" size={20} color={colors.text} />
              </TouchableOpacity>
              <ThemedText style={styles.modalTitle}>Select Veterinarian</ThemedText>
              <View style={{ width: 24 }} />
            </View>

            {!showAddVetForm ? (
              <>
                <View style={[styles.searchBar, { borderColor: colors.icon }]}>
                  <IconSymbol name="magnifyingglass" size={18} color={colors.icon} />
                  <TextInput
                    style={[styles.searchInput, { color: colors.text }]}
                    placeholder="Search vets"
                    placeholderTextColor={`${colors.icon}99`}
                    value={vetSearch}
                    onChangeText={setVetSearch}
                  />
                </View>
                <ScrollView style={styles.vetList}>
                  {filteredVets.map((vet) => (
                    <TouchableOpacity
                      key={vet.id}
                      style={styles.vetItem}
                      onPress={() => handleSelectVet(vet)}>
                      <ThemedText style={styles.vetItemName}>{vet.name}</ThemedText>
                      {vet.clinicName ? (
                        <ThemedText style={styles.vetItemClinic}>{vet.clinicName}</ThemedText>
                      ) : null}
                    </TouchableOpacity>
                  ))}
                  {filteredVets.length === 0 && (
                    <View style={styles.emptyListState}>
                      <IconSymbol name="exclamationmark.triangle" size={26} color={colors.icon} />
                      <ThemedText style={styles.emptyListText}>No vets found</ThemedText>
                    </View>
                  )}
                </ScrollView>
                <View style={styles.modalActions}>
                  <TouchableOpacity
                    style={styles.modalSecondaryButton}
                    onPress={() => {
                      setSelectedVetId(null);
                      closeVetModal();
                    }}>
                    <ThemedText style={styles.modalSecondaryText}>Use Manual Entry</ThemedText>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.modalPrimaryButton, { backgroundColor: colors.tint }]}
                    onPress={() => setShowAddVetForm(true)}>
                    <IconSymbol name="plus" size={18} color="#fff" />
                    <ThemedText style={styles.modalPrimaryText}>Add New Vet</ThemedText>
                  </TouchableOpacity>
                </View>
              </>
            ) : (
              <View style={styles.addVetForm}>
                <ThemedText style={styles.modalSubtitle}>New Veterinarian</ThemedText>
                <TextInput
                  style={styles.input}
                  placeholder="Name"
                  value={newVetData.name}
                  onChangeText={(text) => setNewVetData((prev) => ({ ...prev, name: text }))}
                />
                <TextInput
                  style={styles.input}
                  placeholder="Clinic Name"
                  value={newVetData.clinicName}
                  onChangeText={(text) => setNewVetData((prev) => ({ ...prev, clinicName: text }))}
                />
                <TextInput
                  style={styles.input}
                  placeholder="Phone"
                  keyboardType="phone-pad"
                  value={newVetData.phone}
                  onChangeText={(text) => setNewVetData((prev) => ({ ...prev, phone: text }))}
                />
                <TextInput
                  style={styles.input}
                  placeholder="Email"
                  keyboardType="email-address"
                  value={newVetData.email}
                  onChangeText={(text) => setNewVetData((prev) => ({ ...prev, email: text }))}
                />
                <View style={styles.modalActions}>
                  <TouchableOpacity
                    style={styles.modalSecondaryButton}
                    onPress={() => {
                      setShowAddVetForm(false);
                      setNewVetData(EMPTY_NEW_VET);
                    }}>
                    <ThemedText style={styles.modalSecondaryText}>Cancel</ThemedText>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.modalPrimaryButton, { backgroundColor: colors.tint }]}
                    onPress={handleAddNewVet}>
                    <IconSymbol name="checkmark" size={18} color="#fff" />
                    <ThemedText style={styles.modalPrimaryText}>Save Vet</ThemedText>
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </View>
        </View>
      </Modal>
    </>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 20,
      paddingTop: Platform.OS === 'ios' ? 60 : 24,
      paddingBottom: 12,
      justifyContent: 'space-between',
    },
    backButton: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
    },
    backLabel: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.text,
    },
    headerTitle: {
      fontSize: 24,
      fontWeight: '700',
      color: colors.text,
    },
    form: {
      marginHorizontal: 20,
      borderRadius: 24,
      padding: 20,
      backgroundColor: colors.surface,
      shadowColor: colors.shadow,
      shadowOffset: { width: 0, height: 10 },
      shadowOpacity: 0.12,
      shadowRadius: 20,
      elevation: 6,
      gap: 14,
      borderWidth: 1,
      borderColor: colors.border,
    },
    label: {
      fontSize: 14,
      fontWeight: '600',
      color: colors.text,
    },
    input: {
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 12,
      paddingHorizontal: 14,
      paddingVertical: 12,
      fontSize: 16,
      backgroundColor: colors.surface,
      color: colors.text,
    },
    inputWithIcon: {
      flexDirection: 'row',
      alignItems: 'center',
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 12,
      backgroundColor: colors.surface,
    },
    inputField: {
      flex: 1,
      paddingHorizontal: 14,
      paddingVertical: 12,
      fontSize: 16,
      color: colors.text,
    },
    inputIconButton: {
      paddingHorizontal: 12,
      paddingVertical: 10,
    },
    selectInput: {
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 12,
      paddingHorizontal: 14,
      paddingVertical: 14,
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      backgroundColor: colors.surface,
    },
    selectText: {
      fontSize: 16,
      color: colors.text,
    },
    placeholderText: {
      color: colors.tertiaryText,
    },
    uploadRow: {
      flexDirection: 'row',
      gap: 12,
    },
    uploadButton: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      paddingVertical: 12,
      borderRadius: 999,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surface,
      shadowColor: colors.shadow,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.08,
      shadowRadius: 8,
      elevation: 2,
    },
    uploadText: {
      fontSize: 14,
      fontWeight: '600',
      color: colors.text,
    },
    supportText: {
      fontSize: 12,
      color: colors.tertiaryText,
      lineHeight: 18,
    },
    attachmentList: {
      gap: 8,
    },
    attachmentChip: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      borderRadius: 16,
      paddingHorizontal: 12,
      paddingVertical: 8,
      backgroundColor: colors.tintSoft,
    },
    attachmentLabel: {
      fontSize: 13,
      color: colors.text,
      flex: 1,
    },
    actionsRow: {
      flexDirection: 'row',
      gap: 12,
      marginTop: 8,
    },
    actionButton: {
      flex: 1,
      paddingVertical: 14,
      borderRadius: 999,
      alignItems: 'center',
      justifyContent: 'center',
    },
    cancelButton: {
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surfaceMuted,
    },
    saveButton: {
      backgroundColor: colors.tint,
    },
    actionButtonText: {
      fontSize: 16,
      fontWeight: '700',
    },
    cancelText: {
      color: colors.text,
    },
    saveText: {
      color: colors.inverseText,
    },
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(17, 24, 39, 0.45)',
      justifyContent: 'flex-end',
    },
    modalCard: {
      borderTopLeftRadius: 24,
      borderTopRightRadius: 24,
      padding: 20,
      maxHeight: '90%',
      shadowColor: colors.shadow,
      shadowOffset: { width: 0, height: -10 },
      shadowOpacity: 0.15,
      shadowRadius: 20,
      elevation: 12,
      backgroundColor: colors.surface,
      borderTopWidth: 1,
      borderColor: colors.border,
    },
    modalHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 16,
    },
    modalBackButton: {
      padding: 6,
      borderRadius: 16,
      backgroundColor: colors.surfaceMuted,
    },
    modalTitle: {
      fontSize: 18,
      fontWeight: '700',
      color: colors.text,
    },
    searchBar: {
      flexDirection: 'row',
      alignItems: 'center',
      borderWidth: 1,
      borderRadius: 999,
      paddingHorizontal: 16,
      paddingVertical: 10,
      gap: 10,
      marginBottom: 16,
      borderColor: colors.border,
      backgroundColor: colors.surface,
    },
    searchInput: {
      flex: 1,
      fontSize: 15,
      color: colors.text,
    },
    vetList: {
      flexGrow: 0,
      maxHeight: 320,
    },
    vetItem: {
      paddingHorizontal: 14,
      paddingVertical: 12,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.border,
      marginBottom: 12,
      backgroundColor: colors.surface,
    },
    vetItemName: {
      fontSize: 15,
      fontWeight: '600',
      color: colors.text,
    },
    vetItemClinic: {
      fontSize: 12,
      color: colors.secondaryText,
      marginTop: 4,
    },
    emptyListState: {
      alignItems: 'center',
      gap: 8,
      paddingVertical: 32,
    },
    emptyListText: {
      fontSize: 14,
      color: colors.tertiaryText,
    },
    modalActions: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      gap: 12,
      marginTop: 12,
    },
    modalSecondaryButton: {
      flex: 1,
      paddingVertical: 12,
      borderRadius: 999,
      borderWidth: 1,
      borderColor: colors.border,
      alignItems: 'center',
      backgroundColor: colors.surface,
    },
    modalSecondaryText: {
      fontSize: 14,
      fontWeight: '600',
      color: colors.text,
    },
    modalPrimaryButton: {
      flex: 1,
      paddingVertical: 12,
      borderRadius: 999,
      alignItems: 'center',
      flexDirection: 'row',
      justifyContent: 'center',
      gap: 6,
      backgroundColor: colors.tint,
    },
    modalPrimaryText: {
      fontSize: 14,
      fontWeight: '600',
      color: colors.inverseText,
    },
    addVetForm: {
      gap: 12,
    },
    modalSubtitle: {
      fontSize: 16,
      fontWeight: '600',
      marginBottom: 4,
      color: colors.text,
    },
  });
