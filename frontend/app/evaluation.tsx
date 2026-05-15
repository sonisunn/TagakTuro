import { Stack, useRouter, useLocalSearchParams } from "expo-router";
import React, { useState, useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  TextInput,
  Modal,
  Platform,
  KeyboardAvoidingView,
} from "react-native";
import { BlurView } from "expo-blur";
import {
  useFonts,
  Poppins_400Regular,
  Poppins_600SemiBold,
  Poppins_700Bold,
} from "@expo-google-fonts/poppins";
import { submitEvaluation, checkEvaluated } from "../src/api/evaluation";
import { submitFeedback } from "../src/api/feedback";

// ── Student evaluates tutor ──────────────────────────────────────────────────
const STUDENT_MCQ_OPTIONS = [
  { value: "A", label: "Outstanding" },
  { value: "B", label: "Satisfactory" },
  { value: "C", label: "Needs Improvement" },
  { value: "D", label: "Unsatisfactory" },
];

const STUDENT_MCQ_QUESTIONS = [
  "How consistent is the student's effort and motivation to learn?",
  "How effectively does the student manage time and focus during the session?",
];

const STUDENT_TEXT_QUESTION = "How would you describe your tutor?";

// ── Tutor evaluates student ──────────────────────────────────────────────────
const TUTOR_TEXT_QUESTION = "How would you describe your student?";
const TUTOR_MCQ_OPTIONS = [
  { value: "A", label: "Outstanding" },
  { value: "B", label: "Satisfactory" },
  { value: "C", label: "Needs Improvement" },
  { value: "D", label: "Unsatisfactory" },
];

const TUTOR_MCQ_QUESTIONS = [
  "How would you rate the student's participation and engagement?",
  "How would you rate the student's preparedness for the session?",
  "How would you rate the student's overall attitude and cooperation?",
];

