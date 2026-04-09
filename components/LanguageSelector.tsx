import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { useTranslation } from "react-i18next";

interface LanguageSelectorProps {
  floating?: boolean;
}

export default function LanguageSelector({ floating }: LanguageSelectorProps) {
  const { t, i18n } = useTranslation();
  const currentLanguage = i18n.language;

  const changeLanguage = (lng: string) => {
    i18n.changeLanguage(lng);
  };

  return (
    <View style={[styles.container, floating && styles.floatingContainer]}>
      {!floating && <Text style={styles.sectionTitle}>{t("profile.language")}</Text>}
      <View style={[styles.selector, floating && styles.floatingSelector]}>
        <TouchableOpacity
          style={[
            styles.languageBtn,
            currentLanguage.startsWith("en") && styles.activeLanguageBtn,
            floating && styles.floatingBtn,
          ]}
          onPress={() => changeLanguage("en")}
        >
          <Text
            style={[
              styles.languageBtnText,
              currentLanguage.startsWith("en") && styles.activeLanguageBtnText,
              floating && styles.floatingBtnText,
            ]}
          >
            🇺🇸 {floating ? "" : t("profile.english")}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.languageBtn,
            currentLanguage.startsWith("es") && styles.activeLanguageBtn,
            floating && styles.floatingBtn,
          ]}
          onPress={() => changeLanguage("es")}
        >
          <Text
            style={[
              styles.languageBtnText,
              currentLanguage.startsWith("es") && styles.activeLanguageBtnText,
              floating && styles.floatingBtnText,
            ]}
          >
            🇪🇸 {floating ? "" : t("profile.spanish")}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 20,
    marginBottom: 30,
  },
  floatingContainer: {
    position: "absolute",
    top: 50,
    right: 20,
    paddingHorizontal: 0,
    marginBottom: 0,
    zIndex: 100,
  },
  sectionTitle: {
    color: "#666",
    fontSize: 12,
    fontWeight: "bold",
    textTransform: "uppercase",
    marginBottom: 15,
    letterSpacing: 1,
  },
  selector: {
    flexDirection: "row",
    backgroundColor: "#111",
    borderRadius: 12,
    padding: 5,
    borderWidth: 1,
    borderColor: "#222",
  },
  floatingSelector: {
    backgroundColor: "rgba(17, 17, 17, 0.8)",
    borderRadius: 20,
    padding: 3,
    borderColor: "rgba(0, 255, 204, 0.3)",
  },
  languageBtn: {
    flex: 1,
    paddingVertical: 10,
    alignItems: "center",
    borderRadius: 10,
  },
  floatingBtn: {
    flex: 0,
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 15,
  },
  activeLanguageBtn: {
    backgroundColor: "#00FFCC",
  },
  languageBtnText: {
    color: "#AAA",
    fontSize: 14,
    fontWeight: "bold",
  },
  floatingBtnText: {
    fontSize: 16,
  },
  activeLanguageBtnText: {
    color: "#000",
  },
});
