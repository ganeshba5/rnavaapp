import { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Pressable,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useApp } from '@/context/AppContext';
import { UserProfile } from '@/types';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { isSupabaseConfigured } from '@/lib/supabase';
import { uploadMediaToSupabase } from '@/services/storage';

function createInitialForm(profile?: UserProfile | null): Partial<UserProfile> {
  return {
    firstName: profile?.firstName ?? '',
    lastName: profile?.lastName ?? '',
    email: profile?.email ?? '',
    phone: profile?.phone ?? '',
    country: profile?.country ?? 'US',
    role: profile?.role ?? 'Pet Owner',
    addressLine1: profile?.addressLine1 ?? '',
    addressLine2: profile?.addressLine2 ?? '',
    city: profile?.city ?? '',
    state: profile?.state ?? '',
    zipCode: profile?.zipCode ?? '',
    profilePhotoUrl: profile?.profilePhotoUrl ?? '',
  };
}

export default function UserProfileScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const { mode } = useLocalSearchParams<{ mode?: string }>();
  const normalizedMode = Array.isArray(mode) ? mode[0] : mode;
  const { userProfile, setUserProfile, updateUserProfile, canines, appointments } = useApp();

  const [isEditing, setIsEditing] = useState(!userProfile || normalizedMode === 'edit');
  const [formData, setFormData] = useState<Partial<UserProfile>>(() => createInitialForm(userProfile));

  useEffect(() => {
    setFormData(createInitialForm(userProfile));
  }, [userProfile?.id]);

  useEffect(() => {
    if (normalizedMode === 'edit') {
      setIsEditing(true);
    }
  }, [normalizedMode]);

  const userCanines = useMemo(
    () => (userProfile ? canines.filter((c) => c.userId === userProfile.id) : []),
    [userProfile?.id, canines]
  );

  const upcomingAppointmentsCount = useMemo(() => {
    if (!userProfile) return 0;
    const today = new Date();
    return appointments.filter((appointment) => {
      if (appointment.status !== 'Scheduled') return false;
      const appointmentDate = new Date(`${appointment.date}T${appointment.time ?? '00:00'}`);
      return appointmentDate >= today;
    }).length;
  }, [appointments, userProfile?.id]);

  const fullName = useMemo(() => {
    const first = formData.firstName?.trim() || userProfile?.firstName || '';
    const last = formData.lastName?.trim() || userProfile?.lastName || '';
    const combined = `${first} ${last}`.trim();
    return combined.length > 0 ? combined : 'Pet Owner';
  }, [formData.firstName, formData.lastName, userProfile?.firstName, userProfile?.lastName]);

  const formattedUpdatedAt = useMemo(() => {
    const source = userProfile?.updatedAt;
    return source ? new Date(source).toLocaleString() : '--';
  }, [userProfile?.updatedAt]);

  const handleCancelEdit = () => {
    if (userProfile) {
      setFormData(createInitialForm(userProfile));
    }
    setIsEditing(false);
  };

  const handleSave = async () => {
    const requiredFields = ['firstName', 'lastName', 'email', 'phone'] as const;
    const missing = requiredFields.filter((field) => !(formData[field] && formData[field]?.toString().trim()));

    if (missing.length > 0) {
      Alert.alert('Missing information', 'Please complete all required fields.');
      return;
    }

    const now = new Date().toISOString();

    try {
      if (userProfile) {
        await updateUserProfile({
          ...formData,
          updatedAt: now,
        });
        Alert.alert('Success', 'Profile updated successfully.');
      } else {
        const newProfile: UserProfile = {
          id: `user-${Date.now()}`,
          firstName: formData.firstName!,
          lastName: formData.lastName!,
          email: formData.email!,
          phone: formData.phone!,
          country: formData.country ?? 'US',
          role: formData.role ?? 'Pet Owner',
          addressLine1: formData.addressLine1,
          addressLine2: formData.addressLine2,
          city: formData.city,
          state: formData.state,
          zipCode: formData.zipCode,
          profilePhotoUrl: formData.profilePhotoUrl,
          createdAt: now,
          updatedAt: now,
        };
        setUserProfile(newProfile);
        Alert.alert('Success', 'Profile created successfully.');
      }
      setIsEditing(false);
    } catch (error) {
      console.error('Error saving profile', error);
      Alert.alert('Error', 'Unable to save profile. Please try again.');
    }
  };

  const handleEditPress = () => {
    setIsEditing(true);
  };

  const renderInfoItem = (label: string, value?: string | number | null) => (
    <View style={styles.infoItem} key={label}>
      <ThemedText style={styles.infoLabel}>{label}</ThemedText>
      <ThemedText style={styles.infoValue}>{value ? String(value) : 'Not provided'}</ThemedText>
    </View>
  );

  const renderProfileDetails = () => {
    const displayProfile = userProfile ?? (formData as UserProfile);
    return (
      <>
        <ThemedText type="subtitle" style={styles.sectionHeading}>
          Profile Information
        </ThemedText>
        <View style={styles.infoGrid}>
          {renderInfoItem('Email Id', displayProfile?.email)}
          {renderInfoItem('Phone Number', displayProfile?.phone)}
          {renderInfoItem('Address 1', displayProfile?.addressLine1)}
          {renderInfoItem('Address 2', displayProfile?.addressLine2)}
          {renderInfoItem('Country', displayProfile?.country)}
          {renderInfoItem('State', displayProfile?.state)}
          {renderInfoItem('City', displayProfile?.city)}
          {renderInfoItem('Zip code', displayProfile?.zipCode)}
          {renderInfoItem('Total Canine', userCanines.length)}
          {renderInfoItem('Upcoming Appointments', upcomingAppointmentsCount)}
        </View>
        <View style={styles.infoFooter}>
          <ThemedText style={styles.infoFooterText}>Last Update : {formattedUpdatedAt}</ThemedText>
        </View>
      </>
    );
  };

  const renderForm = () => (
    <>
      <View style={styles.formGrid}>
        {(() => {
          const fullNameValue = [formData.firstName, formData.lastName].filter(Boolean).join(' ').trim();
          return (
            <InputField
              label="Name"
              value={fullNameValue}
              onChangeText={(text) => {
                const parts = text.trim().split(/\s+/);
                setFormData({
                  ...formData,
                  firstName: parts[0] ?? '',
                  lastName: parts.slice(1).join(' '),
                });
              }}
              required
              icon="person.fill"
              editable={isEditing}
            />
          );
        })()}
        <InputField
          label="Email Id"
          value={formData.email ?? ''}
          onChangeText={(text) => setFormData({ ...formData, email: text })}
          keyboardType="email-address"
          required
          icon="envelope.fill"
          editable={isEditing}
        />
        <InputField
          label="Phone Number"
          value={formData.phone ?? ''}
          onChangeText={(text) => setFormData({ ...formData, phone: text })}
          keyboardType="phone-pad"
          required
          icon="phone.fill"
          editable={isEditing}
        />
        <InputField
          label="Address 1"
          value={formData.addressLine1 ?? ''}
          onChangeText={(text) => setFormData({ ...formData, addressLine1: text })}
          icon="mappin.and.ellipse"
          editable={isEditing}
        />
        <InputField
          label="Address 2"
          value={formData.addressLine2 ?? ''}
          onChangeText={(text) => setFormData({ ...formData, addressLine2: text })}
          icon="mappin.and.ellipse"
          editable={isEditing}
        />
        <InputField
          label="Country"
          value={formData.country ?? 'US'}
          onChangeText={(text) => setFormData({ ...formData, country: text as UserProfile['country'] })}
          icon="globe"
          editable={isEditing}
        />
        <InputField
          label="State"
          value={formData.state ?? ''}
          onChangeText={(text) => setFormData({ ...formData, state: text })}
          icon="building.2.fill"
          editable={isEditing}
        />
        <InputField
          label="City"
          value={formData.city ?? ''}
          onChangeText={(text) => setFormData({ ...formData, city: text })}
          icon="building.fill"
          editable={isEditing}
        />
        <InputField
          label="Zip code"
          value={formData.zipCode ?? ''}
          onChangeText={(text) => setFormData({ ...formData, zipCode: text })}
          keyboardType="number-pad"
          icon="number.circle.fill"
          editable={isEditing}
        />
      </View>
      {isEditing && (
        <View style={styles.actionRow}>
          <TouchableOpacity
            style={[styles.secondaryButton, { borderColor: colors.icon }]}
            onPress={handleCancelEdit}>
            <ThemedText style={[styles.secondaryButtonText, { color: colors.text }]}>Cancel</ThemedText>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.primaryButton, { backgroundColor: colors.primary }]}
            onPress={handleSave}>
            <ThemedText style={styles.primaryButtonText}>Save</ThemedText>
          </TouchableOpacity>
        </View>
      )}
    </>
  );

  const displayPhone = formData.phone || userProfile?.phone || '(000) 000-0000';
  const hasProfilePhoto = Boolean(formData.profilePhotoUrl || userProfile?.profilePhotoUrl);
  const profilePhotoUrl = formData.profilePhotoUrl || userProfile?.profilePhotoUrl;

  const handlePickImage = async () => {
    if (!isEditing) return;

    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Permission needed', 'Please allow photo library access to choose a profile photo.');
      return;
    }

    const mediaTypeModule: any = ImagePicker as any;
    const hasNewMediaType = !!mediaTypeModule.MediaType;
    const mediaTypeValue = hasNewMediaType
      ? mediaTypeModule.MediaType.Images ?? mediaTypeModule.MediaType.IMAGE
      : ImagePicker.MediaTypeOptions.Images;

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: hasNewMediaType ? [mediaTypeValue] : mediaTypeValue,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      let uri = result.assets[0].uri;

      if (isSupabaseConfigured && userProfile?.id) {
        try {
          const uploadedUrl = await uploadMediaToSupabase(uri, `user-${userProfile.id}`, 'photo');
          uri = uploadedUrl;
        } catch (error: any) {
          console.warn('Profile photo upload failed, using local URI instead.', error?.message);
        }
      }

      setFormData({ ...formData, profilePhotoUrl: uri });
    }
  };

  return (
    <KeyboardAvoidingView
      style={[styles.screen, { backgroundColor: colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}>
        <View style={[styles.headerRow, Platform.OS === 'ios' ? { paddingTop: 28 } : { paddingTop: 16 }]}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.backButton}
            accessibilityRole="button"
            accessibilityLabel="Go back">
            <IconSymbol name="chevron.left" size={22} color={colors.text} />
            <ThemedText style={styles.backButtonLabel}>Back</ThemedText>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={isEditing ? handleSave : handleEditPress}
            style={styles.headerAction}
            accessibilityRole="button"
            accessibilityLabel={isEditing ? 'Save profile' : 'Edit profile'}>
            {isEditing ? (
              <IconSymbol name="checkmark.circle.fill" size={26} color={colors.tint} />
            ) : (
              <IconSymbol name="pencil.circle.fill" size={26} color={colors.tint} />
            )}
          </TouchableOpacity>
        </View>

        <View style={styles.avatarSection}>
          <Pressable
            onPress={handlePickImage}
            style={[styles.avatarCircle, { backgroundColor: colors.tint + '22' }]}
            accessibilityRole="button"
            accessibilityLabel="Change profile photo">
            {hasProfilePhoto ? (
              <Image source={{ uri: profilePhotoUrl }} style={styles.avatarImage} contentFit="cover" />
            ) : (
              <IconSymbol name="person.crop.circle.fill" size={72} color={colors.tint} />
            )}
            <View style={[styles.cameraBadge, { backgroundColor: colors.background }]}>
              <IconSymbol name="camera.fill" size={16} color={colors.tint} />
            </View>
          </Pressable>
        </View>

        <ThemedView style={styles.card}>{renderForm()}</ThemedView>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function InputField({
  label,
  value,
  onChangeText,
  keyboardType = 'default',
  required = false,
  icon,
  editable = true,
}: {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  keyboardType?: 'default' | 'email-address' | 'phone-pad' | 'number-pad';
  required?: boolean;
  icon: string;
  editable?: boolean;
}) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  return (
    <View style={styles.inputContainer}>
      <View style={styles.labelRow}>
        <ThemedText style={styles.inputLabel}>
          {label}
          {required ? <ThemedText style={styles.requiredMarker}> *</ThemedText> : null}
        </ThemedText>
      </View>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        editable={editable}
        style={[
          styles.textInput,
          { borderColor: colors.icon, color: Colors[colorScheme ?? 'light'].text },
          { paddingLeft: 44 },
          !editable && styles.textInputDisabled,
        ]}
        placeholder={`Enter ${label.toLowerCase()}`}
        placeholderTextColor={`${colors.icon}AA`}
        keyboardType={keyboardType}
      />
      <View style={styles.inputIcon}>
        <IconSymbol name={icon as any} size={18} color={colors.icon} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 48,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 6,
  },
  backButtonLabel: {
    fontSize: 16,
    fontWeight: '600',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 28 : 16,
  },
  headerAction: {
    padding: 8,
  },
  avatarSection: {
    marginTop: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarCircle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: 140,
    height: 140,
    borderRadius: 70,
    position: 'relative',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
    borderRadius: 70,
  },
  cameraBadge: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#D1D5DB',
  },
  card: {
    marginHorizontal: 24,
    marginTop: 24,
    padding: 20,
    borderRadius: 24,
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 4,
  },
  sectionHeading: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 20,
    color: '#111827',
  },
  infoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  infoItem: {
    width: '48%',
  },
  infoLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6B7280',
    marginBottom: 6,
    textTransform: 'uppercase',
  },
  infoValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  infoFooter: {
    marginTop: 24,
    padding: 14,
    borderRadius: 16,
    backgroundColor: '#EEF2FF',
  },
  infoFooterText: {
    fontSize: 13,
    color: '#4338CA',
    textAlign: 'center',
  },
  formGrid: {
    gap: 16,
  },
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 24,
    gap: 12,
  },
  secondaryButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
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
    fontWeight: '600',
    color: '#FFFFFF',
  },
  inputContainer: {
    width: '100%',
    gap: 8,
    position: 'relative',
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
  },
  requiredMarker: {
    color: '#EF4444',
  },
  textInput: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: Platform.OS === 'ios' ? 14 : 10,
    fontSize: 16,
    backgroundColor: '#FFFFFF',
  },
  inputIcon: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 44 : 40,
    left: 12,
  },
  textInputDisabled: {
    backgroundColor: '#F3F4F6',
  },
});
