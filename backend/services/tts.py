"""
Text-to-Speech Service — Gemini TTS
Converts agent dialogue text to audio using Gemini's native TTS model.
Returns raw PCM audio encoded as base64 WAV for browser playback.
"""
import base64
import io
import wave
from gtts import gTTS

from google import genai
from google.genai import types as genai_types

from config import settings


# Gemini TTS voice for the farmer agent — Kore sounds warm & natural for Hindi
FARMER_VOICE = "Kore"
TTS_MODEL = "gemini-2.5-flash-preview-tts"


def _pcm_to_wav_base64(pcm_data: bytes, sample_rate: int = 24000, channels: int = 1, sample_width: int = 2) -> str:
    """Convert raw PCM bytes to a base64-encoded WAV string for browser <audio> playback."""
    buf = io.BytesIO()
    with wave.open(buf, "wb") as wf:
        wf.setnchannels(channels)
        wf.setsampwidth(sample_width)
        wf.setframerate(sample_rate)
        wf.writeframes(pcm_data)
    b64 = base64.b64encode(buf.getvalue()).decode("ascii")
    return f"data:audio/wav;base64,{b64}"


def _generate_gtts_fallback(text: str) -> str:
    """Generate TTS using Google TTS (free) as MP3."""
    tts = gTTS(text=text, lang="hi") # Hindi/Hinglish
    buf = io.BytesIO()
    tts.write_to_fp(buf)
    b64 = base64.b64encode(buf.getvalue()).decode("ascii")
    return f"data:audio/mp3;base64,{b64}"


async def generate_speech(text: str, voice_name: str = FARMER_VOICE) -> str | None:
    """
    Convert text to speech using Gemini TTS.
    Falls back to free gTTS if quota exhausted or API fails.
    Returns base64-encoded data URI audio string, or None on failure.
    """
    if not settings.GEMINI_API_KEY:
        return _generate_gtts_fallback(text)

    try:
        client = genai.Client(api_key=settings.GEMINI_API_KEY)
        response = client.models.generate_content(
            model=TTS_MODEL,
            contents=f"Say in a confident Indian farmer voice: {text}",
            config=genai_types.GenerateContentConfig(
                response_modalities=["AUDIO"],
                speech_config=genai_types.SpeechConfig(
                    voice_config=genai_types.VoiceConfig(
                        prebuilt_voice_config=genai_types.PrebuiltVoiceConfig(
                            voice_name=voice_name,
                        )
                    ),
                ),
            ),
        )
        
        # Prevent 'NoneType' has no attribute 'parts' error
        if not response.candidates or not response.candidates[0].content or not response.candidates[0].content.parts:
            print("[TTS] Gemini returned empty response or no parts. Falling back to gTTS.")
            return _generate_gtts_fallback(text)

        pcm_data = response.candidates[0].content.parts[0].inline_data.data
        return _pcm_to_wav_base64(pcm_data)
    except Exception as e:
        print(f"[TTS] Error generating speech with Gemini: {e}. Falling back to gTTS.")
        try:
            return _generate_gtts_fallback(text)
        except Exception as fallback_err:
            print(f"[TTS] Fallback also failed: {fallback_err}")
            return None
