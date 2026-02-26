import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { Provider as PaperProvider } from 'react-native-paper';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AppRegistry } from 'react-native';

import ExpertListScreen from './src/screens/ExpertListScreen';
import ExpertDetailScreen from './src/screens/ExpertDetailScreen';
import BookingScreen from './src/screens/BookingScreen';
import MyBookingsScreen from './src/screens/MyBookingsScreen';
import ManageResourceScreen from './src/screens/ManageResourceScreen';
import UserSelectionScreen from './src/screens/UserSelectionScreen';
import CompanyDashboardScreen from './src/screens/CompanyDashboardScreen';

const Stack = createStackNavigator();

export default function App() {
  return (
    <SafeAreaProvider>
      <PaperProvider>
        <NavigationContainer>
          <StatusBar style="auto" />
          <Stack.Navigator initialRouteName="UserSelection">
            <Stack.Screen
              name="UserSelection"
              component={UserSelectionScreen}
              options={{ headerShown: false }}
            />
            <Stack.Screen
              name="CompanyDashboard"
              component={CompanyDashboardScreen}
              options={{ title: 'Command Center' }}
            />
            <Stack.Screen
              name="ExpertList"
              component={ExpertListScreen}
              options={{ title: 'Services' }}
            />
            <Stack.Screen
              name="ExpertDetail"
              component={ExpertDetailScreen}
              options={{ title: 'Details' }}
            />
            <Stack.Screen
              name="Booking"
              component={BookingScreen}
              options={{ title: 'Book Now' }}
            />
            <Stack.Screen
              name="MyBookings"
              component={MyBookingsScreen}
              options={{ title: 'My Schedule' }}
            />
            <Stack.Screen
              name="ManageResource"
              component={ManageResourceScreen}
              options={{ title: 'Control Panel' }}
            />
          </Stack.Navigator>
        </NavigationContainer>
      </PaperProvider>
    </SafeAreaProvider>
  );
}

AppRegistry.registerComponent('ExpertBookingMobile', () => App);
