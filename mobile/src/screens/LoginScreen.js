import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
  Alert
} from 'react-native';
import { TextInput, Button, Title, Paragraph, Surface } from 'react-native-paper';
import authService from '../services/authService';

const LoginScreen = ({ navigation }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    setLoading(true);
    try {
      const user = await authService.login(email, password);
      
      // Determine navigation based on role
      if (user.role === 'admin') {
        navigation.replace('CompanyDashboard');
      } else if (user.role === 'expert') {
        navigation.replace('CompanyDashboard'); // Will refine this later to a specific Expert view
      } else {
        navigation.replace('ExpertList');
      }
    } catch (error) {
      Alert.alert('Login Failed', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <Surface style={styles.surface}>
        <Title style={styles.title}>ExpertBooking</Title>
        <Paragraph style={styles.subtitle}>Enter your credentials to continue</Paragraph>

        <TextInput
          label="Email"
          value={email}
          onChangeText={setEmail}
          mode="outlined"
          autoCapitalize="none"
          keyboardType="email-address"
          style={styles.input}
        />

        <TextInput
          label="Password"
          value={password}
          onChangeText={setPassword}
          mode="outlined"
          secureTextEntry
          style={styles.input}
        />

        <Button
          mode="contained"
          onPress={handleLogin}
          loading={loading}
          disabled={loading}
          style={styles.button}
        >
          Login
        </Button>

        <View style={styles.footer}>
          <Text>Don't have an account? </Text>
          <TouchableOpacity onPress={() => navigation.navigate('Register')}>
            <Text style={styles.link}>Register</Text>
          </TouchableOpacity>
        </View>
      </Surface>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f7fb',
    justifyContent: 'center',
    padding: 20
  },
  surface: {
    padding: 30,
    borderRadius: 20,
    elevation: 4,
    backgroundColor: '#fff'
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
    color: '#6200ee'
  },
  subtitle: {
    textAlign: 'center',
    marginBottom: 30,
    color: '#666'
  },
  input: {
    marginBottom: 16
  },
  button: {
    marginTop: 10,
    paddingVertical: 5
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 20
  },
  link: {
    color: '#6200ee',
    fontWeight: 'bold'
  }
});

export default LoginScreen;
