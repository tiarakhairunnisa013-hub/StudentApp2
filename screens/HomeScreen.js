
import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  ActivityIndicator,
  Alert,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';

const COURSES_STORAGE_KEY = '@student_app_courses';
const GRADES_STORAGE_KEY = '@student_app_grades';

// Data awal jika aplikasi belum memiliki data tersimpan.
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

export default function HomeScreen({ navigation, onLogout }) {
  const [dashboard, setDashboard] = useState({
    totalCourses: 0,
    totalSKS: 0,
    totalGraded: 0,
    ipSemester: 0,
  });

  const [loading, setLoading] = useState(true);

  // Memuat ulang ringkasan saat tab Home kembali dibuka.
  useFocusEffect(
    useCallback(() => {
      let active = true;

      const loadDashboard = async () => {
        setLoading(true);

        try {
          const storedCourses = await AsyncStorage.getItem(
            COURSES_STORAGE_KEY
          );

          const storedGrades = await AsyncStorage.getItem(
            GRADES_STORAGE_KEY
          );

          let courses = storedCourses
            ? JSON.parse(storedCourses)
            : INITIAL_COURSES;

          let grades = storedGrades
            ? JSON.parse(storedGrades)
            : INITIAL_GRADES;

          if (!Array.isArray(courses)) {
            courses = INITIAL_COURSES;
          }

          if (!Array.isArray(grades)) {
            grades = INITIAL_GRADES;
          }

          // Simpan data awal hanya jika penyimpanan belum tersedia.
          if (storedCourses === null) {
            await AsyncStorage.setItem(
              COURSES_STORAGE_KEY,
              JSON.stringify(courses)
            );
          }

          if (storedGrades === null) {
            await AsyncStorage.setItem(
              GRADES_STORAGE_KEY,
              JSON.stringify(grades)
            );
          }

          // Hanya nilai milik mata kuliah yang masih terdaftar
          // yang digunakan untuk menghitung IP semester.
          const activeCourseCodes = new Set(
            courses.map((course) => course.code)
          );

          const validGrades = grades.filter(
            (item) =>
              activeCourseCodes.has(item.code) &&
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

          const totalSKSDinilai = validGrades.reduce(
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
            totalSKSDinilai > 0
              ? totalBobot / totalSKSDinilai
              : 0;

          if (active) {
            setDashboard({
              totalCourses: courses.length,
              totalSKS,
              totalGraded: validGrades.length,
              ipSemester,
            });
          }
        } catch (error) {
          console.error(
            'Gagal memuat dashboard:',
            error
          );

          if (active) {
            Alert.alert(
              'Gagal Memuat Data',
              'Ringkasan akademik tidak dapat dimuat. Silakan buka kembali halaman Home.'
            );
          }
        } finally {
          if (active) setLoading(false);
        }
      };

      loadDashboard();

      return () => {
        active = false;
      };
    }, [])
  );

  // Navigasi menu.
  const handleMenuPress = (routeName, menuTitle) => {
    const routeNames =
      navigation?.getState?.()?.routeNames ?? [];

    if (!routeNames.includes(routeName)) {
      Alert.alert(
        'Menu Belum Tersedia',
        `Halaman ${menuTitle} belum didaftarkan di App.js.`
      );
      return;
    }

    navigation.navigate(routeName);
  };

  const handleLogout = () => {
    Alert.alert(
      'Konfirmasi Keluar',
      'Apakah Anda yakin ingin keluar dari aplikasi?',
      [
        {
          text: 'Batal',
          style: 'cancel',
        },
        {
          text: 'Keluar',
          style: 'destructive',
          onPress: () => {
            if (onLogout) {
              onLogout();
            }
          },
        },
      ]
    );
  };

  const menus = [
    {
      title: 'Mata Kuliah',
      subtitle: 'Kelola mata kuliah',
      icon: '📚',
      route: 'Courses',
      color: '#DBEAFE',
    },
    {
      title: 'Nilai',
      subtitle: 'Lihat dan input nilai',
      icon: '📊',
      route: 'Grades',
      color: '#D1FAE5',
    },
    {
      title: 'Profil',
      subtitle: 'Informasi mahasiswa',
      icon: '👤',
      route: 'Profile',
      color: '#EDE9FE',
    },
  ];

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator
          size="large"
          color="#2563EB"
        />
        <Text style={styles.loadingText}>
          Memuat dashboard akademik...
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerTextContainer}>
            <Text style={styles.greeting}>
              Selamat Datang 👋
            </Text>
            <Text style={styles.headerTitle}>
              StudentApp
            </Text>
            <Text style={styles.headerSubtitle}>
              Dashboard akademik mahasiswa
            </Text>
          </View>

          <View style={styles.avatar}>
            <Text style={styles.avatarText}>🎓</Text>
          </View>
        </View>

        {/* Welcome card */}
        <View style={styles.welcomeCard}>
          <View style={styles.welcomeTextContainer}>
            <Text style={styles.welcomeEyebrow}>
              AKADEMIK
            </Text>
            <Text style={styles.welcomeTitle}>
              Pantau progres{"\n"}kuliahmu!
            </Text>
            <Text style={styles.welcomeDescription}>
              Kelola mata kuliah dan pantau hasil akademik
              dalam satu aplikasi.
            </Text>
          </View>

          <View style={styles.welcomeIllustration}>
            <Text style={styles.welcomeEmoji}>📘</Text>
          </View>
        </View>

        {/* Ringkasan akademik */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>
            Ringkasan Akademik
          </Text>
          <Text style={styles.liveLabel}>
            DATA TERKINI
          </Text>
        </View>

        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <View
              style={[
                styles.statIcon,
                { backgroundColor: '#DBEAFE' },
              ]}
            >
              <Text style={styles.statEmoji}>📚</Text>
            </View>

            <Text style={styles.statValue}>
              {dashboard.totalCourses}
            </Text>
            <Text style={styles.statLabel}>
              Mata Kuliah
            </Text>
          </View>

          <View style={styles.statCard}>
            <View
              style={[
                styles.statIcon,
                { backgroundColor: '#D1FAE5' },
              ]}
            >
              <Text style={styles.statEmoji}>🎓</Text>
            </View>

            <Text style={styles.statValue}>
              {dashboard.totalSKS}
            </Text>
            <Text style={styles.statLabel}>
              Total SKS
            </Text>
          </View>

          <View style={styles.statCard}>
            <View
              style={[
                styles.statIcon,
                { backgroundColor: '#EDE9FE' },
              ]}
            >
              <Text style={styles.statEmoji}>📈</Text>
            </View>

            <Text style={styles.statValue}>
              {dashboard.ipSemester.toFixed(2)}
            </Text>
            <Text style={styles.statLabel}>
              IP Semester
            </Text>
          </View>

          <View style={styles.statCard}>
            <View
              style={[
                styles.statIcon,
                { backgroundColor: '#FEF3C7' },
              ]}
            >
              <Text style={styles.statEmoji}>✅</Text>
            </View>

            <Text style={styles.statValue}>
              {dashboard.totalGraded}
            </Text>
            <Text style={styles.statLabel}>
              Nilai Terisi
            </Text>
          </View>
        </View>

        {/* Menu akademik */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>
            Menu Akademik
          </Text>
        </View>

        <View style={styles.menuGrid}>
          {menus.map((menu) => (
            <Pressable
              key={menu.route}
              style={({ pressed }) => [
                styles.menuCard,
                pressed && styles.menuCardPressed,
              ]}
              onPress={() =>
                handleMenuPress(menu.route, menu.title)
              }
            >
              <View
                style={[
                  styles.menuIcon,
                  { backgroundColor: menu.color },
                ]}
              >
                <Text style={styles.menuEmoji}>
                  {menu.icon}
                </Text>
              </View>

              <View style={styles.menuTextContainer}>
                <Text style={styles.menuTitle}>
                  {menu.title}
                </Text>
                <Text style={styles.menuSubtitle}>
                  {menu.subtitle}
                </Text>
              </View>

              <Text style={styles.menuArrow}>›</Text>
            </Pressable>
          ))}
        </View>

        {/* Informasi progres */}
        <View style={styles.progressCard}>
          <View style={styles.progressHeader}>
            <View style={styles.progressIcon}>
              <Text style={styles.progressEmoji}>📋</Text>
            </View>

            <View style={styles.progressTextContainer}>
              <Text style={styles.progressTitle}>
                Progres Penilaian
              </Text>
              <Text style={styles.progressSubtitle}>
                Mata kuliah yang sudah memiliki nilai
              </Text>
            </View>
          </View>

          <View style={styles.progressNumbers}>
            <Text style={styles.progressCount}>
              {dashboard.totalGraded} dari{' '}
              {dashboard.totalCourses}
            </Text>

            <Text style={styles.progressPercent}>
              {dashboard.totalCourses > 0
                ? Math.round(
                    (dashboard.totalGraded /
                      dashboard.totalCourses) *
                      100
                  )
                : 0}
              %
            </Text>
          </View>

          <View style={styles.progressBarBackground}>
            <View
              style={[
                styles.progressBar,
                {
                  width: `${
                    dashboard.totalCourses > 0
                      ? Math.min(
                          (dashboard.totalGraded /
                            dashboard.totalCourses) *
                            100,
                          100
                        )
                      : 0
                  }%`,
                },
              ]}
            />
          </View>
        </View>

        {/* Motivasi */}
        <View style={styles.quoteCard}>
          <Text style={styles.quoteIcon}>💡</Text>
          <View style={styles.quoteTextContainer}>
            <Text style={styles.quoteTitle}>
              Tetap Semangat!
            </Text>
            <Text style={styles.quoteText}>
              Konsistensi belajar hari ini adalah investasi
              untuk masa depanmu.
            </Text>
          </View>
        </View>

        {/* Logout */}
        <Pressable
          style={({ pressed }) => [
            styles.logoutButton,
            pressed && styles.logoutButtonPressed,
          ]}
          onPress={handleLogout}
        >
          <Text style={styles.logoutIcon}>↪</Text>
          <Text style={styles.logoutText}>
            Keluar dari Aplikasi
          </Text>
        </Pressable>

        <Text style={styles.footer}>
          StudentApp • Dashboard Akademik
        </Text>
      </ScrollView>
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
    marginBottom: 22,
  },
  headerTextContainer: {
    flex: 1,
  },
  greeting: {
    fontSize: 13,
    color: '#64748B',
    marginBottom: 4,
  },
  headerTitle: {
    fontSize: 27,
    fontWeight: '800',
    color: '#0F172A',
  },
  headerSubtitle: {
    color: '#64748B',
    fontSize: 12,
    marginTop: 4,
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 17,
    backgroundColor: '#DBEAFE',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 12,
  },
  avatarText: {
    fontSize: 27,
  },
  welcomeCard: {
    backgroundColor: '#1D4ED8',
    borderRadius: 22,
    padding: 21,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 26,
    overflow: 'hidden',
  },
  welcomeTextContainer: {
    flex: 1,
  },
  welcomeEyebrow: {
    color: '#BFDBFE',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.5,
    marginBottom: 9,
  },
  welcomeTitle: {
    color: '#FFFFFF',
    fontSize: 23,
    lineHeight: 29,
    fontWeight: '800',
  },
  welcomeDescription: {
    color: '#DBEAFE',
    fontSize: 11,
    lineHeight: 18,
    marginTop: 9,
    maxWidth: 230,
  },
  welcomeIllustration: {
    width: 72,
    height: 82,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.14)',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
  welcomeEmoji: {
    fontSize: 40,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 13,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
  },
  liveLabel: {
    fontSize: 9,
    fontWeight: '800',
    color: '#15803D',
    backgroundColor: '#DCFCE7',
    borderRadius: 7,
    paddingHorizontal: 8,
    paddingVertical: 5,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 27,
  },
  statCard: {
    width: '48%',
    flexGrow: 1,
    flexBasis: '40%',
    backgroundColor: '#FFFFFF',
    borderRadius: 17,
    padding: 15,
    minHeight: 132,
    elevation: 2,
  },
  statIcon: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  statEmoji: {
    fontSize: 19,
  },
  statValue: {
    color: '#0F172A',
    fontSize: 24,
    fontWeight: '800',
  },
  statLabel: {
    color: '#64748B',
    fontSize: 11,
    marginTop: 4,
  },
  menuGrid: {
    gap: 11,
    marginBottom: 25,
  },
  menuCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    elevation: 1,
  },
  menuCardPressed: {
    opacity: 0.7,
    transform: [{ scale: 0.99 }],
  },
  menuIcon: {
    width: 46,
    height: 46,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 13,
  },
  menuEmoji: {
    fontSize: 23,
  },
  menuTextContainer: {
    flex: 1,
  },
  menuTitle: {
    color: '#0F172A',
    fontSize: 14,
    fontWeight: '800',
  },
  menuSubtitle: {
    color: '#64748B',
    fontSize: 11,
    marginTop: 4,
  },
  menuArrow: {
    color: '#94A3B8',
    fontSize: 29,
    marginLeft: 8,
  },
  progressCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 17,
    marginBottom: 15,
    elevation: 1,
  },
  progressHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  progressIcon: {
    width: 42,
    height: 42,
    borderRadius: 13,
    backgroundColor: '#DBEAFE',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  progressEmoji: {
    fontSize: 21,
  },
  progressTextContainer: {
    flex: 1,
  },
  progressTitle: {
    color: '#0F172A',
    fontSize: 14,
    fontWeight: '800',
  },
  progressSubtitle: {
    color: '#64748B',
    fontSize: 11,
    marginTop: 4,
  },
  progressNumbers: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 19,
    marginBottom: 9,
  },
  progressCount: {
    color: '#334155',
    fontSize: 12,
    fontWeight: '700',
  },
  progressPercent: {
    color: '#2563EB',
    fontSize: 13,
    fontWeight: '800',
  },
  progressBarBackground: {
    height: 8,
    backgroundColor: '#E2E8F0',
    borderRadius: 10,
    overflow: 'hidden',
  },
  progressBar: {
    height: 8,
    backgroundColor: '#2563EB',
    borderRadius: 10,
  },
  quoteCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#EFF6FF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
  },
  quoteIcon: {
    fontSize: 25,
    marginRight: 12,
  },
  quoteTextContainer: {
    flex: 1,
  },
  quoteTitle: {
    color: '#1E40AF',
    fontSize: 13,
    fontWeight: '800',
    marginBottom: 5,
  },
  quoteText: {
    color: '#475569',
    fontSize: 12,
    lineHeight: 19,
  },
  logoutButton: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#FECACA',
    borderRadius: 14,
    paddingVertical: 14,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoutButtonPressed: {
    opacity: 0.7,
  },
  logoutIcon: {
    color: '#DC2626',
    fontSize: 19,
    fontWeight: '800',
    marginRight: 8,
  },
  logoutText: {
    color: '#DC2626',
    fontWeight: '800',
    fontSize: 13,
  },
  footer: {
    color: '#94A3B8',
    fontSize: 10,
    textAlign: 'center',
    marginTop: 19,
  },
});
