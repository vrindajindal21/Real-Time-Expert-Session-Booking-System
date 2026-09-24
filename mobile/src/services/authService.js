import api from '../config/api';
import AsyncStorage from '@react-native-async-storage/async-storage';

const TOKEN_KEY = 'auth_token';
const USER_KEY = 'user_data';

const authService = {
  login: async (email, password) => {
    try {
      const response = await api.post('/auth/login', { email, password });
      if (response.data.token) {
        await AsyncStorage.setItem(TOKEN_KEY, response.data.token);
        await AsyncStorage.setItem(USER_KEY, JSON.stringify(response.data));
      }
      return response.data;
    } catch (error) {
      throw error.response?.data?.message || 'Login failed';
    }
  },

  register: async (userData) => {
    try {
      const response = await api.post('/auth/register', userData);
      if (response.data.token) {
        await AsyncStorage.setItem(TOKEN_KEY, response.data.token);
        await AsyncStorage.setItem(USER_KEY, JSON.stringify(response.data));
      }
      return response.data;
    } catch (error) {
      throw error.response?.data?.message || 'Registration failed';
    }
  },

  logout: async () => {
    await AsyncStorage.removeItem(TOKEN_KEY);
    await AsyncStorage.removeItem(USER_KEY);
  },

  getCurrentUser: async () => {
    const user = await AsyncStorage.getItem(USER_KEY);
    return user ? JSON.parse(user) : null;
  },

  getToken: async () => {
    return await AsyncStorage.getItem(TOKEN_KEY);
  }
};

export default authService;
