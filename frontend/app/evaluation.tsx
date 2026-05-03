import { Stack, useRouter, useLocalSearchParams } from "expo-router";
import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  TextInput,
  Modal,
} from "react-native";
import { BlurView } from "expo-blur";
import { Ionicons } from "@expo/vector-icons";
import {
  useFonts,
  Poppins_400Regular,
  Poppins_600SemiBold,
  Poppins_700Bold,
} from "@expo-google-fonts/poppins";
import * as SplashScreen from "expo-splash-screen";
import { submitEvaluation, checkEvaluated } from "../src/api/evaluation";

const RATING_OPTIONS = [
  { value: "A", label: "Excellent" },
  { value: "B", label: "Good" },
  { value: "C", label: "Fair" },
  { value: "D", label: "Poor" },
  { value: "E", label: "Very Poor" },
];

const STUDENT_QUESTIONS = [
  "How would you rate your tutor's teaching effectiveness?",
  "How would you rate your tutor's communication and helpfulness?",
];

const TUTOR_QUESTIONS = [
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

  const isTutorEvaluating = evaluationType === "TUTOR_EVALUATES_STUDENT";
  const questions = isTutorEvaluating ? TUTOR_QUESTIONS : STUDENT_QUESTIONS;

  const [loading, setLoading] = useState(true);
  const [alreadyEvaluated, setAlreadyEvaluated] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [alertModal, setAlertModal] = useState<{
    visible: boolean;
    title: string;
    body: string;
    isSuccess: boolean;
  }>({ visible: false, title: "", body: "", isSuccess: false });

  const [q1, setQ1] = useState<string | null>(null);
  const [q2, setQ2] = useState<string | null>(null);
  const [q3, setQ3] = useState<string | null>(null);
  const [comment, setComment] = useState("");

  const [fontsLoaded] = useFonts({
    Poppins: Poppins_400Regular,
    "Poppins-Bold": Poppins_700Bold,
    "Poppins-SemiBold": Poppins_600SemiBold,
  });

  useEffect(() => {
    SplashScreen.preventAutoHideAsync();
  }, []);

  useEffect(() => {
    if (fontsLoaded) SplashScreen.hideAsync();
  }, [fontsLoaded]);

  useEffect(() => {
    const checkStatus = async () => {
      try {
        const evaluated = await checkEvaluated(bookingId, evaluationType);
        setAlreadyEvaluated(evaluated);
      } catch {
        // treat as not yet evaluated if the check fails
      } finally {
        setLoading(false);
      }
    };
    if (bookingId && evaluationType) checkStatus();
  }, [bookingId, evaluationType]);

  const getAnswer = (index: number) => (index === 0 ? q1 : index === 1 ? q2 : q3);
  const setAnswer = (index: number, value: string) => {
    if (index === 0) setQ1(value);
    else if (index === 1) setQ2(value);
    else setQ3(value);
  };

  const handleSubmit = async () => {
    const allAnswered = q1 && q2 && (!isTutorEvaluating || q3);
    if (!allAnswered) {
      setAlertModal({
        visible: true,
        title: "Incomplete Form",
        body: "Please answer all required questions before submitting.",
        isSuccess: false,
      });
      return;
    }

    setSubmitting(true);
    try {
      await submitEvaluation({
        bookingId,
        evaluatorId,
        evaluateeId,
        evaluationType,
        q1Answer: q1,
        q2Answer: q2,
        q3Answer: isTutorEvaluating ? q3 : undefined,
        openComment: comment.trim() || undefined,
      });
      setAlreadyEvaluated(true);
      setAlertModal({
        visible: true,
        title: "Evaluation Submitted!",
        body: "Your evaluation has been recorded. Thank you for your feedback.",
        isSuccess: true,
      });
    } catch (e: any) {
      const msg =
        e?.response?.data?.error ||
        "Failed to submit evaluation. Please try again.";
      setAlertModal({ visible: true, title: "Error", body: msg, isSuccess: false });
    } finally {
      setSubmitting(false);
    }
  };

  const handleAlertClose = () => {
    const wasSuccess = alertModal.isSuccess;
    setAlertModal({ visible: false, title: "", body: "", isSuccess: false });
    if (wasSuccess) router.back();
  };

  if (!fontsLoaded || loading) return null;

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />

      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="chevron-back" size={28} color="#2B74B4" />
        </TouchableOpacity>
        <View>
          <Text style={styles.headerTitle}>Evaluate Session</Text>
          <Text style={styles.headerSubtitle}>
            {isTutorEvaluating ? "Evaluating Student" : "Evaluating Tutor"}
          </Text>
        </View>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.sessionCard}>
          <Text style={styles.sessionName}>{evaluateeName}</Text>
          <Text style={styles.sessionSubject}>{subject}</Text>
        </View>

        {alreadyEvaluated ? (
          <View style={styles.doneCard}>
            <Ionicons name="checkmark-circle" size={56} color="#0FE40F" />
            <Text style={styles.doneTitle}>Already Evaluated</Text>
            <Text style={styles.doneBody}>
              You have already submitted an evaluation for this session.
            </Text>
            <TouchableOpacity style={styles.submitButton} onPress={() => router.back()}>
              <Text style={styles.submitButtonText}>Return</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            {questions.map((question, index) => (
              <View key={index} style={styles.questionBlock}>
                <Text style={styles.questionNumber}>Question {index + 1}</Text>
                <Text style={styles.questionText}>{question}</Text>
                <View style={styles.optionsContainer}>
                  {RATING_OPTIONS.map((opt) => {
                    const selected = getAnswer(index) === opt.value;
                    return (
                      <TouchableOpacity
                        key={opt.value}
                        style={[styles.optionButton, selected && styles.optionButtonSelected]}
                        onPress={() => setAnswer(index, opt.value)}
                      >
                        <Text
                          style={[styles.optionValue, selected && styles.optionValueSelected]}
                        >
                          {opt.value}
                        </Text>
                        <Text
                          style={[styles.optionLabel, selected && styles.optionLabelSelected]}
                        >
                          {opt.label}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            ))}

            <View style={styles.questionBlock}>
              <Text style={styles.questionNumber}>Additional Comments</Text>
              <Text style={styles.questionText}>
                Optional: Leave any additional feedback below.
              </Text>
              <TextInput
                style={styles.commentInput}
                placeholder="Write your comments here..."
                placeholderTextColor="#95CDF2"
                multiline
                numberOfLines={4}
                value={comment}
                onChangeText={setComment}
                maxLength={1000}
              />
            </View>

            <TouchableOpacity
              style={[styles.submitButton, submitting && styles.disabledButton]}
              onPress={handleSubmit}
              disabled={submitting}
            >
              <Text style={styles.submitButtonText}>
                {submitting ? "Submitting..." : "Submit Evaluation"}
              </Text>
            </TouchableOpacity>

            <View style={styles.bottomSpacing} />
          </>
        )}
      </ScrollView>

      <Modal
        animationType="fade"
        transparent={true}
        visible={alertModal.visible}
        onRequestClose={handleAlertClose}
      >
        <BlurView intensity={20} tint="light" style={styles.absolute}>
          <View style={styles.alertCard}>
            <Text style={styles.alertTitle}>{alertModal.title}</Text>
            <Text style={styles.alertBody}>{alertModal.body}</Text>
            <TouchableOpacity style={styles.alertButton} onPress={handleAlertClose}>
              <Text style={styles.alertButtonText}>OK</Text>
            </TouchableOpacity>
          </View>
        </BlurView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    padding: 20,
    paddingTop: 50,
    backgroundColor: "#fff",
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontFamily: "Poppins",
    fontSize: 20,
    fontWeight: "600",
    color: "#2B74B4",
  },
  headerSubtitle: {
    fontFamily: "Poppins",
    fontSize: 12,
    fontWeight: "600",
    color: "#95CDF2",
  },
  scrollView: {
    flex: 1,
  },
  sessionCard: {
    backgroundColor: "#2B74B4",
    margin: 20,
    marginBottom: 10,
    padding: 20,
    borderRadius: 15,
  },
  sessionName: {
    fontFamily: "Poppins",
    fontSize: 17,
    fontWeight: "600",
    color: "#fff",
    marginBottom: 4,
  },
  sessionSubject: {
    fontFamily: "Poppins",
    fontSize: 13,
    color: "#fff",
    opacity: 0.85,
  },
  doneCard: {
    backgroundColor: "#fff",
    marginHorizontal: 20,
    marginTop: 10,
    padding: 30,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: "#2B74B4",
    alignItems: "center",
    gap: 12,
  },
  doneTitle: {
    fontFamily: "Poppins",
    fontSize: 18,
    fontWeight: "700",
    color: "#2B74B4",
    textAlign: "center",
  },
  doneBody: {
    fontFamily: "Poppins",
    fontSize: 13,
    color: "#95CDF2",
    textAlign: "center",
    marginBottom: 8,
  },
  questionBlock: {
    backgroundColor: "#fff",
    marginHorizontal: 20,
    marginTop: 10,
    padding: 18,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: "#2B74B4",
  },
  questionNumber: {
    fontFamily: "Poppins",
    fontSize: 12,
    fontWeight: "600",
    color: "#95CDF2",
    marginBottom: 4,
  },
  questionText: {
    fontFamily: "Poppins",
    fontSize: 14,
    fontWeight: "600",
    color: "#2B74B4",
    marginBottom: 14,
  },
  optionsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  optionButton: {
    borderWidth: 1,
    borderColor: "#2B74B4",
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 12,
    alignItems: "center",
    minWidth: 60,
  },
  optionButtonSelected: {
    backgroundColor: "#2B74B4",
  },
  optionValue: {
    fontFamily: "Poppins",
    fontSize: 16,
    fontWeight: "700",
    color: "#2B74B4",
  },
  optionValueSelected: {
    color: "#fff",
  },
  optionLabel: {
    fontFamily: "Poppins",
    fontSize: 10,
    color: "#95CDF2",
  },
  optionLabelSelected: {
    color: "#fff",
    opacity: 0.9,
  },
  commentInput: {
    borderWidth: 1,
    borderColor: "#2B74B4",
    borderRadius: 8,
    paddingHorizontal: 15,
    paddingVertical: 12,
    fontSize: 13,
    fontFamily: "Poppins",
    color: "#2B74B4",
    minHeight: 100,
    textAlignVertical: "top",
  },
  submitButton: {
    backgroundColor: "#2B74B4",
    marginHorizontal: 20,
    marginTop: 20,
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: "center",
  },
  submitButtonText: {
    fontFamily: "Poppins",
    fontSize: 15,
    fontWeight: "600",
    color: "#fff",
  },
  disabledButton: {
    opacity: 0.6,
  },
  bottomSpacing: {
    height: 60,
  },
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
    width: "80%",
    borderRadius: 20,
    padding: 28,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#2B74B4",
    elevation: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  alertTitle: {
    fontFamily: "Poppins",
    fontSize: 18,
    fontWeight: "700",
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
    fontFamily: "Poppins",
    fontSize: 15,
    fontWeight: "600",
    color: "#fff",
  },
});
