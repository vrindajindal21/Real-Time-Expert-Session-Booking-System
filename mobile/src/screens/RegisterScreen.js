import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
  Alert
} from 'react-native';
import { TextInput, Button, Title, Paragraph, Surface, RadioButton } from 'react-native-paper';
import authService from '../services/authService';

const RegisterScreen = ({ navigation }) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('user');
  const [loading, setLoading] = useState(false);

  const handleRegister = async () => {
    if (!name || !email || !password) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    setLoading(true);
    try {
      const user = await authService.register({ name, email, password, role });
      
      if (user.role === 'expert') {
        navigation.replace('CompanyDashboard'); // Refine later
      } else {
        navigation.replace('ExpertList');
      }
    } catch (error) {
      Alert.alert('Registration Failed', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.scroll}>
        <Surface style={styles.surface}>
          <Title style={styles.title}>Join Us</Title>
          <Paragraph style={styles.subtitle}>Create an account to get started</Paragraph>

          <TextInput
            label="Full Name"
            value={name}
            onChangeText={setName}
            mode="outlined"
            style={styles.input}
          />

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

          <Text style={styles.label}>I am a:</Text>
          <RadioButton.Group onValueChange={value => setRole(value)} value={role}>
            <View style={styles.radioRow}>
              <View style={styles.radioItem}>
                <RadioButton value="user" />
                <Text>Consumer</Text>
              </View>
              <View style={styles.radioItem}>
                <RadioButton value="expert" />
                <Text>Expert (Host)</Text>
              </View>
            </View>
          </RadioButton.Group>

          <Button
            mode="contained"
            onPress={handleRegister}
            loading={loading}
            disabled={loading}
            style={styles.button}
          >
            Create Account
          </Button>

          <View style={styles.footer}>
            <Text>Already have an account? </Text>
            <TouchableOpacity onPress={() => navigation.navigate('Login')}>
              <Text style={styles.link}>Login</Text>
            </TouchableOpacity>
          </View>
        </Surface>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f7fb'
  },
  scroll: {
    flexGrow: 1,
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
  label: {
    fontSize: 16,
    fontWeight: 'bold',
    marginVertical: 10,
    color: '#333'
  },
  radioRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 20
  },
  radioItem: {
    flexDirection: 'row',
    alignItems: 'center'
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

export default RegisterScreen;
