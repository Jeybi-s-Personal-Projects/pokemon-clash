import { useAudioPlayer } from "expo-audio";
import * as Haptics from "expo-haptics";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import StatusModal from "../components/statusModal";
import { useAuth } from "../context/AuthContext";
import { supabase } from "../lib/supabase";

const clickSound = require("../../assets/sounds/buttonClick.mp3");
const logo = require("../../assets/images/icon.png");

export default function LoginScreen({ navigation }: any) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const [modalVisible, setModalVisible] = useState(false);
  const [modalMessage, setModalMessage] = useState("");
  const [modalType, setModalType] = useState<"success" | "error" | "info">(
    "info",
  );

  const { login } = useAuth();

  const player = useAudioPlayer(clickSound);
  player.volume = 1.0;

  const playClick = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    player.play();
  };

  const handleLogin = async () => {
    playClick();
    if (!username || !password) {
      setModalMessage("Please enter username and password");
      setModalType("error");
      setModalVisible(true);
      return;
    }

    try {
      setLoading(true);

      const normalizedUsername = username.trim().toLowerCase();

      const { data, error } = await supabase
        .from("users")
        .select("*")
        .eq("username", normalizedUsername)
        .eq("password", password)
        .maybeSingle();

      if (error || !data) {
        setModalMessage("Invalid username or password");
        setModalType("error");
        setModalVisible(true);
        return;
      }

      login({
        id: data.id,
        username: data.username,
        name: data.name,
      });

      setModalMessage("Login successful!");
      setModalType("success");
      setModalVisible(true);
    } catch (error: any) {
      setModalMessage(error.message);
      setModalType("error");
      setModalVisible(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={styles.container}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.logoContainer}>
          <Image source={logo} style={styles.logo} resizeMode="contain" />
          <Text style={styles.title}>Pokemon Clash</Text>
          <Text style={styles.subtitle}>Contest of Champions</Text>
        </View>

        <View style={styles.formContainer}>
          <TextInput
            placeholder="Username"
            placeholderTextColor="#6B7280"
            value={username}
            onChangeText={setUsername}
            autoCapitalize="none"
            style={styles.input}
          />

          <TextInput
            placeholder="Password"
            placeholderTextColor="#6B7280"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            style={styles.input}
          />

          <TouchableOpacity
            style={[styles.loginButton, loading && styles.disabledButton]}
            onPress={handleLogin}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text style={styles.loginButtonText}>Log In</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => {
              playClick();
              navigation.navigate("Signup");
            }}
            style={styles.signupLink}
          >
            <Text style={styles.signupText}>
              Don't have an account?{" "}
              <Text style={styles.signupHighlight}>Sign Up</Text>
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      <StatusModal
        visible={modalVisible}
        message={modalMessage}
        type={modalType}
        onClose={() => {
          setModalVisible(false);

          if (modalType === "success") {
            navigation.replace("Dashboard");
          }
        }}
      />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#030712",
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: "center",
    padding: 24,
  },
  logoContainer: {
    alignItems: "center",
    marginBottom: 48,
  },
  logo: {
    width: 120,
    height: 120,
    marginBottom: 16,
  },
  title: {
    fontSize: 32,
    fontWeight: "800",
    color: "#F9FAFB",
    textAlign: "center",
    letterSpacing: 1,
  },
  subtitle: {
    fontSize: 16,
    color: "#818CF8",
    textAlign: "center",
    fontWeight: "600",
    marginTop: 4,
    fontStyle: "italic",
  },
  formContainer: {
    width: "100%",
  },
  input: {
    backgroundColor: "#111827",
    borderWidth: 1,
    borderColor: "#1F2937",
    padding: 16,
    borderRadius: 16,
    marginBottom: 16,
    color: "white",
    fontSize: 16,
  },
  loginButton: {
    backgroundColor: "#0A0D2E",
    paddingVertical: 18,
    borderRadius: 16,
    alignItems: "center",
    marginTop: 8,
    borderWidth: 1,
    borderColor: "#1F2937",
  },
  disabledButton: {
    opacity: 0.7,
  },
  loginButtonText: {
    color: "white",
    fontWeight: "bold",
    fontSize: 18,
    letterSpacing: 1,
  },
  signupLink: {
    marginTop: 24,
    alignItems: "center",
  },
  signupText: {
    color: "#9CA3AF",
    fontSize: 15,
  },
  signupHighlight: {
    color: "#818CF8",
    fontWeight: "bold",
  },
});
