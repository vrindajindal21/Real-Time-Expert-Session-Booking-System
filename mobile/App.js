import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { Provider as PaperProvider } from 'react-native-paper';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AppRegistry, ActivityIndicator, View } from 'react-native';

import { AuthProvider, useAuth } from './src/services/AuthContext';
import ExpertListScreen from './src/screens/ExpertListScreen';
import ExpertDetailScreen from './src/screens/ExpertDetailScreen';
import BookingScreen from './src/screens/BookingScreen';
import MyBookingsScreen from './src/screens/MyBookingsScreen';
import ManageResourceScreen from './src/screens/ManageResourceScreen';
import UserSelectionScreen from './src/screens/UserSelectionScreen';
import CompanyDashboardScreen from './src/screens/CompanyDashboardScreen';
import LoginScreen from './src/screens/LoginScreen';
import RegisterScreen from './src/screens/RegisterScreen';

const Stack = createStackNavigator();

function Navigation() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#6200ee" />
      </View>
    );
  }

  return (
    <Stack.Navigator initialRouteName={user ? (user.role === 'user' ? 'ExpertList' : 'CompanyDashboard') : 'Login'}>
      {!user ? (
        <>
          <Stack.Screen name="Login" component={LoginScreen} options={{ headerShown: false }} />
          <Stack.Screen name="Register" component={RegisterScreen} options={{ headerShown: false }} />
        </>
      ) : (
        <>
          {/* Shared Screens */}
          <Stack.Screen name="ExpertList" component={ExpertListScreen} options={{ title: 'Find Experts' }} />
          <Stack.Screen name="ExpertDetail" component={ExpertDetailScreen} options={{ title: 'Expert Profile' }} />
          <Stack.Screen name="Booking" component={BookingScreen} options={{ title: 'Book Session' }} />
          <Stack.Screen name="MyBookings" component={MyBookingsScreen} options={{ title: 'My Schedule' }} />
          
          {/* Host/Admin Specific */}
          <Stack.Screen name="CompanyDashboard" component={CompanyDashboardScreen} options={{ title: 'Business Console' }} />
          <Stack.Screen name="ManageResource" component={ManageResourceScreen} options={{ title: 'Staff Management' }} />
          
          {/* Fallback Legacy Selection */}
          <Stack.Screen name="UserSelection" component={UserSelectionScreen} options={{ title: 'Switch View' }} />
        </>
      )}
    </Stack.Navigator>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <PaperProvider>
        <AuthProvider>
          <NavigationContainer>
            <StatusBar style="auto" />
            <Navigation />
          </NavigationContainer>
        </AuthProvider>
      </PaperProvider>
    </SafeAreaProvider>
  );
}

AppRegistry.registerComponent('ExpertBookingMobile', () => App);
