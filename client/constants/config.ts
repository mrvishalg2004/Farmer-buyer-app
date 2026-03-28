import Constants from 'expo-constants';

const localhost = Constants.expoConfig?.hostUri?.split(':')[0] || 'localhost';
const LOCAL_SERVER = `http://${localhost}:5003`;

// export const API_URL = 'https://farmer-buyer-app.onrender.com';
export const API_URL = LOCAL_SERVER;
