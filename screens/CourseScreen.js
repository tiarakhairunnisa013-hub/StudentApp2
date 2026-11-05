
import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  Pressable,
  Alert,
  Modal,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';

const STORAGE_KEY = '@student_app_courses';

const INITIAL_COURSES = [
  {
    code: 'TI536',
    name: 'Pemrograman Berbasis Framework',
    sks: 3,
    type: 'Wajib',
    lecturer: 'Fiky Anggara',
  },
  {
    code: 'TI533',
    name: 'Keamanan Data dan Informasi',
    sks: 3,
    type: 'Wajib',
    lecturer: 'Fiky Anggara',
  },
  {
    code: 'TI430',
    name: 'Pemrograman Web',
    sks: 3,
    type: 'Wajib',
    lecturer: 'Fiky Anggara',
  },
  {
    code: 'TI428',
    name: 'Kecerdasan Komputasional',
    sks: 3,
    type: 'Pilihan',
    lecturer: 'Fiky Anggara',
  },
  {
    code: 'MA312',
    name: 'Matematika Diskrit',
    sks: 3,
    type: 'Wajib',
    lecturer: 'Fiky Anggara',
  },
  {
    code: 'TI540',
    name: 'Pemrograman Aplikasi Bergerak',
    sks: 3,
    type: 'Pilihan',
    lecturer: 'Fiky Anggara',
  },
];

const EMPTY_FORM = {
  code: '',
  name: '',
  sks: '3',
  type: 'Wajib',
  lecturer: '',
};

// Menyamakan struktur data dari penyimpanan lama.
const normalizeCourse = (course) => ({
  ...course,
  code: String(course.code ?? '').trim(),
  name: String(
    course.name ?? course.course ?? course.nama ?? ''
  ),
  sks: Number(course.sks) || 0,
  type: course.type ?? 'Wajib',
  lecturer: course.lecturer ?? '',
});

