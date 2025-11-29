"""
ElevenLabs Voice Service for DJ Vibe Chatbot
Updated for new free tier models (2024+)
"""

import os
from elevenlabs.client import ElevenLabs
from dotenv import load_dotenv

load_dotenv()

class VoiceService:
    def __init__(self):
        self.api_key = os.getenv("ELEVENLABS_API_KEY")
        if not self.api_key:
            raise ValueError("ELEVENLABS_API_KEY not found in environment variables")
        
        # Initialize ElevenLabs client
        self.client = ElevenLabs(api_key=self.api_key)
        
        # DJ Vibe voice configuration
        # Rachel: Warm, energetic female voice - perfect for a supportive DJ
        self.voice_id = "21m00Tcm4TlvDq8ikWAM"  # Rachel
        
        # Alternative voices:
        # self.voice_id = "EXAVITQu4vr4xnSDxMaL"  # Bella - upbeat, young
        # self.voice_id = "ErXwobaYiN019PkySvjV"  # Antoni - smooth, deep male
        # self.voice_id = "TxGEqnHWrfWFTfGW9XjX"  # Josh - enthusiastic male
        
        # Voice settings
        self.stability = 0.5        # Lower = more expressive/emotional
        self.similarity_boost = 0.75 # How close to the original voice
        self.style = 0.5            # Style exaggeration (0-1)
        self.use_speaker_boost = True # Enhance voice clarity
    
    def text_to_speech(self, text: str) -> bytes:
        """
        Convert text to speech using ElevenLabs
        
        Args:
            text: The text to convert to speech
            
        Returns:
            bytes: Audio data in MP3 format
        """
        try:
            # Clean text (remove markdown, special characters)
            clean_text = self._clean_text(text)
            
            if not clean_text:
                return None
            
            # Generate audio using text_to_speech.convert method
            # Using eleven_turbo_v2_5 - the new FREE tier model
            audio_generator = self.client.text_to_speech.convert(
                voice_id=self.voice_id,
                text=clean_text,
                model_id="eleven_turbo_v2_5",  # ✅ NEW FREE MODEL
                voice_settings={
                    "stability": self.stability,
                    "similarity_boost": self.similarity_boost,
                    "style": self.style,
                    "use_speaker_boost": self.use_speaker_boost
                }
            )
            
            # Convert generator to bytes
            audio_bytes = b"".join(audio_generator)
            
            print(f"✅ Generated {len(audio_bytes)} bytes of audio")
            return audio_bytes
            
        except Exception as e:
            print(f"❌ ElevenLabs TTS Error: {e}")
            import traceback
            traceback.print_exc()
            return None
    
    def _clean_text(self, text: str) -> str:
        """
        Clean text before sending to TTS
        - Remove [GENERATE_MUSIC: ...] triggers
        - Remove markdown formatting
        - Remove URLs
        - Trim whitespace
        """
        import re
        
        # Remove music generation triggers
        text = re.sub(r'\[GENERATE_MUSIC:.*?\]', '', text)
        
        # Remove markdown formatting
        text = re.sub(r'[*_~`]', '', text)
        
        # Replace URLs with "link"
        text = re.sub(r'https?://[^\s]+', 'link', text)
        
        # Remove multiple spaces
        text = re.sub(r'\s+', ' ', text)
        
        return text.strip()
    
    def get_available_voices(self) -> dict:
        """
        Return recommended voices for DJ personality
        """
        return {
            "rachel": {
                "id": "21m00Tcm4TlvDq8ikWAM",
                "name": "Rachel",
                "description": "Warm, energetic female - Default DJ voice",
                "gender": "female",
                "preview": "Perfect for supportive conversations"
            },
            "bella": {
                "id": "EXAVITQu4vr4xnSDxMaL",
                "name": "Bella",
                "description": "Upbeat, young female",
                "gender": "female",
                "preview": "Great for high-energy vibes"
            },
            "antoni": {
                "id": "ErXwobaYiN019PkySvjV",
                "name": "Antoni",
                "description": "Smooth, deep male",
                "gender": "male",
                "preview": "Ideal for calming moments"
            },
            "josh": {
                "id": "TxGEqnHWrfWFTfGW9XjX",
                "name": "Josh",
                "description": "Enthusiastic male",
                "gender": "male",
                "preview": "Best for motivation"
            }
        }
    
    def change_voice(self, voice_name: str):
        """
        Change the DJ voice
        
        Args:
            voice_name: Name of the voice (rachel, bella, antoni, josh)
        """
        voices = self.get_available_voices()
        if voice_name.lower() in voices:
            self.voice_id = voices[voice_name.lower()]["id"]
            print(f"✅ Voice changed to: {voice_name} ({self.voice_id})")
            return True
        print(f"❌ Invalid voice name: {voice_name}")
        return False


# Singleton instance
_voice_service = None

def get_voice_service() -> VoiceService:
    """
    Get or create VoiceService singleton
    """
    global _voice_service
    if _voice_service is None:
        try:
            _voice_service = VoiceService()
            print("✅ Voice service initialized successfully with FREE tier model (eleven_turbo_v2_5)")
        except ValueError as e:
            print(f"⚠️ Voice service initialization failed: {e}")
            return None
        except Exception as e:
            print(f"⚠️ Unexpected error initializing voice service: {e}")
            import traceback
            traceback.print_exc()
            return None
    return _voice_service