import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { Provider as PaperProvider } from 'react-native-paper';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import ExpertListScreen from './src/screens/ExpertListScreen';
import ExpertDetailScreen from './src/screens/ExpertDetailScreen';
import BookingScreen from './src/screens/BookingScreen';
import MyBookingsScreen from './src/screens/MyBookingsScreen';

const Stack = createStackNavigator();

export default function App() {
  return (
    <SafeAreaProvider>
      <PaperProvider>
        <NavigationContainer>
          <StatusBar style="auto" />
          <Stack.Navigator initialRouteName="ExpertList">
            <Stack.Screen 
              name="ExpertList" 
              component={ExpertListScreen} 
              options={{ title: 'Expert Booking' }}
            />
            <Stack.Screen 
              name="ExpertDetail" 
              component={ExpertDetailScreen} 
              options={{ title: 'Expert Details' }}
            />
            <Stack.Screen 
              name="Booking" 
              component={BookingScreen} 
              options={{ title: 'Book Session' }}
            />
            <Stack.Screen 
              name="MyBookings" 
              component={MyBookingsScreen} 
              options={{ title: 'My Bookings' }}
            />
          </Stack.Navigator>
        </NavigationContainer>
      </PaperProvider>
    </SafeAreaProvider>
  );
}
