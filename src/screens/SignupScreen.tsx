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
import { supabase } from "../lib/supabase";

const clickSound = require("../../assets/sounds/buttonClick.mp3");
const logo = require("../../assets/images/icon.png");

export default function SignupScreen({ navigation }: any) {
  const [username, setUsername] = useState("");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const [modalVisible, setModalVisible] = useState(false);
  const [modalMessage, setModalMessage] = useState("");
  const [modalType, setModalType] = useState<"success" | "error" | "info">(
    "info",
  );

  const player = useAudioPlayer(clickSound);
  player.volume = 1.0;

  const playClick = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    player.play();
  };

  const handleSignup = async () => {
    playClick();
    if (!username || !name || !password) {
      setModalMessage("Please fill all fields");
      setModalType("error");
      setModalVisible(true);
      return;
    }

    try {
      setLoading(true);

      const normalizedUsername = username.trim().toLowerCase();

      // check if username already exists
      const { data: existingUser } = await supabase
        .from("users")
        .select("username")
        .eq("username", normalizedUsername)
        .maybeSingle();

      if (existingUser) {
        setModalMessage("Username already taken");
        setModalType("error");
        setModalVisible(true);
        return;
      }

      // insert directly to public.users
      const { error } = await supabase.from("users").insert([
        {
          username: normalizedUsername,
          name,
          password,
        },
      ]);

      if (error) throw error;

      setModalMessage("Signup successful! Please log in.");
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
          <Text style={styles.sectionTitle}>Create Account</Text>

          <TextInput
            placeholder="Username"
            placeholderTextColor="#6B7280"
            value={username}
            onChangeText={setUsername}
            autoCapitalize="none"
            style={styles.input}
          />

          <TextInput
            placeholder="Full Name"
            placeholderTextColor="#6B7280"
            value={name}
            onChangeText={setName}
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
            style={[styles.signupButton, loading && styles.disabledButton]}
            onPress={handleSignup}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text style={styles.signupButtonText}>Sign Up</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => {
              playClick();
              navigation.navigate("Login");
            }}
            style={styles.loginLink}
          >
            <Text style={styles.loginText}>
              Already have an account?{" "}
              <Text style={styles.loginHighlight}>Log In</Text>
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
            navigation.navigate("Login");
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
    marginBottom: 32,
  },
  logo: {
    width: 100,
    height: 100,
    marginBottom: 12,
  },
  title: {
    fontSize: 28,
    fontWeight: "800",
    color: "#F9FAFB",
    textAlign: "center",
    letterSpacing: 1,
  },
  subtitle: {
    fontSize: 14,
    color: "#818CF8",
    textAlign: "center",
    fontWeight: "600",
    marginTop: 2,
    fontStyle: "italic",
  },
  formContainer: {
    width: "100%",
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#F9FAFB",
    marginBottom: 20,
    textAlign: "center",
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
  signupButton: {
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
  signupButtonText: {
    color: "white",
    fontWeight: "bold",
    fontSize: 18,
    letterSpacing: 1,
  },
  loginLink: {
    marginTop: 24,
    alignItems: "center",
  },
  loginText: {
    color: "#9CA3AF",
    fontSize: 15,
  },
  loginHighlight: {
    color: "#818CF8",
    fontWeight: "bold",
  },
});
