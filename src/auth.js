
// Simple mock auth module

let mockUsers = [
  { id: 1, email: "test@example.com", password: "password123", name: "Test User" },
];

let currentUser = null;

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

export function login({ email, password }) {
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
  return user;
}

export function logout() {
  currentUser = null;
}

export function getCurrentUser() {
  return currentUser;
}

export function getMockUsers() {
  return mockUsers;
} 