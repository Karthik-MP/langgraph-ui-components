import { useState, useRef, useCallback } from "react";
import { webmFixDuration } from "../utils/BlobFix";
import { useChatRuntime } from "@/providers/ChatRuntime";

function getMimeType() {
    const types = [
        "audio/webm",
        "audio/mp4",
        "audio/ogg",
        "audio/wav",
        "audio/aac",
    ];
    for (let i = 0; i < types.length; i++) {
        if (MediaRecorder.isTypeSupported(types[i])) {
            return types[i];
        }
    }
    return undefined;
}

export function useAudioRecorder() {
    const { identity } = useChatRuntime();
    const [isRecording, setIsRecording] = useState(false);
    const [recordingTime, setRecordingTime] = useState(0);
    const [isTranscribing, setIsTranscribing] = useState(false);
    
    const streamRef = useRef<MediaStream | null>(null);
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const chunksRef = useRef<Blob[]>([]);
    const timerRef = useRef<number | null>(null);
    const startTimeRef = useRef<number>(0);

    const startRecording = useCallback(async () => {
        try {
            if (!streamRef.current) {
                streamRef.current = await navigator.mediaDevices.getUserMedia({
                    audio: true,
                });
            }

            const mimeType = getMimeType();
            const mediaRecorder = new MediaRecorder(streamRef.current, {
                mimeType,
            });

            mediaRecorderRef.current = mediaRecorder;
            chunksRef.current = [];
            startTimeRef.current = Date.now();

            mediaRecorder.addEventListener("dataavailable", (event) => {
                if (event.data.size > 0) {
                    chunksRef.current.push(event.data);
                }
            });

            mediaRecorder.start();
            setIsRecording(true);

            // Start timer
            timerRef.current = window.setInterval(() => {
                setRecordingTime(Math.floor((Date.now() - startTimeRef.current) / 1000));
            }, 1000);
        } catch (error) {
            console.error("Error accessing microphone:", error);
            alert("Unable to access microphone. Please check your permissions.");
        }
    }, []);

    const stopRecording = useCallback((): Promise<Blob | null> => {
        return new Promise((resolve) => {
            if (
                mediaRecorderRef.current &&
                mediaRecorderRef.current.state === "recording"
            ) {
                const mimeType = mediaRecorderRef.current.mimeType;
                const duration = Date.now() - startTimeRef.current;

                mediaRecorderRef.current.addEventListener("stop", async () => {
                    let blob = new Blob(chunksRef.current, { type: mimeType });

                    if (mimeType === "audio/webm") {
                        blob = await webmFixDuration(blob, duration, blob.type);
                    }

                    resolve(blob);
                });

                mediaRecorderRef.current.stop();
                setIsRecording(false);
                setRecordingTime(0);

                if (timerRef.current) {
                    window.clearInterval(timerRef.current);
                    timerRef.current = null;
                }

                // Stop all tracks
                if (streamRef.current) {
                    streamRef.current.getTracks().forEach((track) => track.stop());
                    streamRef.current = null;
                }
            } else {
                resolve(null);
            }
        });
    }, []);

    const transcribeAudio = useCallback(async (audioBlob: Blob): Promise<string> => {
        setIsTranscribing(true);
        try {
            const apiUrl = identity?.textToSpeechVoice?.apiUrl || "";
            const apiKey = identity?.textToSpeechVoice?.apiKey;

            const formData = new FormData();
            formData.append("file", audioBlob, "audio.webm");
            formData.append("model", identity?.textToSpeechVoice?.model || "Systran/faster-whisper-large-v3");
            formData.append("response_format", "json");

            const headers: HeadersInit = {};
            if (apiKey) {
                headers["Authorization"] = `Bearer ${apiKey}`;
            }

            const response = await fetch(apiUrl, {
                method: "POST",
                headers,
                body: formData,
            });

            if (!response.ok) {
                throw new Error(`Transcription failed: ${response.statusText}`);
            }

            const data = await response.json();
            return data.text || "";
        } catch (error) {
            console.error("Transcription error:", error);
            throw error;
        } finally {
            setIsTranscribing(false);
        }
    }, [identity]);

    const cancelRecording = useCallback(() => {
        if (mediaRecorderRef.current) {
            mediaRecorderRef.current.stop();
        }

        if (streamRef.current) {
            streamRef.current.getTracks().forEach((track) => track.stop());
            streamRef.current = null;
        }

        if (timerRef.current) {
            window.clearInterval(timerRef.current);
            timerRef.current = null;
        }

        chunksRef.current = [];
        setIsRecording(false);
        setRecordingTime(0);
    }, []);

    return {
        isRecording,
        recordingTime,
        isTranscribing,
        startRecording,
        stopRecording,
        transcribeAudio,
        cancelRecording,
    };
}
