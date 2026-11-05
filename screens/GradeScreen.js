
import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Pressable,
  Modal,
  TextInput,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';

const COURSES_STORAGE_KEY = '@student_app_courses';
const GRADES_STORAGE_KEY = '@student_app_grades';

// Data awal mata kuliah
const INITIAL_COURSES = [
  {
    code: 'TI536',
    name: 'Pemrograman Berbasis Framework',
    sks: 3,
  },
  {
    code: 'TI533',
    name: 'Keamanan Data dan Informasi',
    sks: 3,
  },
  {
    code: 'TI430',
    name: 'Pemrograman Web',
    sks: 3,
  },
  {
    code: 'TI428',
    name: 'Kecerdasan Komputasional',
    sks: 3,
  },
  {
    code: 'MA312',
    name: 'Matematika Diskrit',
    sks: 3,
  },
  {
    code: 'TI540',
    name: 'Pemrograman Aplikasi Bergerak',
    sks: 3,
  },
];

// Contoh nilai awal untuk lima mata kuliah.
// Mata kuliah lainnya akan berstatus belum dinilai.
const INITIAL_GRADES = [
  {
    code: 'TI430',
    course: 'Pemrograman Web',
    sks: 3,
    score: 90,
    grade: 'A',
    point: 4.0,
  },
  {
    code: 'TI533',
    course: 'Keamanan Data dan Informasi',
    sks: 3,
    score: 85,
    grade: 'A-',
    point: 3.75,
  },
  {
    code: 'TI536',
    course: 'Pemrograman Berbasis Framework',
    sks: 3,
    score: 92,
    grade: 'A',
    point: 4.0,
  },
  {
    code: 'TI428',
    course: 'Kecerdasan Komputasional',
    sks: 3,
    score: 80,
    grade: 'B+',
    point: 3.5,
  },
  {
    code: 'MA312',
    course: 'Matematika Diskrit',
    sks: 3,
    score: 86,
    grade: 'A-',
    point: 3.75,
  },
];

// Konversi nilai angka menjadi nilai huruf dan bobot.
const convertScoreToGrade = (score) => {
  if (score >= 90) return { grade: 'A', point: 4.0 };
  if (score >= 85) return { grade: 'A-', point: 3.75 };
  if (score >= 80) return { grade: 'B+', point: 3.5 };
  if (score >= 75) return { grade: 'B', point: 3.0 };
  if (score >= 70) return { grade: 'C+', point: 2.5 };
  if (score >= 60) return { grade: 'C', point: 2.0 };
  if (score >= 50) return { grade: 'D', point: 1.0 };

  return { grade: 'E', point: 0.0 };
};

// Menyamakan data nilai dengan daftar mata kuliah.
// Kode mata kuliah menjadi identitas utama.
const syncGradesWithCourses = (courses, savedGrades) => {
  return courses.map((course) => {
    const code = course.code;

    const existingGrade = savedGrades.find(
      (item) => item.code === code
    );

    const courseName =
      course.name ?? course.course ?? course.nama ?? '';

    const sks = Number(course.sks) || 0;

    if (existingGrade) {
      return {
        ...existingGrade,
        code,
        course: courseName,
        sks,
      };
    }

    return {
      code,
      course: courseName,
      sks,
      score: null,
      grade: '-',
      point: null,
    };
  });
};

