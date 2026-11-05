import React, { useEffect, useState } from 'react';

import {
  Text,
  View,
  ActivityIndicator,
} from 'react-native';

import AsyncStorage from '@react-native-async-storage/async-storage';

import {
  NavigationContainer,
} from '@react-navigation/native';

import {
  createBottomTabNavigator,
} from '@react-navigation/bottom-tabs';


import HomeScreen from './screens/HomeScreen';
import CourseScreen from './screens/CourseScreen';
import GradeScreen from './screens/GradeScreen';
//import ScheduleScreen from './screens/ScheduleScreen';
import ProfileScreen from './screens/ProfileScreen';

import LoginScreen from './screens/LoginScreen';
import RegisterScreen from './screens/RegisterScreen';


const Tab =
  createBottomTabNavigator();


const LOGIN_KEY =
  '@student_app_logged_in';


export default function App() {

  const [isLoggedIn, setIsLoggedIn] =
    useState(false);

  const [checkingLogin, setCheckingLogin] =
    useState(true);

  const [showRegister, setShowRegister] =
    useState(false);


  // =================================
  // CEK LOGIN
  // =================================

  useEffect(() => {

    checkLogin();

  }, []);


  const checkLogin = async () => {

    try {

      const loginStatus =
        await AsyncStorage.getItem(
          LOGIN_KEY
        );


      if (loginStatus === 'true') {

        setIsLoggedIn(true);

      }

    } catch (error) {

      console.log(
        'Check login error:',
        error
      );

    } finally {

      setCheckingLogin(false);

    }

  };


  // =================================
  // LOGIN
  // =================================

  const handleLogin = () => {

    setIsLoggedIn(true);

  };


  // =================================
  // REGISTER
  // =================================

  const handleRegisterSuccess = () => {

    setShowRegister(false);

  };


  // =================================
  // LOGOUT
  // =================================

  const handleLogout = async () => {

    await AsyncStorage.removeItem(
      LOGIN_KEY
    );

    setIsLoggedIn(false);

  };


  // =================================
  // LOADING
  // =================================

  if (checkingLogin) {

    return (

      <View
        style={{
          flex: 1,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#f8fafc',
        }}
      >

        <Text
          style={{
            fontSize: 28,
            marginBottom: 10,
          }}
        >
          🎓
        </Text>

        <ActivityIndicator
          size="large"
          color="#2563eb"
        />

        <Text
          style={{
            marginTop: 12,
            color: '#64748b',
          }}
        >
          Memeriksa login...
        </Text>

      </View>

    );

  }


  // =================================
  // REGISTER
  // =================================

  if (!isLoggedIn && showRegister) {

    return (

      <RegisterScreen
        onRegisterSuccess={
          handleRegisterSuccess
        }
        onBackToLogin={() =>
          setShowRegister(false)
        }
      />

    );

  }


  // =================================
  // LOGIN
  // =================================

  if (!isLoggedIn) {

    return (

      <LoginScreen
        onLogin={handleLogin}
        onRegister={() =>
          setShowRegister(true)
        }
      />

    );

  }


  // =================================
  // MAIN APP
  // =================================

  return (

    <NavigationContainer>

      <Tab.Navigator

        initialRouteName="Home"

        screenOptions={{

          headerShown: false,

          tabBarActiveTintColor:
            '#2563eb',

          tabBarInactiveTintColor:
            '#94a3b8',

          tabBarStyle: {

            height: 120,

            paddingTop: 2,

            paddingBottom: 10,

          },

          tabBarLabelStyle: {

            fontSize: 11,

            fontWeight: '600',

          },

        }}

      >

        <Tab.Screen

          name="Home"

          options={{

            tabBarLabel: 'Beranda',

            tabBarIcon: ({ color }) => (

              <Text
                style={{
                  fontSize: 22,
                  color,
                }}
              >
                🏠
              </Text>

            ),

          }}

        >

          {(props) => (

            <HomeScreen
              {...props}
              onLogout={handleLogout}
            />

          )}

        </Tab.Screen>


        <Tab.Screen

          name="Courses"

          component={CourseScreen}

          options={{

            tabBarLabel: 'Mata Kuliah',

            tabBarIcon: ({ color }) => (

              <Text
                style={{
                  fontSize: 22,
                  color,
                }}
              >
                📚
              </Text>

            ),

          }}

        />

                <Tab.Screen

          name="Grades"

          component={GradeScreen}

          options={{

            tabBarLabel: 'Nilai',

            tabBarIcon: ({ color }) => (

              <Text
                style={{
                  fontSize: 22,
                  color,
                }}
              >
                📝
              </Text>

            ),

          }}

        />

                <Tab.Screen

          name="Profile"

          component={ProfileScreen}

          options={{

            tabBarLabel: 'Profil',

            tabBarIcon: ({ color }) => (

              <Text
                style={{
                  fontSize: 22,
                  color,
                }}
              >
                👤
              </Text>

            ),

          }}

        />

      </Tab.Navigator>

    </NavigationContainer>

  );

}