
import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  TextInput,
  Modal,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';

const USER_KEY = '@student_app_user';
const COURSES_KEY = '@student_app_courses';
const GRADES_KEY = '@student_app_grades';

const EMPTY_PROFILE = {
  name: '',
  nim: '',
  email: '',
  prodi: 'Teknik Informatika',
  semester: '5',
  phone: '',
};

function InfoRow({ icon, label, value }) {
  return (
    <View style={styles.infoRow}>
      <View style={styles.infoIcon}>
        <Text style={styles.infoEmoji}>{icon}</Text>
      </View>

      <View style={styles.infoContent}>
        <Text style={styles.infoLabel}>{label}</Text>
        <Text style={styles.infoValue}>
          {value || 'Belum diisi'}
        </Text>
      </View>
    </View>
  );
}

function AcademicCard({ icon, label, value }) {
  return (
    <View style={styles.academicCard}>
      <Text style={styles.academicIcon}>{icon}</Text>
      <Text style={styles.academicValue}>{value}</Text>
      <Text style={styles.academicLabel}>{label}</Text>
    </View>
  );
}

function ProfileField({
  label,
  value,
  onChangeText,
  placeholder,
  keyboardType = 'default',
  editable = true,
  autoCapitalize = 'sentences',
}) {
  return (
    <View style={styles.fieldContainer}>
      <Text style={styles.fieldLabel}>{label}</Text>

      <TextInput
        style={[
          styles.input,
          !editable && styles.inputDisabled,
        ]}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor="#94A3B8"
        keyboardType={keyboardType}
        editable={editable}
        autoCapitalize={autoCapitalize}
      />
    </View>
  );
}