export default function GradeScreen() {
  const [grades, setGrades] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedGrade, setSelectedGrade] = useState(null);
  const [scoreInput, setScoreInput] = useState('');
  const [saving, setSaving] = useState(false);

  // Memuat dan menyinkronkan data setiap kali tab Nilai dibuka.
  useFocusEffect(
    useCallback(() => {
      let active = true;

      const loadAndSyncGrades = async () => {
        if (active) setLoading(true);

        try {
          const storedCourses = await AsyncStorage.getItem(
            COURSES_STORAGE_KEY
          );

          const storedGrades = await AsyncStorage.getItem(
            GRADES_STORAGE_KEY
          );

          let courses = storedCourses
            ? JSON.parse(storedCourses)
            : null;

          let savedGrades = storedGrades
            ? JSON.parse(storedGrades)
            : null;

          // Inisialisasi data contoh jika belum tersedia.
          if (!Array.isArray(courses)) {
            courses = INITIAL_COURSES;

            await AsyncStorage.setItem(
              COURSES_STORAGE_KEY,
              JSON.stringify(courses)
            );
          }

          if (!Array.isArray(savedGrades)) {
            savedGrades = INITIAL_GRADES;
          }

          const syncedGrades = syncGradesWithCourses(
            courses,
            savedGrades
          );

          await AsyncStorage.setItem(
            GRADES_STORAGE_KEY,
            JSON.stringify(syncedGrades)
          );

          if (active) {
            setGrades(syncedGrades);
          }
        } catch (error) {
          console.error('Gagal memuat nilai:', error);

          if (active) {
            Alert.alert(
              'Gagal Memuat Data',
              'Data nilai tidak dapat dimuat. Silakan coba kembali.'
            );
          }
        } finally {
          if (active) setLoading(false);
        }
      };

      loadAndSyncGrades();

      return () => {
        active = false;
      };
    }, [])
  );

  // Menyimpan perubahan nilai ke AsyncStorage.
  const saveGrades = async (updatedGrades) => {
    await AsyncStorage.setItem(
      GRADES_STORAGE_KEY,
      JSON.stringify(updatedGrades)
    );

    setGrades(updatedGrades);
  };

  // Membuka form edit nilai.
  const openEditModal = (item) => {
    setSelectedGrade(item);
    setScoreInput(
      item.score === null || item.score === undefined
        ? ''
        : String(item.score)
    );
    setModalVisible(true);
  };

  // Menyimpan nilai angka dan menghitung nilai huruf.
  const handleSaveGrade = async () => {
    if (!selectedGrade) return;

    const normalizedInput = scoreInput.trim();

    if (normalizedInput === '') {
      Alert.alert('Validasi', 'Masukkan nilai terlebih dahulu.');
      return;
    }

    const score = Number(normalizedInput);

    if (
      !Number.isFinite(score) ||
      score < 0 ||
      score > 100
    ) {
      Alert.alert(
        'Nilai Tidak Valid',
        'Nilai harus berupa angka antara 0 sampai 100.'
      );
      return;
    }

    const converted = convertScoreToGrade(score);

    const updatedGrades = grades.map((item) =>
      item.code === selectedGrade.code
        ? {
            ...item,
            score,
            grade: converted.grade,
            point: converted.point,
          }
        : item
    );

    try {
      setSaving(true);
      await saveGrades(updatedGrades);

      setModalVisible(false);
      setSelectedGrade(null);
      setScoreInput('');

      Alert.alert(
        'Berhasil',
        `Nilai ${selectedGrade.course} berhasil disimpan.`
      );
    } catch (error) {
      console.error('Gagal menyimpan nilai:', error);

      Alert.alert(
        'Gagal',
        'Nilai belum berhasil disimpan. Silakan coba lagi.'
      );
    } finally {
      setSaving(false);
    }
  };

  // Menghapus nilai tanpa menghapus mata kuliahnya.
  const handleResetGrade = () => {
    if (!selectedGrade) return;

    Alert.alert(
      'Hapus Nilai',
      `Kosongkan nilai ${selectedGrade.course}?`,
      [
        {
          text: 'Batal',
          style: 'cancel',
        },
        {
          text: 'Kosongkan',
          style: 'destructive',
          onPress: async () => {
            const updatedGrades = grades.map((item) =>
              item.code === selectedGrade.code
                ? {
                    ...item,
                    score: null,
                    grade: '-',
                    point: null,
                  }
                : item
            );

            try {
              setSaving(true);
              await saveGrades(updatedGrades);
              setModalVisible(false);
              setSelectedGrade(null);
              setScoreInput('');
            } catch (error) {
              Alert.alert(
                'Gagal',
                'Nilai tidak berhasil dikosongkan.'
              );
            } finally {
              setSaving(false);
            }
          },
        },
      ]
    );
  };

  // Hanya mata kuliah yang sudah dinilai dihitung ke dalam IP.
  const gradedCourses = grades.filter(
    (item) =>
      item.score !== null &&
      item.score !== undefined &&
      item.point !== null &&
      item.point !== undefined
  );

  const totalSKS = grades.reduce(
    (total, item) => total + (Number(item.sks) || 0),
    0
  );

  const totalSKSDinilai = gradedCourses.reduce(
    (total, item) => total + (Number(item.sks) || 0),
    0
  );

  const totalBobot = gradedCourses.reduce(
    (total, item) =>
      total +
      (Number(item.sks) || 0) *
        (Number(item.point) || 0),
    0
  );

  const ipSemester =
    totalSKSDinilai > 0
      ? totalBobot / totalSKSDinilai
      : 0;

  const totalNilaiA = gradedCourses.filter(
    (item) => item.grade === 'A'
  ).length;

  const renderGradeItem = ({ item, index }) => {
    const hasGrade =
      item.score !== null &&
      item.score !== undefined &&
      item.point !== null &&
      item.point !== undefined;

    return (
      <View style={styles.gradeCard}>
        <View style={styles.cardTop}>
          <View style={styles.numberBadge}>
            <Text style={styles.numberText}>
              {index + 1}
            </Text>
          </View>

          <View style={styles.courseInfo}>
            <Text style={styles.courseCode}>
              {item.code}
            </Text>

            <Text style={styles.courseName}>
              {item.course}
            </Text>

            <Text style={styles.courseSKS}>
              {item.sks} SKS
            </Text>
          </View>

          <View
            style={[
              styles.gradeBadge,
              !hasGrade && styles.pendingBadge,
            ]}
          >
            <Text
              style={[
                styles.gradeLetter,
                !hasGrade && styles.pendingText,
              ]}
            >
              {hasGrade ? item.grade : '-'}
            </Text>
          </View>
        </View>

        <View style={styles.cardDivider} />

        <View style={styles.gradeDetails}>
          <View style={styles.detailItem}>
            <Text style={styles.detailLabel}>Nilai Angka</Text>
            <Text style={styles.detailValue}>
              {hasGrade ? item.score : 'Belum diisi'}
            </Text>
          </View>

          <View style={styles.detailItem}>
            <Text style={styles.detailLabel}>Bobot</Text>
            <Text style={styles.detailValue}>
              {hasGrade
                ? Number(item.point).toFixed(2)
                : '-'}
            </Text>
          </View>

          <Pressable
            style={styles.editButton}
            onPress={() => openEditModal(item)}
          >
            <Text style={styles.editButtonText}>
              {hasGrade ? 'Ubah Nilai' : 'Isi Nilai'}
            </Text>
          </Pressable>
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2563EB" />
        <Text style={styles.loadingText}>
          Menyinkronkan data nilai...
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={grades}
        keyExtractor={(item) => item.code}
        renderItem={renderGradeItem}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <View>
            <View style={styles.header}>
              <View>
                <Text style={styles.pageTitle}>
                  Nilai Akademik
                </Text>
                <Text style={styles.pageSubtitle}>
                  Rekap nilai dan indeks prestasi semester
                </Text>
              </View>

              <View style={styles.headerIcon}>
                <Text style={styles.headerIconText}>📊</Text>
              </View>
            </View>

            <View style={styles.ipCard}>
              <View style={styles.ipCardTop}>
                <View>
                  <Text style={styles.ipLabel}>
                    Indeks Prestasi Semester
                  </Text>
                  <Text style={styles.ipDescription}>
                    Berdasarkan mata kuliah yang telah dinilai
                  </Text>
                </View>

                <Text style={styles.trophyIcon}>🏆</Text>
              </View>

              <Text style={styles.ipValue}>
                {ipSemester.toFixed(2)}
              </Text>

              <View style={styles.ipProgressBackground}>
                <View
                  style={[
                    styles.ipProgress,
                    {
                      width: `${Math.min(
                        (ipSemester / 4) * 100,
                        100
                      )}%`,
                    },
                  ]}
                />
              </View>

              <Text style={styles.ipFooter}>
                Skala IP 0,00 – 4,00
              </Text>
            </View>

            <View style={styles.summaryRow}>
              <View style={styles.summaryCard}>
                <View
                  style={[
                    styles.summaryIcon,
                    { backgroundColor: '#DBEAFE' },
                  ]}
                >
                  <Text>📚</Text>
                </View>
                <Text style={styles.summaryValue}>
                  {grades.length}
                </Text>
                <Text style={styles.summaryLabel}>
                  Mata Kuliah
                </Text>
              </View>

              <View style={styles.summaryCard}>
                <View
                  style={[
                    styles.summaryIcon,
                    { backgroundColor: '#D1FAE5' },
                  ]}
                >
                  <Text>🎓</Text>
                </View>
                <Text style={styles.summaryValue}>
                  {totalSKS}
                </Text>
                <Text style={styles.summaryLabel}>
                  Total SKS
                </Text>
              </View>

              <View style={styles.summaryCard}>
                <View
                  style={[
                    styles.summaryIcon,
                    { backgroundColor: '#FEF3C7' },
                  ]}
                >
                  <Text>⭐</Text>
                </View>
                <Text style={styles.summaryValue}>
                  {gradedCourses.length}
                </Text>
                <Text style={styles.summaryLabel}>
                  Sudah Dinilai
                </Text>
              </View>
            </View>

            <View style={styles.sectionHeader}>
              <View>
                <Text style={styles.sectionTitle}>
                  Daftar Nilai
                </Text>
                <Text style={styles.sectionSubtitle}>
                  {grades.length - gradedCourses.length} mata kuliah
                  belum dinilai
                </Text>
              </View>

              <View style={styles.countBadge}>
                <Text style={styles.countBadgeText}>
                  {grades.length} MK
                </Text>
              </View>
            </View>
          </View>
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyIcon}>📚</Text>
            <Text style={styles.emptyTitle}>
              Belum Ada Mata Kuliah
            </Text>
            <Text style={styles.emptyText}>
              Tambahkan mata kuliah terlebih dahulu melalui menu
              Mata Kuliah.
            </Text>
          </View>
        }
        ListFooterComponent={
          <View style={styles.footer}>
            <Text style={styles.footerText}>
              * IP dihitung dari mata kuliah yang sudah memiliki
              nilai.
            </Text>
            <Text style={styles.footerText}>
              * Total SKS mencakup seluruh mata kuliah yang terdaftar.
            </Text>
          </View>
        }
      />

      <Modal
        visible={modalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}
      >
        <KeyboardAvoidingView
          style={styles.modalOverlay}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <View style={styles.modalTitleContainer}>
                <Text style={styles.modalTitle}>
                  Input Nilai
                </Text>
                <Text style={styles.modalSubtitle}>
                  Masukkan nilai angka 0–100
                </Text>
              </View>

              <Pressable
                style={styles.closeButton}
                onPress={() => setModalVisible(false)}
              >
                <Text style={styles.closeButtonText}>✕</Text>
              </Pressable>
            </View>

            {selectedGrade && (
              <View style={styles.selectedCourse}>
                <Text style={styles.selectedCode}>
                  {selectedGrade.code} • {selectedGrade.sks} SKS
                </Text>
                <Text style={styles.selectedName}>
                  {selectedGrade.course}
                </Text>
              </View>
            )}

            <Text style={styles.inputLabel}>Nilai Angka</Text>

            <TextInput
              style={styles.scoreInput}
              value={scoreInput}
              onChangeText={setScoreInput}
              placeholder="Contoh: 85"
              placeholderTextColor="#94A3B8"
              keyboardType="decimal-pad"
              maxLength={5}
              editable={!saving}
            />

            <Text style={styles.inputHint}>
              Konversi otomatis ke nilai huruf dan bobot.
            </Text>

            <View style={styles.modalActions}>
              <Pressable
                style={styles.cancelButton}
                onPress={() => setModalVisible(false)}
                disabled={saving}
              >
                <Text style={styles.cancelButtonText}>
                  Batal
                </Text>
              </Pressable>

              {selectedGrade &&
                selectedGrade.score !== null && (
                  <Pressable
                    style={styles.resetButton}
                    onPress={handleResetGrade}
                    disabled={saving}
                  >
                    <Text style={styles.resetButtonText}>
                      Kosongkan
                    </Text>
                  </Pressable>
                )}

              <Pressable
                style={[
                  styles.saveButton,
                  saving && styles.disabledButton,
                ]}
                onPress={handleSaveGrade}
                disabled={saving}
              >
                {saving ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text style={styles.saveButtonText}>
                    Simpan
                  </Text>
                )}
              </Pressable>
            </View>
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
    color: '#64748B',
    fontSize: 14,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  pageTitle: {
    fontSize: 25,
    fontWeight: '800',
    color: '#0F172A',
  },
  pageSubtitle: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 5,
  },
  headerIcon: {
    width: 48,
    height: 48,
    borderRadius: 15,
    backgroundColor: '#DBEAFE',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerIconText: {
    fontSize: 23,
  },
  ipCard: {
    backgroundColor: '#1D4ED8',
    borderRadius: 22,
    padding: 22,
    marginBottom: 16,
    overflow: 'hidden',
  },
  ipCardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  ipLabel: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  ipDescription: {
    color: '#DBEAFE',
    fontSize: 11,
    marginTop: 5,
  },
  trophyIcon: {
    fontSize: 28,
  },
  ipValue: {
    color: '#FFFFFF',
    fontSize: 49,
    fontWeight: '800',
    marginTop: 13,
  },
  ipProgressBackground: {
    height: 7,
    backgroundColor: '#3B82F6',
    borderRadius: 10,
    marginTop: 12,
    overflow: 'hidden',
  },
  ipProgress: {
    height: 7,
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
  },
  ipFooter: {
    color: '#DBEAFE',
    fontSize: 11,
    marginTop: 9,
  },
  summaryRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 25,
  },
  summaryCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 17,
    paddingVertical: 15,
    paddingHorizontal: 8,
    alignItems: 'center',
    elevation: 2,
  },
  summaryIcon: {
    width: 38,
    height: 38,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 9,
  },
  summaryValue: {
    fontSize: 21,
    fontWeight: '800',
    color: '#0F172A',
  },
  summaryLabel: {
    fontSize: 10,
    color: '#64748B',
    marginTop: 5,
    textAlign: 'center',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  sectionTitle: {
    fontSize: 19,
    fontWeight: '800',
    color: '#0F172A',
  },
  sectionSubtitle: {
    color: '#64748B',
    fontSize: 12,
    marginTop: 4,
  },
  countBadge: {
    backgroundColor: '#DBEAFE',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 10,
  },
  countBadgeText: {
    color: '#1D4ED8',
    fontWeight: '700',
    fontSize: 12,
  },
  gradeCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 17,
    padding: 15,
    marginBottom: 12,
    elevation: 2,
  },
  cardTop: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  numberBadge: {
    width: 35,
    height: 35,
    borderRadius: 11,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 11,
  },
  numberText: {
    color: '#2563EB',
    fontWeight: '800',
  },
  courseInfo: {
    flex: 1,
    paddingRight: 6,
  },
  courseCode: {
    color: '#2563EB',
    fontWeight: '800',
    fontSize: 11,
  },
  courseName: {
    color: '#0F172A',
    fontWeight: '700',
    fontSize: 13,
    marginTop: 4,
  },
  courseSKS: {
    color: '#64748B',
    fontSize: 11,
    marginTop: 4,
  },
  gradeBadge: {
    width: 45,
    height: 45,
    borderRadius: 13,
    backgroundColor: '#DCFCE7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  gradeLetter: {
    color: '#15803D',
    fontWeight: '800',
    fontSize: 18,
  },
  pendingBadge: {
    backgroundColor: '#F1F5F9',
  },
  pendingText: {
    color: '#64748B',
  },
  cardDivider: {
    height: 1,
    backgroundColor: '#E2E8F0',
    marginVertical: 14,
  },
  gradeDetails: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  detailItem: {
    flex: 1,
  },
  detailLabel: {
    color: '#64748B',
    fontSize: 10,
  },
  detailValue: {
    color: '#0F172A',
    fontWeight: '700',
    fontSize: 13,
    marginTop: 5,
  },
  editButton: {
    backgroundColor: '#2563EB',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  editButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 11,
  },
  emptyContainer: {
    alignItems: 'center',
    padding: 28,
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
  },
  emptyIcon: {
    fontSize: 40,
    marginBottom: 12,
  },
  emptyTitle: {
    color: '#0F172A',
    fontWeight: '800',
    fontSize: 16,
  },
  emptyText: {
    color: '#64748B',
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 19,
    marginTop: 8,
  },
  footer: {
    paddingVertical: 10,
    gap: 5,
  },
  footerText: {
    color: '#64748B',
    fontSize: 11,
    lineHeight: 17,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.55)',
    justifyContent: 'center',
    padding: 20,
  },
  modalCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    padding: 22,
    elevation: 10,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 18,
  },
  modalTitleContainer: {
    flex: 1,
  },
  modalTitle: {
    fontSize: 21,
    fontWeight: '800',
    color: '#0F172A',
  },
  modalSubtitle: {
    color: '#64748B',
    fontSize: 12,
    marginTop: 5,
  },
  closeButton: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonText: {
    color: '#475569',
    fontSize: 15,
    fontWeight: '700',
  },
  selectedCourse: {
    backgroundColor: '#EFF6FF',
    borderRadius: 13,
    padding: 13,
    marginBottom: 20,
  },
  selectedCode: {
    color: '#2563EB',
    fontSize: 12,
    fontWeight: '800',
  },
  selectedName: {
    color: '#1E293B',
    fontSize: 13,
    fontWeight: '600',
    marginTop: 5,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#334155',
    marginBottom: 8,
  },
  scoreInput: {
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 12,
    height: 52,
    paddingHorizontal: 15,
    fontSize: 18,
    fontWeight: '700',
    color: '#0F172A',
    backgroundColor: '#FFFFFF',
  },
  inputHint: {
    color: '#64748B',
    fontSize: 11,
    marginTop: 8,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 25,
  },
  cancelButton: {
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: '#F1F5F9',
  },
  cancelButtonText: {
    color: '#475569',
    fontWeight: '700',
    fontSize: 12,
  },
  resetButton: {
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: '#FEE2E2',
  },
  resetButtonText: {
    color: '#B91C1C',
    fontWeight: '700',
    fontSize: 12,
  },
  saveButton: {
    minWidth: 78,
    alignItems: 'center',
    paddingHorizontal: 15,
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: '#2563EB',
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 12,
  },
  disabledButton: {
    opacity: 0.6,
  },
});
