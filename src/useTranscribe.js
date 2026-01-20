// src/useTranscribe.js
import { useCallback, useRef, useState } from "react";
import {
    TranscribeStreamingClient,
    StartStreamTranscriptionCommand,
} from "@aws-sdk/client-transcribe-streaming";
import { CognitoIdentityClient } from "@aws-sdk/client-cognito-identity";
import { fromCognitoIdentityPool } from "@aws-sdk/credential-provider-cognito-identity";

const REGION = import.meta.env.VITE_AWS_REGION;
const IDENTITY_POOL_ID = import.meta.env.VITE_IDENTITY_POOL_ID;

export function useTranscribe() {
    const [isRecording, setIsRecording] = useState(false);

    const [finalTranscript, setFinalTranscript] = useState("");   // frases finalizadas
    const [partialTranscript, setPartialTranscript] = useState(""); // legenda ao vivo

    const [error, setError] = useState(null);

    const clientRef = useRef(null);
    const runningRef = useRef(false);

    const audioContextRef = useRef(null);
    const processorRef = useRef(null);
    const mediaStreamRef = useRef(null);
    const sampleRateRef = useRef(16000);

    const ensureClient = useCallback(() => {
        if (!clientRef.current) {
            const identityClient = new CognitoIdentityClient({ region: REGION });

            const credentials = fromCognitoIdentityPool({
                client: identityClient,
                identityPoolId: IDENTITY_POOL_ID,
            });

            clientRef.current = new TranscribeStreamingClient({
                region: REGION,
                credentials,
            });
        }
    }, []);

    const start = useCallback(async () => {
        try {
            setError(null);
            setFinalTranscript("");
            setPartialTranscript("");
            ensureClient();

            console.log("[useTranscribe] starting…");

            // Microfone
            const mediaStream = await navigator.mediaDevices.getUserMedia({
                audio: true,
            });
            mediaStreamRef.current = mediaStream;
            console.log("[useTranscribe] got userMediaStream:", mediaStream);

            // AudioContext
            const AC = window.AudioContext || window.webkitAudioContext;
            const audioContext = new AC();
            audioContextRef.current = audioContext;

            sampleRateRef.current = audioContext.sampleRate;
            console.log("[audio] sampleRate:", audioContext.sampleRate);

            const source = audioContext.createMediaStreamSource(mediaStream);
            const processor = audioContext.createScriptProcessor(4096, 1, 1);
            processorRef.current = processor;

            const queue = [];

            runningRef.current = true;
            setIsRecording(true);

            processor.onaudioprocess = (event) => {
                if (!runningRef.current) return;
                const float32 = event.inputBuffer.getChannelData(0);

                const copy = new Float32Array(float32.length);
                copy.set(float32);
                queue.push(copy);
            };

            source.connect(processor);
            processor.connect(audioContext.destination);

            // generator para o SDK
            const audioStream = async function* () {
                while (runningRef.current) {
                    if (queue.length === 0) {
                        await new Promise((r) => setTimeout(r, 10));
                        continue;
                    }

                    const float32 = queue.shift();
                    if (!float32 || float32.length === 0) continue;

                    const pcmBytes = floatToPCM16(float32);

                    yield {
                        AudioEvent: {
                            AudioChunk: pcmBytes,
                        },
                    };
                }
            };

            const sr = sampleRateRef.current || 16000;

            const command = new StartStreamTranscriptionCommand({
                LanguageCode: "pt-BR",
                MediaEncoding: "pcm",
                MediaSampleRateHertz: sr,
                AudioStream: audioStream(),
            });

            const response = await clientRef.current.send(command);
            console.log("[useTranscribe] streaming started");

            // LOOP DE TRANSCRIÇÃO
            for await (const event of response.TranscriptResultStream) {
                const transcriptEvent = event.TranscriptEvent;
                if (!transcriptEvent) continue;

                const results = transcriptEvent.Transcript?.Results;
                if (!results || results.length === 0) continue;

                const result = results[0];
                const alternatives = result.Alternatives || [];
                if (alternatives.length === 0) continue;

                let text = alternatives[0].Transcript || "";

                try {
                    text = decodeURIComponent(escape(text));
                } catch { }

                if (result.IsPartial) {
                    // legenda ao vivo — igual YouTube
                    setPartialTranscript(text);
                } else {
                    // frase final — apaga parcial
                    setFinalTranscript((prev) =>
                        prev ? `${prev}\n${text}` : text
                    );
                    setPartialTranscript("");
                }
            }

            console.log("[useTranscribe] stream ended");
        } catch (e) {
            console.error("[useTranscribe] error:", e);
            setError(e.message || String(e));
            runningRef.current = false;
            setIsRecording(false);
        }
    }, [ensureClient]);

    const stop = useCallback(() => {
        console.log("[useTranscribe] stop");

        runningRef.current = false;
        setIsRecording(false);

        if (processorRef.current) {
            try {
                processorRef.current.disconnect();
            } catch { }
            processorRef.current = null;
        }

        if (audioContextRef.current) {
            try {
                audioContextRef.current.close();
            } catch { }
            audioContextRef.current = null;
        }

        if (mediaStreamRef.current) {
            try {
                mediaStreamRef.current.getTracks().forEach((t) => t.stop());
            } catch { }
            mediaStreamRef.current = null;
        }
    }, []);

    const reset = useCallback(() => {
        setFinalTranscript("");
        setPartialTranscript("");
    }, []);

    return {
        isRecording,
        error,
        finalTranscript,   // acumulado
        partialTranscript, // legenda ao vivo
        start,
        stop,
        reset,
    };
}

// Conversão Float32 → PCM16
function floatToPCM16(floatBuffer) {
    const buffer = new ArrayBuffer(floatBuffer.length * 2);
    const view = new DataView(buffer);
    let offset = 0;

    for (let i = 0; i < floatBuffer.length; i++, offset += 2) {
        let s = Math.max(-1, Math.min(1, floatBuffer[i]));
        view.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7fff, true);
    }

    return new Uint8Array(buffer);
}
