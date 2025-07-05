import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import {
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from "react-native";
import { login } from "../auth";

const LOGO_URL = "https://placehold.co/40x40/6366F1/fff?text=L"; // Placeholder logo

const LoginScreen = ({ navigation, route }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  const handleLogin = () => {
    setError("");
    setLoading(true);
    try {
      login({ email, password });
      setLoading(false);
      if (route?.params?.onLogin) route.params.onLogin();
    } catch (e) {
      setLoading(false);
      setError(e.message);
    }
  };


  return (
    <View style={styles.bgWrap}>
      <View style={styles.blueBg} />
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.headerWrap}>
          <Text style={styles.logoipsum}>SummarizeMate</Text>
          <Text style={styles.title}>Sign in to your Account</Text>
        </View>
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Log In</Text>
          {error ? <Text style={styles.error}>{error}</Text> : null}
          <Text style={styles.label}>Email</Text>
          <TextInput
            style={styles.input}
            placeholder="Email"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
            placeholderTextColor="#BDBDBD"
          />
          <Text style={styles.label}>Password</Text>
          <View style={styles.passwordContainer}>
            <TextInput
              style={styles.passwordInput}
              placeholder="Password"
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
              placeholderTextColor="#BDBDBD"
            />
            <Pressable
              style={styles.eyeBtn}
              onPress={() => setShowPassword((v) => !v)}
              testID="password-visibility-toggle"
            >
              <Ionicons
                name={showPassword ? "eye-off-outline" : "eye-outline"}
                size={22}
                color="#2563EB"
              />
            </Pressable>
          </View>
          <View style={styles.rowBetween}>
            <TouchableOpacity
              style={styles.rememberMe}
              onPress={() => setRememberMe((v) => !v)}
              testID="remember-me-button"
            >
              <View style={[styles.checkbox, rememberMe && styles.checkboxChecked]} testID="remember-me-checkbox">
                {rememberMe && <Ionicons name="checkmark" size={14} color="#fff" />}
              </View>
              <Text style={styles.rememberText}>Remember me</Text>
            </TouchableOpacity>
            <TouchableOpacity>
              <Text style={styles.forgot}>Forgot Password ?</Text>
            </TouchableOpacity>
          </View>
          <TouchableOpacity
            style={styles.loginBtn}
            onPress={handleLogin}
            disabled={loading}
            accessibilityRole="button"
            accessibilityLabel="Log In"
          >
            <Text style={styles.loginBtnText}>{loading ? "Logging in..." : "Log In"}</Text>
          </TouchableOpacity>
          <View style={styles.spacer} />
          <TouchableOpacity onPress={() => navigation.navigate("Signup")}>
            <Text style={styles.signupLink}>Don't have an account? <Text style={{ color: '#2563EB', fontWeight: 'bold' }}>Sign up</Text></Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </View>
  );
};

const styles = StyleSheet.create({
  bgWrap: {
    flex: 1,
    backgroundColor: "#F4F7FF",
  },
  blueBg: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 260,
    backgroundColor: '#6366F1',
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
    zIndex: 0,
  },
  safeArea: {
    flex: 1,
    alignItems: "center",
    backgroundColor: "transparent",
    zIndex: 1,
  },
  headerWrap: {
    width: '100%',
    alignItems: 'center',
    marginTop: 18,
    marginBottom: 12,
  },
  logoipsum: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 32,
    marginBottom: 10,
    marginTop: 10,
  },
  title: {
    color: "#fff",
    fontWeight: "normal",
    fontSize: 18,
    textAlign: "center",
    marginBottom: 0,
    lineHeight: 22,
  },
  card: {
    flex: 1,
    width: '100%',
    alignSelf: "center",
    backgroundColor: "#fff",
    borderRadius: 32,
    marginTop: 8,
    paddingHorizontal: 24,
    paddingVertical: 28,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.10,
    shadowRadius: 24,
    elevation: 12,
  },
  cardTitle: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#22223B",
    marginBottom: 18,
    textAlign: "center",
  },
  label: {
    fontSize: 15,
    color: "#22223B",
    marginBottom: 6,
    marginTop: 8,
    fontWeight: "600",
  },
  input: {
    backgroundColor: "#F8FAFF",
    borderWidth: 2,
    borderColor: "#6366F1",
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: "#111827",
    marginBottom: 14,
    width: '100%',
  },
  passwordContainer: {
    position: 'relative',
    width: '100%',
    marginBottom: 14,
  },
  passwordInput: {
    backgroundColor: "#F8FAFF",
    borderWidth: 2,
    borderColor: "#6366F1",
    borderRadius: 12,
    padding: 16,
    paddingRight: 50,
    fontSize: 16,
    color: "#111827",
    width: '100%',
  },
  eyeBtn: {
    position: 'absolute',
    right: 12,
    top: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    width: 40,
  },
  rowBetween: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 22,
  },
  rememberMe: {
    flexDirection: "row",
    alignItems: "center",
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 5,
    borderWidth: 2,
    borderColor: "#6366F1",
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 8,
  },
  checkboxChecked: {
    backgroundColor: "#6366F1",
    borderColor: "#6366F1",
  },
  rememberText: {
    fontSize: 15,
    color: "#22223B",
  },
  forgot: {
    color: "#6366F1",
    fontSize: 15,
    fontWeight: "600",
    textAlign: 'right',
  },
  loginBtn: {
    backgroundColor: "#6366F1",
    paddingVertical: 18,
    borderRadius: 14,
    alignItems: "center",
    marginBottom: 18,
    marginTop: 2,
    shadowColor: "#6366F1",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 2,
  },
  loginBtnText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 18,
  },
  spacer: {
    flex: 1,
  },
  signupLink: {
    color: "#6366F1",
    fontSize: 16,
    textAlign: "center",
    marginBottom: 12,
    fontWeight: "500",
  },
  error: {
    color: "#EF4444",
    marginBottom: 10,
    textAlign: "center",
    fontSize: 15,
  },
});

export default LoginScreen; 