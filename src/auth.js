
import AsyncStorage from '@react-native-async-storage/async-storage';

// Simple mock auth module

let mockUsers = [
  { id: 1, email: "test@example.com", password: "password123", name: "Test User" },
];

let currentUser = null;

const REMEMBER_ME_KEY = '@SummarizeMate:rememberMe';
const STORED_CREDENTIALS_KEY = '@SummarizeMate:credentials';

export function signup({ email, password, name }) {
  // Validate input fields
  if (!email || !email.trim()) {
    throw new Error("Email is required");
  }
  
  if (!password || !password.trim()) {
    throw new Error("Password is required");
  }
  
  if (!name || !name.trim()) {
    throw new Error("Name is required");
  }
  
  // Trim whitespace
  const trimmedEmail = email.trim();
  const trimmedPassword = password.trim();
  const trimmedName = name.trim();
  
  if (mockUsers.find((u) => u.email === trimmedEmail)) {
    throw new Error("Email already exists");
  }
  
  const user = { id: Date.now(), email: trimmedEmail, password: trimmedPassword, name: trimmedName };
  mockUsers.push(user);
  currentUser = user;
  return user;
}

export async function login({ email, password, rememberMe = false }) {
  // Validate input fields
  if (!email || !email.trim()) {
    throw new Error("Email is required");
  }
  
  if (!password || !password.trim()) {
    throw new Error("Password is required");
  }
  
  // Trim whitespace for comparison
  const trimmedEmail = email.trim();
  const trimmedPassword = password.trim();
  
  const user = mockUsers.find((u) => u.email === trimmedEmail && u.password === trimmedPassword);
  if (!user) {
    throw new Error("Invalid email or password");
  }
  
  currentUser = user;
  
  // Handle remember me functionality
  try {
    if (rememberMe) {
      await AsyncStorage.setItem(REMEMBER_ME_KEY, 'true');
      await AsyncStorage.setItem(STORED_CREDENTIALS_KEY, JSON.stringify({
        email: trimmedEmail,
        password: trimmedPassword
      }));
    } else {
      await AsyncStorage.removeItem(REMEMBER_ME_KEY);
      await AsyncStorage.removeItem(STORED_CREDENTIALS_KEY);
    }
  } catch (error) {
    console.error('Error saving remember me preferences:', error);
  }
  
  return user;
}

export async function logout() {
  currentUser = null;
  // Clear remember me data on logout
  try {
    await AsyncStorage.removeItem(REMEMBER_ME_KEY);
    await AsyncStorage.removeItem(STORED_CREDENTIALS_KEY);
  } catch (error) {
    console.error('Error clearing remember me data:', error);
  }
}

export function getCurrentUser() {
  return currentUser;
}

// Check if user should be remembered and auto-login
export async function checkRememberMe() {
  try {
    const isRemembered = await AsyncStorage.getItem(REMEMBER_ME_KEY);
    if (isRemembered === 'true') {
      const storedCredentials = await AsyncStorage.getItem(STORED_CREDENTIALS_KEY);
      if (storedCredentials) {
        const credentials = JSON.parse(storedCredentials);
        // Auto-login with stored credentials
        const user = await login({ 
          email: credentials.email, 
          password: credentials.password, 
          rememberMe: true 
        });
        return user;
      }
    }
    return null;
  } catch (error) {
    console.error('Error checking remember me:', error);
    return null;
  }
}

// Get stored credentials for pre-filling login form
export async function getStoredCredentials() {
  try {
    const isRemembered = await AsyncStorage.getItem(REMEMBER_ME_KEY);
    if (isRemembered === 'true') {
      const storedCredentials = await AsyncStorage.getItem(STORED_CREDENTIALS_KEY);
      if (storedCredentials) {
        const credentials = JSON.parse(storedCredentials);
        return {
          email: credentials.email,
          password: credentials.password,
          rememberMe: true
        };
      }
    }
    return null;
  } catch (error) {
    console.error('Error getting stored credentials:', error);
    return null;
  }
}

export function getMockUsers() {
  return mockUsers;
} 