export default function EvaluationScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();

  const bookingId = Number(params.bookingId);
  const evaluationType = params.evaluationType as string;
  const evaluatorId = Number(params.evaluatorId);
  const evaluateeId = Number(params.evaluateeId);
  const evaluateeName = params.evaluateeName as string;
  const subject = params.subject as string;
  const sessionDate = params.sessionDate as string; // e.g., "September 5, 2026"

  const isStudent = evaluationType === "STUDENT_EVALUATES_TUTOR";
  const mcqOptions = isStudent ? STUDENT_MCQ_OPTIONS : TUTOR_MCQ_OPTIONS;
  const mcqQuestions = isStudent ? STUDENT_MCQ_QUESTIONS : TUTOR_MCQ_QUESTIONS;

  const [loading, setLoading] = useState(true);
  const [alreadyEvaluated, setAlreadyEvaluated] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [successData, setSuccessData] = useState<{
    tutorName?: string;
    sessionDate?: string;
    evaluatedDate?: string;
  } | null>(null);
  const [alertModal, setAlertModal] = useState<{
    visible: boolean;
    title: string;
    body: string;
    isSuccess: boolean;
  }>({ visible: false, title: "", body: "", isSuccess: false });

  // MCQ answers — indexed 0, 1 (and 2 for tutor's 3rd MCQ question)
  const [q1, setQ1] = useState<string | null>(null);
  const [q2, setQ2] = useState<string | null>(null);
  const [q3, setQ3] = useState<string | null>(null); // tutor only (3rd MCQ)
  const [openText, setOpenText] = useState(""); // student's text question
  const [starRating, setStarRating] = useState(0);

  const [fontsLoaded] = useFonts({
    Poppins: Poppins_400Regular,
    "Poppins-Bold": Poppins_700Bold,
    "Poppins-SemiBold": Poppins_600SemiBold,
  });

  useEffect(() => {
    const checkStatus = async () => {
      try {
        const evaluated = await checkEvaluated(bookingId, evaluationType);
        setAlreadyEvaluated(evaluated);
      } catch {
        // treat as not yet evaluated if check fails
      } finally {
        setLoading(false);
      }
    };
    if (bookingId && evaluationType) checkStatus();
  }, [bookingId, evaluationType]);

  const getMcqAnswer = (index: number) =>
    index === 0 ? q1 : index === 1 ? q2 : q3;

  const setMcqAnswer = (index: number, value: string) => {
    if (index === 0) setQ1(value);
    else if (index === 1) setQ2(value);
    else setQ3(value);
  };

  // Submit is enabled only when every visible question has an answer and a star rating is set
  const canSubmit = isStudent
    ? !!q1 && !!q2 && openText.trim().length > 0 && starRating > 0
    : !!q1 && !!q2 && !!q3 && openText.trim().length > 0 && starRating > 0;

  const handleSubmit = async () => {
    if (!canSubmit) return;

    setSubmitting(true);
    try {
      await submitEvaluation({
        bookingId,
        evaluatorId,
        evaluateeId,
        evaluationType,
        q1Answer: q1,
        q2Answer: q2,
        q3Answer: isStudent ? undefined : q3,
        openComment: openText.trim(),
        starRating,
      });

      // Mirror the star rating into the feedback system so it appears on feedback pages
      try {
        await submitFeedback(evaluatorId, {
          bookingId,
          revieweeId: evaluateeId,
          rating: starRating,
          comments: openText.trim(),
        });
      } catch { /* silently ignore if feedback entry already exists */ }

      // Show the success UI immediately (before any awaits to avoid stale renders)
      const today = new Date();
      const evaluatedDate = today.toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });

      if (isStudent) {
        setSuccessData({
          tutorName: evaluateeName,
          sessionDate: sessionDate || "N/A",
          evaluatedDate,
        });
      } else {
        setSuccessData({});
      }

      // Persist evaluated booking so the homepage can mark it as "Evaluated"
      try {
        const raw = await AsyncStorage.getItem("evaluatedBookings");
        const ids: number[] = raw ? JSON.parse(raw) : [];
        if (!ids.includes(bookingId)) {
          ids.push(bookingId);
          await AsyncStorage.setItem("evaluatedBookings", JSON.stringify(ids));
        }
      } catch {}
    } catch (e: any) {
      const msg =
        e?.response?.data?.error ||
        "Failed to submit evaluation. Please try again.";
      setAlertModal({
        visible: true,
        title: "Error",
        body: msg,
        isSuccess: false,
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleSuccessModalClose = () => {
    setSuccessData(null);
    router.back();
  };

  if (!fontsLoaded || loading) return null;

  // ── Main form ──────────────────────────────────────────────────────────────
  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <Stack.Screen options={{ headerShown: false }} />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* ── Page header ── */}
        <View style={styles.pageHeader}>
          <Text style={styles.pageTitle}>
            {isStudent ? "Tutor Evaluation" : "Student Evaluation"}
          </Text>
          <Text style={styles.pageSubtitle}>
            {isStudent
              ? `Give some feedback to your tutor · ${subject}`
              : `Evaluate ${evaluateeName}'s performance · ${subject}`}
          </Text>
        </View>

        {/* ── MCQ questions ── */}
        {mcqQuestions.map((question, index) => (
          <View key={index} style={styles.questionBlock}>
            <Text style={styles.questionText}>
              {index + 1}. {question}
            </Text>
            <View style={styles.optionsStack}>
              {mcqOptions.map((opt) => {
                const selected = getMcqAnswer(index) === opt.value;
                return (
                  <TouchableOpacity
                    key={opt.value}
                    style={[styles.optionRow, selected && styles.optionRowSelected]}
                    onPress={() => setMcqAnswer(index, opt.value)}
                    activeOpacity={0.75}
                  >
                    <Text
                      style={[
                        styles.optionText,
                        selected && styles.optionTextSelected,
                      ]}
                    >
                      {opt.value}. {opt.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        ))}

        {/* ── Star rating ── */}
        <View style={styles.questionBlock}>
          <Text style={styles.questionText}>
            {mcqQuestions.length + 1}. Overall Rating
          </Text>
          <View style={styles.starsRow}>
            {[1, 2, 3, 4, 5].map((star) => (
              <TouchableOpacity
                key={star}
                onPress={() => setStarRating(star)}
                activeOpacity={0.75}
                style={styles.starBtn}
              >
                <Text style={[styles.starIcon, star <= starRating && styles.starIconFilled]}>
                  ★
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* ── Open text question (both sides) ── */}
        <View style={styles.questionBlock}>
          <Text style={styles.questionText}>
            {mcqQuestions.length + 2}. {isStudent ? STUDENT_TEXT_QUESTION : TUTOR_TEXT_QUESTION}
          </Text>
          <TextInput
            style={styles.textInput}
            placeholder="Type something here...."
            placeholderTextColor="#B0C4DE"
            multiline
            numberOfLines={4}
            value={openText}
            onChangeText={setOpenText}
            maxLength={1000}
            textAlignVertical="top"
          />
        </View>

        <View style={styles.scrollPadding} />
      </ScrollView>

      {/* ── Sticky footer ── */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => router.back()}
          activeOpacity={0.75}
        >
          <Text style={styles.backBtnText}>Back</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.submitBtn, !canSubmit && styles.submitBtnDisabled]}
          onPress={handleSubmit}
          disabled={!canSubmit || submitting}
          activeOpacity={0.8}
        >
          <Text style={styles.submitBtnText}>
            {submitting ? "Submitting..." : "Submit"}
          </Text>
        </TouchableOpacity>
      </View>

      {/* ── Alert modal ── */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={alertModal.visible}
        onRequestClose={() => {
          const wasSuccess = alertModal.isSuccess;
          setAlertModal({ visible: false, title: "", body: "", isSuccess: false });
          if (wasSuccess) router.back();
        }}
      >
        <BlurView experimentalBlurMethod="dimezisBlurView" intensity={20} tint="light" style={styles.absolute}>
          <View style={styles.alertCard}>
            <Text style={styles.alertTitle}>{alertModal.title}</Text>
            <Text style={styles.alertBody}>{alertModal.body}</Text>
            <TouchableOpacity
              style={styles.alertButton}
              onPress={() => {
                const wasSuccess = alertModal.isSuccess;
                setAlertModal({ visible: false, title: "", body: "", isSuccess: false });
                if (wasSuccess) router.back();
              }}
            >
              <Text style={styles.alertButtonText}>OK</Text>
            </TouchableOpacity>
          </View>
        </BlurView>
      </Modal>

      {/* ── Success modal (student + tutor) ── */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={successData !== null}
        onRequestClose={handleSuccessModalClose}
      >
        <BlurView experimentalBlurMethod="dimezisBlurView" intensity={20} tint="light" style={styles.absolute}>
          <View style={styles.overlayCard}>
            <Text style={styles.overlayTitle}>
              {isStudent ? "Successfully evaluated your tutor!" : "Successfully evaluated your student!"}
            </Text>
            {isStudent ? (
              <>
                <Text style={styles.overlayDetail}>Tutor: {successData?.tutorName}</Text>
                <Text style={styles.overlayDetail}>Session Date: {successData?.sessionDate}</Text>
                <Text style={styles.overlayDetail}>Evaluated on {successData?.evaluatedDate}</Text>
              </>
            ) : (
              <Text style={styles.overlayDetail}>Click Return to go back to the homepage</Text>
            )}
            <TouchableOpacity style={styles.overlayReturnBtn} onPress={handleSuccessModalClose}>
              <Text style={styles.overlayReturnBtnText}>Return</Text>
            </TouchableOpacity>
          </View>
        </BlurView>
      </Modal>

      {/* ── Already evaluated modal ── */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={alreadyEvaluated && successData === null}
        onRequestClose={() => router.back()}
      >
        <BlurView experimentalBlurMethod="dimezisBlurView" intensity={20} tint="light" style={styles.absolute}>
          <View style={styles.overlayCard}>
            <Text style={styles.overlayTitle}>Already Evaluated</Text>
            <Text style={styles.overlayDetail}>
              You have already submitted an evaluation for this session.
            </Text>
            <TouchableOpacity style={styles.overlayReturnBtn} onPress={() => router.back()}>
              <Text style={styles.overlayReturnBtnText}>Return</Text>
            </TouchableOpacity>
          </View>
        </BlurView>
      </Modal>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F2F4F7",
  },

  // ── Scroll area ───────────────────────────────────────────────────────────
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: Platform.OS === "ios" ? 60 : 40,
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  scrollPadding: {
    height: 20,
  },

  // ── Page header ───────────────────────────────────────────────────────────
  pageHeader: {
    marginBottom: 24,
  },
  pageTitle: {
    fontFamily: "Poppins-Bold",
    fontSize: 24,
    color: "#2B74B4",
    marginBottom: 4,
  },
  pageSubtitle: {
    fontFamily: "Poppins",
    fontSize: 13,
    color: "#95CDF2",
  },

  // ── Question blocks ───────────────────────────────────────────────────────
  questionBlock: {
    marginBottom: 20,
  },
  questionText: {
    fontFamily: "Poppins-SemiBold",
    fontSize: 14,
    color: "#2B74B4",
    marginBottom: 10,
    lineHeight: 20,
  },

  // ── MCQ option rows ───────────────────────────────────────────────────────
  optionsStack: {
    gap: 8,
  },
  optionRow: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1.5,
    borderColor: "#2B74B4",
    borderRadius: 10,
    paddingVertical: 13,
    paddingHorizontal: 16,
  },
  optionRowSelected: {
    backgroundColor: "#2B74B4",
    borderColor: "#2B74B4",
  },
  optionText: {
    fontFamily: "Poppins-SemiBold",
    fontSize: 13,
    color: "#2B74B4",
  },
  optionTextSelected: {
    color: "#FFFFFF",
  },

  // ── Star rating ───────────────────────────────────────────────────────────
  starsRow: {
    flexDirection: "row",
    gap: 8,
    marginTop: 4,
  },
  starBtn: {
    padding: 4,
  },
  starIcon: {
    fontSize: 40,
    color: "#D0DCE8",
  },
  starIconFilled: {
    color: "#FCC419",
  },

  // ── Open text input ───────────────────────────────────────────────────────
  textInput: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1.5,
    borderColor: "#2B74B4",
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 13,
    fontFamily: "Poppins",
    fontSize: 13,
    color: "#2B74B4",
    minHeight: 100,
  },

  // ── Sticky footer ─────────────────────────────────────────────────────────
  footer: {
    flexDirection: "row",
    gap: 12,
    paddingHorizontal: 20,
    paddingVertical: 16,
    paddingBottom: Platform.OS === "ios" ? 32 : 16,
    backgroundColor: "#F2F4F7",
    borderTopWidth: 1,
    borderTopColor: "#DDE6F0",
  },
  backBtn: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    borderWidth: 1.5,
    borderColor: "#2B74B4",
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: "center",
  },
  backBtnText: {
    fontFamily: "Poppins-SemiBold",
    fontSize: 14,
    color: "#2B74B4",
  },
  submitBtn: {
    flex: 1,
    backgroundColor: "#2B74B4",
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: "center",
  },
  submitBtnText: {
    fontFamily: "Poppins-SemiBold",
    fontSize: 14,
    color: "#FFFFFF",
  },
  submitBtnDisabled: {
    backgroundColor: "#A8C4E0",
  },

  // ── Alert modal ───────────────────────────────────────────────────────────
  absolute: {
    position: "absolute",
    top: 0,
    left: 0,
    bottom: 0,
    right: 0,
    justifyContent: "center",
    alignItems: "center",
  },
  alertCard: {
    backgroundColor: "#fff",
    width: "82%",
    borderRadius: 20,
    padding: 28,
    alignItems: "center",
    borderWidth: 1.5,
    borderColor: "#2B74B4",
    elevation: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  alertTitle: {
    fontFamily: "Poppins-Bold",
    fontSize: 18,
    color: "#2B74B4",
    textAlign: "center",
    marginBottom: 10,
  },
  alertBody: {
    fontFamily: "Poppins",
    fontSize: 13,
    color: "#95CDF2",
    textAlign: "center",
    marginBottom: 24,
  },
  alertButton: {
    backgroundColor: "#2B74B4",
    borderRadius: 10,
    paddingVertical: 12,
    width: "100%",
    alignItems: "center",
  },
  alertButtonText: {
    fontFamily: "Poppins-SemiBold",
    fontSize: 14,
    color: "#fff",
  },

  // ── Shared overlay modal (success + already-evaluated) ───────────────────
  overlayCard: {
    backgroundColor: "#fff",
    width: "82%",
    borderRadius: 20,
    padding: 28,
    alignItems: "center",
    borderWidth: 1.5,
    borderColor: "#2B74B4",
    elevation: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    gap: 6,
  },
  overlayTitle: {
    fontFamily: "Poppins-Bold",
    fontSize: 18,
    color: "#2B74B4",
    textAlign: "center",
    marginBottom: 4,
  },
  overlayDetail: {
    fontFamily: "Poppins",
    fontSize: 13,
    color: "#95CDF2",
    textAlign: "center",
  },
  overlayReturnBtn: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1.5,
    borderColor: "#2B74B4",
    borderRadius: 10,
    paddingVertical: 14,
    width: "100%",
    alignItems: "center",
    marginTop: 16,
  },
  overlayReturnBtnText: {
    fontFamily: "Poppins-SemiBold",
    fontSize: 14,
    color: "#2B74B4",
  },
});
