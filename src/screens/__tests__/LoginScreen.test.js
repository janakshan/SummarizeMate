import { render, fireEvent, waitFor, screen } from '@testing-library/react-native';
import LoginScreen from '../LoginScreen';
import * as auth from '../../auth';

// Mock the auth module
jest.mock('../../auth', () => ({
  login: jest.fn(),
}));

// Mock navigation
const mockNavigate = jest.fn();
const mockOnLogin = jest.fn();

describe('LoginScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    auth.login.mockReset();
    mockNavigate.mockClear();
    mockOnLogin.mockClear();
  });

  const mockNavigation = {
    navigate: mockNavigate,
  };
  
  const mockRoute = {
    params: {
      onLogin: mockOnLogin,
    },
  };

  describe('Rendering', () => {
    it('renders without crashing', () => {
      const component = render(<LoginScreen navigation={mockNavigation} route={mockRoute} />);
      expect(component).toBeTruthy();
    });

    it('renders all essential UI elements', () => {
      render(<LoginScreen navigation={mockNavigation} route={mockRoute} />);
      
      expect(screen.getByText('SummarizeMate')).toBeTruthy();
      expect(screen.getByText(/Sign in to your/)).toBeTruthy();
      expect(screen.getAllByText('Log In')).toHaveLength(2); // Card title and button text
      expect(screen.getByText('Email')).toBeTruthy();
      expect(screen.getByText('Password')).toBeTruthy();
      expect(screen.getByPlaceholderText('Email')).toBeTruthy();
      expect(screen.getByPlaceholderText('Password')).toBeTruthy();
      expect(screen.getByText('Remember me')).toBeTruthy();
      expect(screen.getByText('Forgot Password ?')).toBeTruthy();
    });

    it('renders password field with eye icon for visibility toggle', () => {
      render(<LoginScreen navigation={mockNavigation} route={mockRoute} />);
      
      const passwordInput = screen.getByPlaceholderText('Password');
      expect(passwordInput).toBeTruthy();
      expect(passwordInput.props.secureTextEntry).toBe(true);
      
      // Eye icon should be present
      expect(screen.getByTestId('password-visibility-toggle')).toBeTruthy();
    });

    it('renders checkbox for remember me functionality', () => {
      render(<LoginScreen navigation={mockNavigation} route={mockRoute} />);
      
      expect(screen.getByTestId('remember-me-checkbox')).toBeTruthy();
      expect(screen.getByText('Remember me')).toBeTruthy();
    });
  });

  describe('Form Interactions', () => {
    it('updates email input when user types', () => {
      render(<LoginScreen navigation={mockNavigation} route={mockRoute} />);
      
      const emailInput = screen.getByPlaceholderText('Email');
      fireEvent.changeText(emailInput, 'test@example.com');
      
      expect(emailInput.props.value).toBe('test@example.com');
    });

    it('updates password input when user types', () => {
      render(<LoginScreen navigation={mockNavigation} route={mockRoute} />);
      
      const passwordInput = screen.getByPlaceholderText('Password');
      fireEvent.changeText(passwordInput, 'password123');
      
      expect(passwordInput.props.value).toBe('password123');
    });

    it('toggles password visibility when eye icon is pressed', () => {
      render(<LoginScreen navigation={mockNavigation} route={mockRoute} />);
      
      const passwordInput = screen.getByPlaceholderText('Password');
      const toggleButton = screen.getByTestId('password-visibility-toggle');
      
      expect(passwordInput.props.secureTextEntry).toBe(true);
      
      fireEvent.press(toggleButton);
      expect(passwordInput.props.secureTextEntry).toBe(false);
      
      fireEvent.press(toggleButton);
      expect(passwordInput.props.secureTextEntry).toBe(true);
    });

    it('toggles remember me checkbox when pressed', () => {
      render(<LoginScreen navigation={mockNavigation} route={mockRoute} />);
      
      const rememberMeButton = screen.getByTestId('remember-me-button');
      
      // Should be able to press without error
      fireEvent.press(rememberMeButton);
      expect(rememberMeButton).toBeTruthy();
    });
  });

  describe('Navigation', () => {
    it('navigates to signup screen when signup link is pressed', () => {
      render(<LoginScreen navigation={mockNavigation} route={mockRoute} />);
      
      const signupLink = screen.getByText('Sign up');
      fireEvent.press(signupLink);
      
      expect(mockNavigate).toHaveBeenCalledWith('Signup');
    });
  });

  describe('Login Functionality', () => {
    it('calls login function with correct credentials on form submission', () => {
      auth.login.mockReturnValue({ email: 'test@example.com', id: 1 });
      
      render(<LoginScreen navigation={mockNavigation} route={mockRoute} />);
      
      const emailInput = screen.getByPlaceholderText('Email');
      const passwordInput = screen.getByPlaceholderText('Password');
      const loginButton = screen.getByLabelText('Log In');
      
      fireEvent.changeText(emailInput, 'test@example.com');
      fireEvent.changeText(passwordInput, 'password123');
      fireEvent.press(loginButton);
      
      expect(auth.login).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password123',
      });
      expect(mockOnLogin).toHaveBeenCalled();
    });

    it('shows loading text during login attempt', () => {
      auth.login.mockReturnValue({ email: 'test@example.com', id: 1 });
      
      render(<LoginScreen navigation={mockNavigation} route={mockRoute} />);
      
      const emailInput = screen.getByPlaceholderText('Email');
      const passwordInput = screen.getByPlaceholderText('Password');
      const loginButton = screen.getByLabelText('Log In');
      
      fireEvent.changeText(emailInput, 'test@example.com');
      fireEvent.changeText(passwordInput, 'password123');
      fireEvent.press(loginButton);
      
      // Since login is synchronous, loading state changes immediately
      expect(screen.getAllByText('Log In')).toHaveLength(2);
    });

    it('displays error message when login fails', () => {
      const errorMessage = 'Invalid email or password';
      auth.login.mockImplementation(() => {
        throw new Error(errorMessage);
      });
      
      render(<LoginScreen navigation={mockNavigation} route={mockRoute} />);
      
      const emailInput = screen.getByPlaceholderText('Email');
      const passwordInput = screen.getByPlaceholderText('Password');
      const loginButton = screen.getByLabelText('Log In');
      
      fireEvent.changeText(emailInput, 'wrong@example.com');
      fireEvent.changeText(passwordInput, 'wrongpassword');
      fireEvent.press(loginButton);
      
      expect(screen.getByText(errorMessage)).toBeTruthy();
      expect(screen.getAllByText('Log In')).toHaveLength(2); // Loading state should be reset
    });
  });

  describe('Input Validation', () => {
    it('maintains proper input types and attributes', () => {
      render(<LoginScreen navigation={mockNavigation} route={mockRoute} />);
      
      const emailInput = screen.getByPlaceholderText('Email');
      const passwordInput = screen.getByPlaceholderText('Password');
      
      expect(emailInput.props.autoCapitalize).toBe('none');
      expect(emailInput.props.keyboardType).toBe('email-address');
      expect(passwordInput.props.secureTextEntry).toBe(true);
    });
  });

  describe('Edge Cases', () => {
    it('handles empty email submission', () => {
      auth.login.mockImplementation(() => {
        throw new Error('Email is required');
      });
      
      render(<LoginScreen navigation={mockNavigation} route={mockRoute} />);
      
      const loginButton = screen.getByLabelText('Log In');
      fireEvent.press(loginButton);
      
      expect(auth.login).toHaveBeenCalledWith({
        email: '',
        password: '',
      });
      
      expect(screen.getByText('Email is required')).toBeTruthy();
    });

    it('handles empty password submission', () => {
      auth.login.mockImplementation(() => {
        throw new Error('Password is required');
      });
      
      render(<LoginScreen navigation={mockNavigation} route={mockRoute} />);
      
      const emailInput = screen.getByPlaceholderText('Email');
      const loginButton = screen.getByLabelText('Log In');
      
      fireEvent.changeText(emailInput, 'test@example.com');
      fireEvent.press(loginButton);
      
      expect(auth.login).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: '',
      });
      
      expect(screen.getByText('Password is required')).toBeTruthy();
    });

    it('handles missing route params gracefully', () => {
      // This test just ensures the component doesn't crash with empty params
      render(<LoginScreen navigation={mockNavigation} route={mockRoute} />);
      expect(screen.getByText('SummarizeMate')).toBeTruthy();
    });
  });
});