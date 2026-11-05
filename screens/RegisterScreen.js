import React, { useState } from 'react';

import {
  View,
  Text,
  StyleSheet,
  TextInput,
  Pressable,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';

import AsyncStorage from '@react-native-async-storage/async-storage';


const USER_KEY = '@student_app_user';


export default function RegisterScreen({
  onRegisterSuccess,
  onBackToLogin,
}) {

  const [name, setName] = useState('');

  const [nim, setNim] = useState('');

  const [email, setEmail] = useState('');

  const [password, setPassword] = useState('');

  const [confirmPassword, setConfirmPassword] =
    useState('');

  const [loading, setLoading] =
    useState(false);


  const handleRegister = async () => {

    if (
      name.trim() === '' ||
      nim.trim() === '' ||
      email.trim() === '' ||
      password === '' ||
      confirmPassword === ''
    ) {

      Alert.alert(
        'Registrasi Gagal',
        'Semua field harus diisi.'
      );

      return;
    }


    if (!email.includes('@')) {

      Alert.alert(
        'Email Tidak Valid',
        'Masukkan alamat email yang benar.'
      );

      return;
    }


    if (password.length < 6) {

      Alert.alert(
        'Password Terlalu Pendek',
        'Password minimal 6 karakter.'
      );

      return;
    }


    if (password !== confirmPassword) {

      Alert.alert(
        'Password Tidak Sama',
        'Konfirmasi password harus sama.'
      );

      return;
    }


    try {

      setLoading(true);


      const existingUser =
        await AsyncStorage.getItem(USER_KEY);


      if (existingUser) {

        const user =
          JSON.parse(existingUser);


        if (
          user.email.toLowerCase() ===
          email.trim().toLowerCase()
        ) {

          Alert.alert(
            'Email Sudah Terdaftar',
            'Gunakan email yang berbeda.'
          );

          setLoading(false);

          return;
        }

      }


      const newUser = {

        name: name.trim(),

        nim: nim.trim(),

        email:
          email
            .trim()
            .toLowerCase(),

        password: password,

        prodi: 'Teknik Informatika',

      };


      await AsyncStorage.setItem(

        USER_KEY,

        JSON.stringify(newUser)

      );


      setLoading(false);


      Alert.alert(

        'Registrasi Berhasil 🎉',

        'Akun berhasil dibuat. Silakan login.',

        [
          {
            text: 'OK',
            onPress: onRegisterSuccess,
          },
        ]

      );

    } catch (error) {

      console.log(
        'Register error:',
        error
      );

      setLoading(false);

      Alert.alert(
        'Error',
        'Terjadi kesalahan saat registrasi.'
      );

    }

  };


  return (

    <KeyboardAvoidingView
      style={styles.container}
      behavior={
        Platform.OS === 'ios'
          ? 'padding'
          : undefined
      }
    >

      <ScrollView
        contentContainerStyle={
          styles.scrollContainer
        }
        keyboardShouldPersistTaps="handled"
      >

        {/* BACK */}

        <Pressable
          style={styles.backButton}
          onPress={onBackToLogin}
        >

          <Text style={styles.backText}>
            ‹ Kembali ke Login
          </Text>

        </Pressable>


        {/* HEADER */}

        <View style={styles.header}>

          <View style={styles.logoContainer}>

            <Text style={styles.logo}>
              🎓
            </Text>

          </View>

          <Text style={styles.title}>
            Buat Akun
          </Text>

          <Text style={styles.subtitle}>
            Daftar sebagai mahasiswa StudentApp
          </Text>

        </View>


        {/* FORM */}

        <View style={styles.card}>

          {/* NAMA */}

          <Text style={styles.label}>
            Nama Lengkap
          </Text>

          <TextInput
            style={styles.input}
            placeholder="Contoh: Fiky Anggara"
            placeholderTextColor="#94a3b8"
            value={name}
            onChangeText={setName}
          />


          {/* NIM */}

          <Text style={styles.label}>
            NIM
          </Text>

          <TextInput
            style={styles.input}
            placeholder="Contoh: 202601001"
            placeholderTextColor="#94a3b8"
            value={nim}
            onChangeText={setNim}
            keyboardType="numeric"
          />


          {/* EMAIL */}

          <Text style={styles.label}>
            Email
          </Text>

          <TextInput
            style={styles.input}
            placeholder="contoh@email.com"
            placeholderTextColor="#94a3b8"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
          />


          {/* PASSWORD */}

          <Text style={styles.label}>
            Password
          </Text>

          <TextInput
            style={styles.input}
            placeholder="Minimal 6 karakter"
            placeholderTextColor="#94a3b8"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />


          {/* CONFIRM */}

          <Text style={styles.label}>
            Konfirmasi Password
          </Text>

          <TextInput
            style={styles.input}
            placeholder="Ulangi password"
            placeholderTextColor="#94a3b8"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            secureTextEntry
          />


          {/* REGISTER */}

          <Pressable
            style={({ pressed }) => [
              styles.registerButton,
              pressed && styles.pressed,
            ]}
            onPress={handleRegister}
            disabled={loading}
          >

            <Text style={styles.registerButtonText}>

              {loading
                ? 'Mendaftarkan...'
                : 'Daftar Akun'}

            </Text>

          </Pressable>

        </View>


        <Text style={styles.footer}>
          StudentApp • STITEK Bontang
        </Text>

      </ScrollView>

    </KeyboardAvoidingView>

  );

}


const styles = StyleSheet.create({

  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },

  scrollContainer: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingVertical: 30,
  },

  backButton: {
    marginBottom: 25,
  },

  backText: {
    fontSize: 14,
    color: '#2563eb',
    fontWeight: '700',
  },

  header: {
    alignItems: 'center',
    marginBottom: 25,
  },

  logoContainer: {
    width: 65,
    height: 65,
    borderRadius: 19,
    backgroundColor: '#dbeafe',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },

  logo: {
    fontSize: 32,
  },

  title: {
    fontSize: 27,
    fontWeight: '800',
    color: '#0f172a',
  },

  subtitle: {
    marginTop: 5,
    textAlign: 'center',
    fontSize: 13,
    color: '#64748b',
  },

  card: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 22,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },

  label: {
    fontSize: 13,
    fontWeight: '700',
    color: '#334155',
    marginBottom: 7,
    marginTop: 10,
  },

  input: {
    height: 50,
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 12,
    paddingHorizontal: 14,
    fontSize: 14,
    color: '#0f172a',
    backgroundColor: '#f8fafc',
  },

  registerButton: {
    height: 52,
    backgroundColor: '#2563eb',
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 25,
  },

  pressed: {
    opacity: 0.7,
  },

  registerButtonText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '800',
  },

  footer: {
    textAlign: 'center',
    marginTop: 25,
    fontSize: 12,
    color: '#94a3b8',
  },

});