export default function CourseScreen() {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [modalVisible, setModalVisible] = useState(false);
  const [editingCode, setEditingCode] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);

  // Muat ulang daftar mata kuliah ketika tab dibuka.
  useFocusEffect(
    useCallback(() => {
      let active = true;

      const loadCourses = async () => {
        setLoading(true);

        try {
          const stored = await AsyncStorage.getItem(STORAGE_KEY);

          let data;

          if (stored === null) {
            data = INITIAL_COURSES.map(normalizeCourse);

            await AsyncStorage.setItem(
              STORAGE_KEY,
              JSON.stringify(data)
            );
          } else {
            const parsed = JSON.parse(stored);

            if (!Array.isArray(parsed)) {
              throw new Error(
                'Format data mata kuliah tidak valid.'
              );
            }

            data = parsed.map(normalizeCourse);
          }

          if (active) {
            setCourses(data);
          }
        } catch (error) {
          console.error('Gagal memuat mata kuliah:', error);

          if (active) {
            Alert.alert(
              'Gagal Memuat Data',
              'Daftar mata kuliah tidak dapat dimuat. Periksa penyimpanan aplikasi.'
            );
          }
        } finally {
          if (active) setLoading(false);
        }
      };

      loadCourses();

      return () => {
        active = false;
      };
    }, [])
  );

  // Simpan daftar mata kuliah dan perbarui tampilan.
  const persistCourses = async (updatedCourses) => {
    await AsyncStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(updatedCourses)
    );

    setCourses(updatedCourses);
  };

  const updateForm = (field, value) => {
    setForm((previous) => ({
      ...previous,
      [field]: value,
    }));
  };

  const openAddModal = () => {
    setEditingCode(null);
    setForm(EMPTY_FORM);
    setModalVisible(true);
  };

  const openEditModal = (course) => {
    setEditingCode(course.code);

    setForm({
      code: course.code,
      name: course.name,
      sks: String(course.sks),
      type: course.type || 'Wajib',
      lecturer: course.lecturer || '',
    });

    setModalVisible(true);
  };

  const closeModal = () => {
    if (saving) return;

    setModalVisible(false);
    setEditingCode(null);
    setForm(EMPTY_FORM);
  };

  const handleSaveCourse = async () => {
    const code = form.code.trim().toUpperCase();
    const name = form.name.trim();
    const lecturer = form.lecturer.trim();
    const sks = Number(form.sks);

    if (!code || !name) {
      Alert.alert(
        'Data Belum Lengkap',
        'Kode dan nama mata kuliah wajib diisi.'
      );
      return;
    }

    if (
      !Number.isInteger(sks) ||
      sks < 1 ||
      sks > 6
    ) {
      Alert.alert(
        'SKS Tidak Valid',
        'SKS harus berupa bilangan bulat antara 1 sampai 6.'
      );
      return;
    }

    // Kode harus unik. Saat edit, kode lama dipertahankan
    // agar relasi nilai tidak terputus.
    if (
      !editingCode &&
      courses.some(
        (course) =>
          course.code.toUpperCase() === code
      )
    ) {
      Alert.alert(
        'Kode Sudah Digunakan',
        'Gunakan kode mata kuliah yang berbeda.'
      );
      return;
    }

    const newCourse = {
      code: editingCode || code,
      name,
      sks,
      type: form.type,
      lecturer,
    };

    let updatedCourses;

    if (editingCode) {
      updatedCourses = courses.map((course) =>
        course.code === editingCode
          ? {
              ...course,
              ...newCourse,
            }
          : course
      );
    } else {
      updatedCourses = [...courses, newCourse];
    }

    try {
      setSaving(true);
      await persistCourses(updatedCourses);

      setModalVisible(false);
      setEditingCode(null);
      setForm(EMPTY_FORM);

      Alert.alert(
        'Berhasil',
        editingCode
          ? 'Mata kuliah berhasil diperbarui.'
          : 'Mata kuliah berhasil ditambahkan.'
      );
    } catch (error) {
      console.error('Gagal menyimpan mata kuliah:', error);

      Alert.alert(
        'Gagal',
        'Mata kuliah tidak berhasil disimpan. Silakan coba lagi.'
      );
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteCourse = (course) => {
    Alert.alert(
      'Hapus Mata Kuliah',
      `Hapus ${course.code} - ${course.name} dari daftar? Entri nilainya akan ikut hilang saat halaman Nilai disinkronkan.`,
      [
        {
          text: 'Batal',
          style: 'cancel',
        },
        {
          text: 'Hapus',
          style: 'destructive',
          onPress: async () => {
            try {
              setSaving(true);

              const updatedCourses = courses.filter(
                (item) => item.code !== course.code
              );

              await persistCourses(updatedCourses);
            } catch (error) {
              console.error(
                'Gagal menghapus mata kuliah:',
                error
              );

              Alert.alert(
                'Gagal',
                'Mata kuliah tidak berhasil dihapus.'
              );
            } finally {
              setSaving(false);
            }
          },
        },
      ]
    );
  };

  const totalSKS = courses.reduce(
    (total, course) => total + (Number(course.sks) || 0),
    0
  );

  const renderCourse = ({ item, index }) => (
    <View style={styles.courseCard}>
      <View style={styles.courseTop}>
        <View style={styles.numberBadge}>
          <Text style={styles.numberText}>
            {String(index + 1).padStart(2, '0')}
          </Text>
        </View>

        <View style={styles.courseInfo}>
          <Text style={styles.courseCode}>
            {item.code}
          </Text>

          <Text style={styles.courseName}>
            {item.name}
          </Text>
        </View>

        <View style={styles.sksBadge}>
          <Text style={styles.sksValue}>
            {item.sks}
          </Text>
          <Text style={styles.sksLabel}>SKS</Text>
        </View>
      </View>

      <View style={styles.courseMeta}>
        <View
          style={[
            styles.typeBadge,
            item.type === 'Pilihan'
              ? styles.electiveBadge
              : styles.requiredBadge,
          ]}
        >
          <Text
            style={[
              styles.typeText,
              item.type === 'Pilihan'
                ? styles.electiveText
                : styles.requiredText,
            ]}
          >
            {item.type || 'Wajib'}
          </Text>
        </View>

        <Text style={styles.lecturer} numberOfLines={1}>
          {item.lecturer || 'Dosen belum ditentukan'}
        </Text>
      </View>

      <View style={styles.cardDivider} />

      <View style={styles.cardActions}>
        <Pressable
          style={styles.editButton}
          onPress={() => openEditModal(item)}
        >
          <Text style={styles.editButtonText}>
            ✏️  Edit
          </Text>
        </Pressable>

        <Pressable
          style={styles.deleteButton}
          onPress={() => handleDeleteCourse(item)}
        >
          <Text style={styles.deleteButtonText}>
            🗑️  Hapus
          </Text>
        </Pressable>
      </View>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2563EB" />
        <Text style={styles.loadingText}>
          Memuat mata kuliah...
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={courses}
        keyExtractor={(item) => item.code}
        renderItem={renderCourse}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={
          <View>
            <View style={styles.header}>
              <View style={styles.headerText}>
                <Text style={styles.pageTitle}>
                  Mata Kuliah
                </Text>
                <Text style={styles.pageSubtitle}>
                  Kelola daftar mata kuliah semester ini
                </Text>
              </View>

              <View style={styles.headerIcon}>
                <Text style={styles.headerEmoji}>📚</Text>
              </View>
            </View>

            <View style={styles.summaryCard}>
              <View style={styles.summaryItem}>
                <Text style={styles.summaryLabel}>
                  Total Mata Kuliah
                </Text>
                <Text style={styles.summaryValue}>
                  {courses.length}
                </Text>
              </View>

              <View style={styles.summaryDivider} />

              <View style={styles.summaryItem}>
                <Text style={styles.summaryLabel}>
                  Total SKS
                </Text>
                <Text style={styles.summaryValue}>
                  {totalSKS}
                </Text>
              </View>
            </View>

            <Pressable
              style={styles.addButton}
              onPress={openAddModal}
            >
              <Text style={styles.addButtonIcon}>＋</Text>
              <Text style={styles.addButtonText}>
                Tambah Mata Kuliah
              </Text>
            </Pressable>

            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>
                Daftar Mata Kuliah
              </Text>
              <Text style={styles.sectionCount}>
                {courses.length} mata kuliah
              </Text>
            </View>
          </View>
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyEmoji}>📚</Text>
            <Text style={styles.emptyTitle}>
              Belum Ada Mata Kuliah
            </Text>
            <Text style={styles.emptyDescription}>
              Tekan tombol Tambah Mata Kuliah untuk mulai
              mengisi daftar.
            </Text>
          </View>
        }
        ListFooterComponent={
          <Text style={styles.footerText}>
            Data tersimpan secara lokal di perangkat.
          </Text>
        }
      />

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
                  {editingCode
                    ? 'Edit Mata Kuliah'
                    : 'Tambah Mata Kuliah'}
                </Text>

                <Text style={styles.modalSubtitle}>
                  Lengkapi informasi mata kuliah
                </Text>
              </View>

              <Pressable
                style={styles.closeButton}
                onPress={closeModal}
                disabled={saving}
              >
                <Text style={styles.closeButtonText}>✕</Text>
              </Pressable>
            </View>

            <ScrollView
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            >
              <Text style={styles.inputLabel}>
                Kode Mata Kuliah *
              </Text>

              <TextInput
                style={[
                  styles.input,
                  editingCode && styles.readOnlyInput,
                ]}
                value={form.code}
                onChangeText={(value) =>
                  updateForm('code', value.toUpperCase())
                }
                placeholder="Contoh: TI536"
                placeholderTextColor="#94A3B8"
                autoCapitalize="characters"
                editable={!editingCode && !saving}
              />

              {editingCode && (
                <Text style={styles.helperText}>
                  Kode tidak dapat diubah agar data nilai tetap
                  terhubung dengan mata kuliah ini.
                </Text>
              )}

              <Text style={styles.inputLabel}>
                Nama Mata Kuliah *
              </Text>

              <TextInput
                style={styles.input}
                value={form.name}
                onChangeText={(value) =>
                  updateForm('name', value)
                }
                placeholder="Masukkan nama mata kuliah"
                placeholderTextColor="#94A3B8"
                editable={!saving}
              />

              <Text style={styles.inputLabel}>
                Jumlah SKS *
              </Text>

              <TextInput
                style={styles.input}
                value={form.sks}
                onChangeText={(value) =>
                  updateForm('sks', value)
                }
                placeholder="Contoh: 3"
                placeholderTextColor="#94A3B8"
                keyboardType="number-pad"
                editable={!saving}
              />

              <Text style={styles.inputLabel}>
                Jenis Mata Kuliah
              </Text>

              <View style={styles.typeSelector}>
                {['Wajib', 'Pilihan'].map((type) => (
                  <Pressable
                    key={type}
                    style={[
                      styles.typeOption,
                      form.type === type &&
                        styles.typeOptionActive,
                    ]}
                    onPress={() => updateForm('type', type)}
                    disabled={saving}
                  >
                    <Text
                      style={[
                        styles.typeOptionText,
                        form.type === type &&
                          styles.typeOptionTextActive,
                      ]}
                    >
                      {type}
                    </Text>
                  </Pressable>
                ))}
              </View>

              <Text style={styles.inputLabel}>
                Nama Dosen
              </Text>

              <TextInput
                style={styles.input}
                value={form.lecturer}
                onChangeText={(value) =>
                  updateForm('lecturer', value)
                }
                placeholder="Masukkan nama dosen"
                placeholderTextColor="#94A3B8"
                editable={!saving}
              />

              <View style={styles.modalActions}>
                <Pressable
                  style={styles.cancelButton}
                  onPress={closeModal}
                  disabled={saving}
                >
                  <Text style={styles.cancelButtonText}>
                    Batal
                  </Text>
                </Pressable>

                <Pressable
                  style={[
                    styles.saveButton,
                    saving && styles.disabledButton,
                  ]}
                  onPress={handleSaveCourse}
                  disabled={saving}
                >
                  {saving ? (
                    <ActivityIndicator color="#FFFFFF" />
                  ) : (
                    <Text style={styles.saveButtonText}>
                      {editingCode ? 'Simpan Perubahan' : 'Simpan'}
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
  listContent: {
    padding: 18,
    paddingBottom: 35,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 13,
    color: '#64748B',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
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
    width: 49,
    height: 49,
    borderRadius: 15,
    backgroundColor: '#DBEAFE',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 12,
  },
  headerEmoji: {
    fontSize: 25,
  },
  summaryCard: {
    backgroundColor: '#1D4ED8',
    borderRadius: 20,
    padding: 22,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  summaryItem: {
    flex: 1,
  },
  summaryLabel: {
    color: '#DBEAFE',
    fontSize: 11,
  },
  summaryValue: {
    color: '#FFFFFF',
    fontSize: 32,
    fontWeight: '800',
    marginTop: 6,
  },
  summaryDivider: {
    width: 1,
    height: 45,
    backgroundColor: '#60A5FA',
    marginHorizontal: 18,
  },
  addButton: {
    backgroundColor: '#2563EB',
    borderRadius: 14,
    minHeight: 51,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 26,
  },
  addButtonIcon: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '700',
    marginRight: 8,
  },
  addButtonText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 13,
  },
  sectionTitle: {
    color: '#0F172A',
    fontSize: 18,
    fontWeight: '800',
  },
  sectionCount: {
    color: '#2563EB',
    backgroundColor: '#DBEAFE',
    fontSize: 10,
    fontWeight: '700',
    paddingHorizontal: 9,
    paddingVertical: 6,
    borderRadius: 8,
  },
  courseCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 17,
    padding: 15,
    marginBottom: 12,
    elevation: 2,
  },
  courseTop: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  numberBadge: {
    width: 36,
    height: 36,
    borderRadius: 11,
    backgroundColor: '#EFF6FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 11,
  },
  numberText: {
    color: '#2563EB',
    fontWeight: '800',
    fontSize: 11,
  },
  courseInfo: {
    flex: 1,
    paddingRight: 7,
  },
  courseCode: {
    color: '#2563EB',
    fontSize: 11,
    fontWeight: '800',
    marginBottom: 4,
  },
  courseName: {
    color: '#0F172A',
    fontSize: 13,
    fontWeight: '700',
    lineHeight: 19,
  },
  sksBadge: {
    width: 44,
    height: 47,
    borderRadius: 12,
    backgroundColor: '#DBEAFE',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sksValue: {
    color: '#1D4ED8',
    fontSize: 18,
    fontWeight: '800',
  },
  sksLabel: {
    color: '#1D4ED8',
    fontSize: 9,
    fontWeight: '700',
  },
  courseMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 14,
    gap: 9,
  },
  typeBadge: {
    borderRadius: 7,
    paddingHorizontal: 9,
    paddingVertical: 5,
  },
  requiredBadge: {
    backgroundColor: '#DCFCE7',
  },
  electiveBadge: {
    backgroundColor: '#FEF3C7',
  },
  typeText: {
    fontSize: 10,
    fontWeight: '700',
  },
  requiredText: {
    color: '#15803D',
  },
  electiveText: {
    color: '#92400E',
  },
  lecturer: {
    flex: 1,
    color: '#64748B',
    fontSize: 10,
  },
  cardDivider: {
    height: 1,
    backgroundColor: '#E2E8F0',
    marginVertical: 13,
  },
  cardActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 9,
  },
  editButton: {
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 13,
    paddingVertical: 9,
    borderRadius: 9,
  },
  editButtonText: {
    color: '#1D4ED8',
    fontSize: 11,
    fontWeight: '700',
  },
  deleteButton: {
    backgroundColor: '#FEF2F2',
    paddingHorizontal: 13,
    paddingVertical: 9,
    borderRadius: 9,
  },
  deleteButtonText: {
    color: '#B91C1C',
    fontSize: 11,
    fontWeight: '700',
  },
  emptyContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 28,
    alignItems: 'center',
  },
  emptyEmoji: {
    fontSize: 42,
    marginBottom: 12,
  },
  emptyTitle: {
    color: '#0F172A',
    fontSize: 16,
    fontWeight: '800',
  },
  emptyDescription: {
    color: '#64748B',
    fontSize: 12,
    lineHeight: 19,
    textAlign: 'center',
    marginTop: 8,
  },
  footerText: {
    color: '#94A3B8',
    fontSize: 10,
    textAlign: 'center',
    marginTop: 10,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.55)',
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
    fontSize: 20,
    fontWeight: '800',
  },
  modalSubtitle: {
    color: '#64748B',
    fontSize: 11,
    marginTop: 5,
  },
  closeButton: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 12,
  },
  closeButtonText: {
    color: '#475569',
    fontSize: 15,
    fontWeight: '800',
  },
  inputLabel: {
    color: '#334155',
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 7,
    marginTop: 13,
  },
  input: {
    height: 48,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 11,
    paddingHorizontal: 13,
    color: '#0F172A',
    backgroundColor: '#FFFFFF',
    fontSize: 13,
  },
  readOnlyInput: {
    backgroundColor: '#F1F5F9',
    color: '#64748B',
  },
  helperText: {
    color: '#64748B',
    fontSize: 10,
    lineHeight: 15,
    marginTop: 6,
  },
  typeSelector: {
    flexDirection: 'row',
    gap: 10,
  },
  typeOption: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 11,
    paddingVertical: 13,
    alignItems: 'center',
  },
  typeOptionActive: {
    backgroundColor: '#DBEAFE',
    borderColor: '#2563EB',
  },
  typeOptionText: {
    color: '#64748B',
    fontWeight: '700',
    fontSize: 12,
  },
  typeOptionTextActive: {
    color: '#1D4ED8',
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
    marginTop: 25,
    marginBottom: 5,
  },
  cancelButton: {
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 13,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButtonText: {
    color: '#475569',
    fontSize: 12,
    fontWeight: '700',
  },
  saveButton: {
    borderRadius: 10,
    paddingHorizontal: 17,
    paddingVertical: 13,
    backgroundColor: '#2563EB',
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 90,
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
  },
  disabledButton: {
    opacity: 0.6,
  },
});