export default function ProfileScreen() {
  const [profile, setProfile] = useState(EMPTY_PROFILE);
  const [form, setForm] = useState(EMPTY_PROFILE);
  const [academic, setAcademic] = useState({
    totalCourses: 0,
    totalSKS: 0,
    totalGraded: 0,
    ipSemester: 0,
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);

  // Membaca akun login dan ringkasan akademik terbaru.
  useFocusEffect(
    useCallback(() => {
      let active = true;

      const loadProfile = async () => {
        setLoading(true);

        try {
          const [userRaw, coursesRaw, gradesRaw] =
            await Promise.all([
              AsyncStorage.getItem(USER_KEY),
              AsyncStorage.getItem(COURSES_KEY),
              AsyncStorage.getItem(GRADES_KEY),
            ]);

          if (!userRaw) {
            if (active) {
              setProfile(EMPTY_PROFILE);
              setForm(EMPTY_PROFILE);
              setAcademic({
                totalCourses: 0,
                totalSKS: 0,
                totalGraded: 0,
                ipSemester: 0,
              });
            }
            return;
          }

          const user = JSON.parse(userRaw);

          if (
            !user ||
            typeof user !== 'object' ||
            Array.isArray(user)
          ) {
            throw new Error('Format data akun tidak valid.');
          }

          // Pertahankan field akun asli.
          // Semester dan nomor telepon merupakan data tambahan.
          const currentProfile = {
            ...EMPTY_PROFILE,
            ...user,
            name: user.name ?? '',
            nim: user.nim ?? '',
            email: user.email ?? '',
            prodi: user.prodi ?? 'Teknik Informatika',
            semester: String(user.semester ?? '5'),
            phone: user.phone ?? '',
          };

          const coursesParsed = coursesRaw
            ? JSON.parse(coursesRaw)
            : [];

          const gradesParsed = gradesRaw
            ? JSON.parse(gradesRaw)
            : [];

          const courses = Array.isArray(coursesParsed)
            ? coursesParsed
            : [];

          const grades = Array.isArray(gradesParsed)
            ? gradesParsed
            : [];

          const courseCodes = new Set(
            courses.map((course) => course.code)
          );

          const validGrades = grades.filter(
            (item) =>
              courseCodes.has(item.code) &&
              item.score !== null &&
              item.score !== undefined &&
              item.point !== null &&
              item.point !== undefined &&
              Number.isFinite(Number(item.point))
          );

          const totalSKS = courses.reduce(
            (total, course) =>
              total + (Number(course.sks) || 0),
            0
          );

          const sksDinilai = validGrades.reduce(
            (total, item) =>
              total + (Number(item.sks) || 0),
            0
          );

          const totalBobot = validGrades.reduce(
            (total, item) =>
              total +
              (Number(item.sks) || 0) *
                Number(item.point),
            0
          );

          const ipSemester =
            sksDinilai > 0 ? totalBobot / sksDinilai : 0;

          if (active) {
            setProfile(currentProfile);
            setForm(currentProfile);

            setAcademic({
              totalCourses: courses.length,
              totalSKS,
              totalGraded: validGrades.length,
              ipSemester,
            });
          }
        } catch (error) {
          console.error('Gagal memuat profil:', error);

          if (active) {
            Alert.alert(
              'Gagal Memuat Profil',
              'Data akun tidak dapat dibaca. Silakan coba kembali.'
            );
          }
        } finally {
          if (active) setLoading(false);
        }
      };

      loadProfile();

      return () => {
        active = false;
      };
    }, [])
  );

  const updateForm = (field, value) => {
    setForm((previous) => ({
      ...previous,
      [field]: value,
    }));
  };

  const openEditModal = () => {
    setForm({ ...profile });
    setModalVisible(true);
  };

  const closeModal = () => {
    if (saving) return;

    setModalVisible(false);
    setForm({ ...profile });
  };

  const handleSave = async () => {
    const name = form.name.trim();
    const nim = form.nim.trim();
    const email = form.email.trim().toLowerCase();
    const prodi = form.prodi.trim();
    const semester = String(form.semester).trim();
    const phone = form.phone.trim();

    if (!name || !nim || !email || !prodi || !semester) {
      Alert.alert(
        'Data Belum Lengkap',
        'Nama, NIM, email, program studi, dan semester wajib diisi.'
      );
      return;
    }

    const semesterNumber = Number(semester);

    if (
      !Number.isInteger(semesterNumber) ||
      semesterNumber < 1 ||
      semesterNumber > 14
    ) {
      Alert.alert(
        'Semester Tidak Valid',
        'Semester harus berupa angka antara 1 sampai 14.'
      );
      return;
    }

    try {
      setSaving(true);

      // Baca ulang akun tersimpan agar field lain, khususnya
      // password, tidak tertimpa oleh form profil.
      const userRaw = await AsyncStorage.getItem(USER_KEY);

      if (!userRaw) {
        Alert.alert(
          'Akun Tidak Ditemukan',
          'Data akun tidak ditemukan. Silakan login kembali.'
        );
        return;
      }

      const existingUser = JSON.parse(userRaw);

      if (
        !existingUser ||
        typeof existingUser !== 'object' ||
        Array.isArray(existingUser)
      ) {
        throw new Error('Format akun tidak valid.');
      }

      // Pertahankan seluruh properti akun lama.
      const updatedUser = {
        ...existingUser,
        name,
        nim,
        email,
        prodi,
        semester,
        phone,
      };

      await AsyncStorage.setItem(
        USER_KEY,
        JSON.stringify(updatedUser)
      );

      setProfile({
        ...EMPTY_PROFILE,
        ...updatedUser,
        semester: String(updatedUser.semester ?? '5'),
        phone: updatedUser.phone ?? '',
      });

      setForm({
        ...EMPTY_PROFILE,
        ...updatedUser,
        semester: String(updatedUser.semester ?? '5'),
        phone: updatedUser.phone ?? '',
      });

      setModalVisible(false);

      Alert.alert(
        'Berhasil',
        'Profil berhasil diperbarui.'
      );
    } catch (error) {
      console.error('Gagal menyimpan profil:', error);

      Alert.alert(
        'Gagal Menyimpan',
        'Profil belum berhasil disimpan. Silakan coba lagi.'
      );
    } finally {
      setSaving(false);
    }
  };

  const initials = profile.name
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0].toUpperCase())
    .join('');

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2563EB" />
        <Text style={styles.loadingText}>
          Memuat profil akun...
        </Text>
      </View>
    );
  }

  if (!profile.email && !profile.nim && !profile.name) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.emptyIcon}>👤</Text>
        <Text style={styles.emptyTitle}>
          Data Akun Tidak Ditemukan
        </Text>
        <Text style={styles.emptyDescription}>
          Silakan login menggunakan akun yang sudah terdaftar.
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <View style={styles.headerText}>
            <Text style={styles.pageTitle}>
              Profil Saya
            </Text>
            <Text style={styles.pageSubtitle}>
              Informasi akun dan akademik
            </Text>
          </View>

          <View style={styles.headerIcon}>
            <Text style={styles.headerEmoji}>👤</Text>
          </View>
        </View>

        {/* Identitas akun yang digunakan */}
        <View style={styles.profileCard}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {initials || 'M'}
            </Text>
          </View>

          <Text style={styles.profileName}>
            {profile.name}
          </Text>

          <Text style={styles.profileNim}>
            NIM: {profile.nim}
          </Text>

          <View style={styles.prodiBadge}>
            <Text style={styles.prodiText}>
              🎓 {profile.prodi}
            </Text>
          </View>

          <View style={styles.profileDivider} />

          <View style={styles.profileMeta}>
            <View style={styles.metaItem}>
              <Text style={styles.metaLabel}>Semester</Text>
              <Text style={styles.metaValue}>
                {profile.semester}
              </Text>
            </View>

            <View style={styles.metaDivider} />

            <View style={styles.metaItem}>
              <Text style={styles.metaLabel}>Status</Text>
              <Text style={styles.metaValue}>Terdaftar</Text>
            </View>
          </View>
        </View>

        <Pressable
          style={({ pressed }) => [
            styles.editButton,
            pressed && styles.pressed,
          ]}
          onPress={openEditModal}
        >
          <Text style={styles.editButtonText}>
            ✏️  Edit Profil
          </Text>
        </Pressable>

        <Text style={styles.sectionTitle}>
          Informasi Akun
        </Text>

        <View style={styles.infoCard}>
          <InfoRow
            icon="👤"
            label="Nama Lengkap"
            value={profile.name}
          />
          <View style={styles.separator} />

          <InfoRow
            icon="🪪"
            label="NIM"
            value={profile.nim}
          />
          <View style={styles.separator} />

          <InfoRow
            icon="✉️"
            label="Email"
            value={profile.email}
          />
          <View style={styles.separator} />

          <InfoRow
            icon="🎓"
            label="Program Studi"
            value={profile.prodi}
          />
          <View style={styles.separator} />

          <InfoRow
            icon="📅"
            label="Semester"
            value={`Semester ${profile.semester}`}
          />
          <View style={styles.separator} />

          <InfoRow
            icon="📱"
            label="Nomor Telepon"
            value={profile.phone}
          />
        </View>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>
            Ringkasan Akademik
          </Text>
          <Text style={styles.liveBadge}>TERKINI</Text>
        </View>

        <View style={styles.academicGrid}>
          <AcademicCard
            icon="📚"
            label="Mata Kuliah"
            value={String(academic.totalCourses)}
          />
          <AcademicCard
            icon="🎓"
            label="Total SKS"
            value={String(academic.totalSKS)}
          />
          <AcademicCard
            icon="📈"
            label="IP Semester"
            value={academic.ipSemester.toFixed(2)}
          />
          <AcademicCard
            icon="✅"
            label="Nilai Terisi"
            value={String(academic.totalGraded)}
          />
        </View>

        <View style={styles.noteCard}>
          <Text style={styles.noteIcon}>ℹ️</Text>
          <Text style={styles.noteText}>
            Informasi profil menggunakan data akun yang tersimpan
            saat registrasi. Perubahan profil disimpan ke akun yang
            sama. Ringkasan akademik dihitung dari data mata kuliah
            dan nilai yang tersimpan di perangkat.
          </Text>
        </View>

        <Text style={styles.footer}>
          StudentApp • Profil Mahasiswa
        </Text>
      </ScrollView>

      {/* Modal edit */}
      <Modal
        visible={modalVisible}
        transparent
        animationType="slide"
        onRequestClose={closeModal}
      >
        <KeyboardAvoidingView
          style={styles.modalOverlay}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <View style={styles.modalTitleContainer}>
                <Text style={styles.modalTitle}>
                  Edit Profil
                </Text>
                <Text style={styles.modalSubtitle}>
                  Perbarui data akun kamu
                </Text>
              </View>

              <Pressable
                style={styles.closeButton}
                onPress={closeModal}
                disabled={saving}
              >
                <Text style={styles.closeText}>✕</Text>
              </Pressable>
            </View>

            <ScrollView
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
            >
              <ProfileField
                label="Nama Lengkap *"
                value={form.name}
                onChangeText={(value) =>
                  updateForm('name', value)
                }
                placeholder="Nama sesuai akun"
                editable={!saving}
              />

              <ProfileField
                label="NIM *"
                value={form.nim}
                onChangeText={(value) =>
                  updateForm('nim', value)
                }
                placeholder="Nomor induk mahasiswa"
                editable={!saving}
              />

              <ProfileField
                label="Email *"
                value={form.email}
                onChangeText={(value) =>
                  updateForm('email', value)
                }
                placeholder="nama@email.com"
                keyboardType="email-address"
                autoCapitalize="none"
                editable={!saving}
              />

              <ProfileField
                label="Program Studi *"
                value={form.prodi}
                onChangeText={(value) =>
                  updateForm('prodi', value)
                }
                placeholder="Program studi"
                editable={!saving}
              />

              <ProfileField
                label="Semester *"
                value={form.semester}
                onChangeText={(value) =>
                  updateForm('semester', value)
                }
                placeholder="Contoh: 5"
                keyboardType="number-pad"
                editable={!saving}
              />

              <ProfileField
                label="Nomor Telepon"
                value={form.phone}
                onChangeText={(value) =>
                  updateForm('phone', value)
                }
                placeholder="Nomor telepon"
                keyboardType="phone-pad"
                editable={!saving}
              />

              <View style={styles.modalActions}>
                <Pressable
                  style={styles.cancelButton}
                  onPress={closeModal}
                  disabled={saving}
                >
                  <Text style={styles.cancelText}>Batal</Text>
                </Pressable>

                <Pressable
                  style={[
                    styles.saveButton,
                    saving && styles.disabledButton,
                  ]}
                  onPress={handleSave}
                  disabled={saving}
                >
                  {saving ? (
                    <ActivityIndicator color="#FFFFFF" />
                  ) : (
                    <Text style={styles.saveText}>
                      Simpan Perubahan
                    </Text>
                  )}
                </Pressable>
              </View>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F1F5F9',
  },
  scrollContent: {
    padding: 18,
    paddingBottom: 35,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F1F5F9',
    padding: 25,
  },
  loadingText: {
    marginTop: 12,
    color: '#64748B',
    fontSize: 13,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  headerText: {
    flex: 1,
  },
  pageTitle: {
    color: '#0F172A',
    fontSize: 25,
    fontWeight: '800',
  },
  pageSubtitle: {
    color: '#64748B',
    fontSize: 12,
    marginTop: 5,
  },
  headerIcon: {
    width: 48,
    height: 48,
    borderRadius: 15,
    backgroundColor: '#DBEAFE',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 12,
  },
  headerEmoji: {
    fontSize: 25,
  },
  profileCard: {
    backgroundColor: '#1D4ED8',
    borderRadius: 23,
    padding: 23,
    alignItems: 'center',
    marginBottom: 15,
  },
  avatar: {
    width: 88,
    height: 88,
    borderRadius: 30,
    backgroundColor: '#FFFFFF',
    borderWidth: 4,
    borderColor: '#BFDBFE',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  avatarText: {
    color: '#1D4ED8',
    fontSize: 30,
    fontWeight: '800',
  },
  profileName: {
    color: '#FFFFFF',
    fontSize: 21,
    fontWeight: '800',
    textAlign: 'center',
  },
  profileNim: {
    color: '#DBEAFE',
    fontSize: 12,
    marginTop: 7,
  },
  prodiBadge: {
    backgroundColor: 'rgba(255,255,255,0.16)',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginTop: 13,
  },
  prodiText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
  profileDivider: {
    height: 1,
    width: '100%',
    backgroundColor: '#60A5FA',
    marginTop: 21,
    marginBottom: 16,
  },
  profileMeta: {
    flexDirection: 'row',
    width: '100%',
    alignItems: 'center',
  },
  metaItem: {
    flex: 1,
    alignItems: 'center',
  },
  metaLabel: {
    color: '#BFDBFE',
    fontSize: 11,
  },
  metaValue: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
    marginTop: 6,
  },
  metaDivider: {
    height: 37,
    width: 1,
    backgroundColor: '#60A5FA',
  },
  editButton: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#BFDBFE',
    borderRadius: 13,
    paddingVertical: 14,
    alignItems: 'center',
    marginBottom: 25,
  },
  editButtonText: {
    color: '#1D4ED8',
    fontWeight: '800',
    fontSize: 13,
  },
  pressed: {
    opacity: 0.7,
  },
  sectionTitle: {
    color: '#0F172A',
    fontSize: 17,
    fontWeight: '800',
    marginBottom: 13,
  },
  infoCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 17,
    paddingHorizontal: 15,
    marginBottom: 25,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
  },
  infoIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  infoEmoji: {
    fontSize: 18,
  },
  infoContent: {
    flex: 1,
  },
  infoLabel: {
    color: '#64748B',
    fontSize: 11,
  },
  infoValue: {
    color: '#0F172A',
    fontSize: 13,
    fontWeight: '700',
    marginTop: 5,
  },
  separator: {
    height: 1,
    backgroundColor: '#F1F5F9',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 13,
  },
  liveBadge: {
    color: '#15803D',
    backgroundColor: '#DCFCE7',
    borderRadius: 7,
    paddingHorizontal: 8,
    paddingVertical: 5,
    fontSize: 9,
    fontWeight: '800',
  },
  academicGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 11,
    marginBottom: 18,
  },
  academicCard: {
    flexGrow: 1,
    flexBasis: '43%',
    minWidth: 125,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 15,
  },
  academicIcon: {
    fontSize: 22,
    marginBottom: 10,
  },
  academicValue: {
    color: '#0F172A',
    fontSize: 23,
    fontWeight: '800',
  },
  academicLabel: {
    color: '#64748B',
    fontSize: 11,
    marginTop: 5,
  },
  noteCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#EFF6FF',
    borderRadius: 14,
    padding: 14,
  },
  noteIcon: {
    fontSize: 17,
    marginRight: 10,
  },
  noteText: {
    flex: 1,
    color: '#475569',
    fontSize: 11,
    lineHeight: 18,
  },
  footer: {
    color: '#94A3B8',
    fontSize: 10,
    textAlign: 'center',
    marginTop: 22,
  },
  emptyIcon: {
    fontSize: 45,
    marginBottom: 12,
  },
  emptyTitle: {
    color: '#0F172A',
    fontSize: 17,
    fontWeight: '800',
    textAlign: 'center',
  },
  emptyDescription: {
    color: '#64748B',
    fontSize: 12,
    lineHeight: 19,
    textAlign: 'center',
    marginTop: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15,23,42,0.55)',
    justifyContent: 'center',
    padding: 18,
  },
  modalCard: {
    maxHeight: '90%',
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    padding: 21,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  modalTitleContainer: {
    flex: 1,
  },
  modalTitle: {
    color: '#0F172A',
    fontSize: 21,
    fontWeight: '800',
  },
  modalSubtitle: {
    color: '#64748B',
    fontSize: 11,
    marginTop: 5,
  },
  closeButton: {
    width: 35,
    height: 35,
    borderRadius: 10,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 12,
  },
  closeText: {
    color: '#475569',
    fontSize: 15,
    fontWeight: '800',
  },
  fieldContainer: {
    marginBottom: 14,
  },
  fieldLabel: {
    color: '#334155',
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 7,
  },
  input: {
    height: 48,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 11,
    paddingHorizontal: 13,
    color: '#0F172A',
    fontSize: 13,
    backgroundColor: '#FFFFFF',
  },
  inputDisabled: {
    backgroundColor: '#F1F5F9',
    color: '#64748B',
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
    marginTop: 12,
    marginBottom: 5,
  },
  cancelButton: {
    backgroundColor: '#F1F5F9',
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelText: {
    color: '#475569',
    fontSize: 12,
    fontWeight: '700',
  },
  saveButton: {
    backgroundColor: '#2563EB',
    borderRadius: 10,
    paddingHorizontal: 17,
    paddingVertical: 13,
    minWidth: 130,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
  },
  disabledButton: {
    opacity: 0.6,
  },
});
