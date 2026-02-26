import axios from 'axios';

const BASE_URL = 'https://real-time-expert-session-booking.vercel.app/api';

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

export default api;
