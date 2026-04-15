import React, { useState, useEffect } from "react";
import {
  Modal,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
  Keyboard,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Colors } from "@/constants/Colors";

interface ObscuraPromptProps {
  visible: boolean;
  title: string;
  message?: string;
  placeholder?: string;
  defaultValue?: string;
  onCancel?: () => void;
  onConfirm: (text?: string) => void;
  confirmText?: string;
  cancelText?: string;
  type?: "prompt" | "alert" | "confirm";
}

export default function ObscuraPrompt({
  visible,
  title,
  message,
  placeholder,
  defaultValue = "",
  onCancel,
  onConfirm,
  confirmText = "OK",
  cancelText = "Cancel",
  type = "prompt",
}: ObscuraPromptProps) {
  const [text, setText] = useState(defaultValue);

  useEffect(() => {
    if (visible) {
      setText(defaultValue);
    }
  }, [visible, defaultValue]);

  const handleConfirm = () => {
    onConfirm(type === "prompt" ? text : undefined);
    setText("");
  };

  const handleCancel = () => {
    onCancel?.();
    setText("");
  };

  const showCancel = type === "prompt" || type === "confirm";
  const showInput = type === "prompt";

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={handleCancel}
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <View style={styles.overlay}>
          <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : "height"}
            style={styles.container}
          >
            <View style={styles.content}>
              <View style={styles.header}>
                <Text style={styles.title}>{title}</Text>
                {message && <Text style={styles.message}>{message}</Text>}
              </View>

              {showInput && (
                <View style={styles.inputContainer}>
                  <TextInput
                    style={styles.input}
                    value={text}
                    onChangeText={setText}
                    placeholder={placeholder}
                    placeholderTextColor="rgba(255, 255, 255, 0.4)"
                    autoFocus
                    selectionColor="#00FFCC"
                  />
                </View>
              )}

              <View style={styles.footer}>
                {showCancel && (
                  <TouchableOpacity
                    style={[styles.button, styles.cancelButton]}
                    onPress={handleCancel}
                  >
                    <Text style={styles.cancelButtonText}>{cancelText}</Text>
                  </TouchableOpacity>
                )}
                <TouchableOpacity
                  style={[styles.button, styles.confirmButton]}
                  onPress={handleConfirm}
                  disabled={showInput && !text.trim()}
                >
                  <Text style={styles.confirmButtonText}>{confirmText}</Text>
                </TouchableOpacity>
              </View>
            </View>
          </KeyboardAvoidingView>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.75)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  container: {
    width: "100%",
    maxWidth: 400,
  },
  content: {
    backgroundColor: "#111",
    borderRadius: 20,
    padding: 24,
    borderWidth: 1,
    borderColor: "rgba(0, 255, 204, 0.3)",
    shadowColor: "#00FFCC",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  header: {
    marginBottom: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#FFF",
    marginBottom: 8,
    textAlign: "center",
  },
  message: {
    fontSize: 14,
    color: "#AAA",
    textAlign: "center",
    lineHeight: 20,
  },
  inputContainer: {
    marginBottom: 24,
  },
  input: {
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    color: "#FFF",
    fontSize: 16,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
  },
  footer: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
  },
  button: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  cancelButton: {
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
  },
  confirmButton: {
    backgroundColor: "#00FFCC",
  },
  cancelButtonText: {
    color: "#FFF",
    fontSize: 15,
    fontWeight: "600",
  },
  confirmButtonText: {
    color: "#000",
    fontSize: 15,
    fontWeight: "bold",
  },
});
