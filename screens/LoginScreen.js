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
const LOGIN_KEY = '@student_app_logged_in';


export default function LoginScreen({
  onLogin,
  onRegister,
}) {

  const [email, setEmail] = useState('');

  const [password, setPassword] = useState('');

  const [showPassword, setShowPassword] =
    useState(false);

  const [loading, setLoading] =
    useState(false);


  const handleLogin = async () => {

    if (
      email.trim() === '' ||
      password === ''
    ) {

      Alert.alert(
        'Login Gagal',
        'Email dan password harus diisi.'
      );

      return;
    }


    try {

      setLoading(true);


      const savedUser =
        await AsyncStorage.getItem(USER_KEY);


      if (!savedUser) {

        Alert.alert(
          'Belum Terdaftar',
          'Silakan membuat akun terlebih dahulu.'
        );

        setLoading(false);

        return;
      }


      const user =
        JSON.parse(savedUser);


      if (
        email.trim().toLowerCase() !==
          user.email.toLowerCase() ||
        password !== user.password
      ) {

        Alert.alert(
          'Login Gagal',
          'Email atau password salah.'
        );

        setLoading(false);

        return;
      }


      await AsyncStorage.setItem(
        LOGIN_KEY,
        'true'
      );


      setLoading(false);

      onLogin(user);

    } catch (error) {

      console.log(
        'Login error:',
        error
      );

      setLoading(false);

      Alert.alert(
        'Error',
        'Terjadi kesalahan saat login.'
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

        {/* LOGO */}

        <View style={styles.logoContainer}>

          <Text style={styles.logo}>
            🎓
          </Text>

        </View>


        {/* TITLE */}

        <Text style={styles.title}>
          StudentApp
        </Text>

        <Text style={styles.subtitle}>
          Sistem Informasi Akademik Mahasiswa
        </Text>


        {/* CARD */}

        <View style={styles.card}>

          <Text style={styles.cardTitle}>
            Selamat Datang 👋
          </Text>

          <Text style={styles.cardSubtitle}>
            Silakan login untuk melanjutkan
          </Text>


          {/* EMAIL */}

          <Text style={styles.label}>
            Email
          </Text>

          <TextInput
            style={styles.input}
            placeholder="Masukkan email"
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

          <View style={styles.passwordContainer}>

            <TextInput
              style={styles.passwordInput}
              placeholder="Masukkan password"
              placeholderTextColor="#94a3b8"
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
            />

            <Pressable
              onPress={() =>
                setShowPassword(!showPassword)
              }
            >

              <Text style={styles.showPassword}>
                {showPassword ? '🙈' : '👁️'}
              </Text>

            </Pressable>

          </View>


          {/* LOGIN BUTTON */}

          <Pressable
            style={({ pressed }) => [
              styles.loginButton,
              pressed && styles.pressed,
            ]}
            onPress={handleLogin}
            disabled={loading}
          >

            <Text style={styles.loginButtonText}>

              {loading
                ? 'Memproses...'
                : 'Login'}

            </Text>

          </Pressable>


          {/* REGISTER */}

          <View style={styles.registerContainer}>

            <Text style={styles.registerText}>
              Belum memiliki akun?
            </Text>

            <Pressable
              onPress={onRegister}
            >

              <Text style={styles.registerLink}>
                Daftar sekarang
              </Text>

            </Pressable>

          </View>

        </View>


        {/* FOOTER */}

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
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingVertical: 40,
  },

  logoContainer: {
    width: 76,
    height: 76,
    borderRadius: 22,
    backgroundColor: '#dbeafe',
    alignSelf: 'center',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 15,
  },

  logo: {
    fontSize: 40,
  },

  title: {
    textAlign: 'center',
    fontSize: 30,
    fontWeight: '800',
    color: '#0f172a',
  },

  subtitle: {
    textAlign: 'center',
    fontSize: 13,
    color: '#64748b',
    marginTop: 5,
    marginBottom: 25,
  },

  card: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 22,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },

  cardTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#0f172a',
  },

  cardSubtitle: {
    marginTop: 5,
    marginBottom: 20,
    fontSize: 13,
    color: '#64748b',
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

  passwordContainer: {
    height: 50,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 12,
    paddingLeft: 14,
    paddingRight: 10,
    backgroundColor: '#f8fafc',
  },

  passwordInput: {
    flex: 1,
    fontSize: 14,
    color: '#0f172a',
  },

  showPassword: {
    fontSize: 19,
    padding: 5,
  },

  loginButton: {
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

  loginButtonText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '800',
  },

  registerContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 20,
  },

  registerText: {
    fontSize: 13,
    color: '#64748b',
  },

  registerLink: {
    marginLeft: 5,
    fontSize: 13,
    color: '#2563eb',
    fontWeight: '800',
  },

  footer: {
    textAlign: 'center',
    marginTop: 25,
    fontSize: 12,
    color: '#94a3b8',
  },

});