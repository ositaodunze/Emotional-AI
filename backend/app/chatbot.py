"""
Enhanced chatbot with stronger music generation triggers
"""

from openai import OpenAI
import os
import re
from typing import List, Dict

client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

def get_chat_response(message: str, conversation_history: List[dict], language: str = "en", detected_emotion: str = None):
    """
    Get DJ Vibe chatbot response with music generation capability
    
    Args:
        message: User's message
        conversation_history: Previous conversation messages
        language: Language code (default: "en")
        detected_emotion: Detected emotion from face recognition
        
    Returns:
        dict with 'response' and 'music_data' (if music generation requested)
    """
    
    # Enhanced system prompt with explicit music generation instructions
    system_prompt = f"""You are DJ Vibe, an energetic and supportive AI DJ assistant. You're warm, empathetic, and use casual language with occasional slang.

🎵 CRITICAL MUSIC GENERATION RULE 🎵
This is MANDATORY and MUST be followed:

Whenever the user:
- Asks for music recommendations
- Wants to hear songs
- Mentions a genre (rap, pop, rock, etc.)
- Mentions a mood (happy, sad, energetic, etc.)
- Wants something different from current playlist
- Says "play", "give me", "I want", "show me" + anything music related

You MUST include this EXACT format at the END of your response:
[GENERATE_MUSIC: emotion=EMOTION, genres=GENRE1,GENRE2,GENRE3]

🎯 EXAMPLES OF CORRECT RESPONSES:

User: "give me happy music"
You: "I got you! Let's get some sunshine through your speakers! [GENERATE_MUSIC: emotion=happy, genres=pop,dance,funk]"

User: "play some rap"
You: "Bet! Time to drop some bars! [GENERATE_MUSIC: emotion=energetic, genres=hip-hop,rap,trap]"

User: "I'm sad, need music"
You: "I'm here for you. Let me find something comforting. [GENERATE_MUSIC: emotion=sad, genres=indie,acoustic,alternative]"

User: "something more chill"
You: "For sure! Let's dial it down a notch. [GENERATE_MUSIC: emotion=calm, genres=lo-fi,chill,ambient]"

User: "give me drake songs"
You: "Yo! I'll get some Drake-style vibes going! [GENERATE_MUSIC: emotion=confident, genres=hip-hop,r&b,rap]"

🚨 IMPORTANT RULES:
1. ALWAYS end with [GENERATE_MUSIC: ...] when user wants music
2. Choose 2-3 relevant genres
3. Match emotion to what user described or current detected emotion
4. Keep your text BEFORE the trigger natural and supportive
5. DO NOT explain what the trigger does - just include it naturally

Available emotions: happy, sad, angry, anxious, energetic, calm, neutral, excited, melancholic

Current user emotion detected: {detected_emotion or 'neutral'}

Remember: Be supportive, use emojis occasionally (🎵🔥💙), and ALWAYS include the music trigger when user wants tunes!"""

    # Build messages for OpenAI
    messages = [
        {"role": "system", "content": system_prompt}
    ]
    
    # Add conversation history
    for msg in conversation_history[-10:]:  # Keep last 10 messages
        messages.append({
            "role": msg["role"],
            "content": msg["content"]
        })
    
    # Add current user message
    messages.append({
        "role": "user",
        "content": message
    })
    
    # Call OpenAI API
    try:
        response = client.chat.completions.create(
            model="gpt-4o",
            messages=messages,
            temperature=0.7,  # Lower temperature for more consistent format
            max_tokens=300
        )
        
        response_text = response.choices[0].message.content
        
        # 🔍 DEBUG: Print full response
        print(f"\n{'='*50}")
        print(f"🤖 GPT-4 FULL RESPONSE:")
        print(f"{response_text}")
        print(f"{'='*50}\n")
        
        # Parse for music generation trigger
        music_pattern = r'\[GENERATE_MUSIC:\s*emotion=([^,]+),\s*genres=([^\]]+)\]'
        match = re.search(music_pattern, response_text)
        
        if match:
            print(f"✅ MUSIC TRIGGER FOUND!")
            emotion = match.group(1).strip()
            genres_str = match.group(2).strip()
            genres = [g.strip() for g in genres_str.split(',')]
            
            print(f"   📊 Emotion: {emotion}")
            print(f"   🎵 Genres: {genres}")
            
            # Remove trigger from display text
            clean_response = re.sub(music_pattern, '', response_text).strip()
            
            music_data = {
                "emotion": emotion,
                "genres": genres
            }
            
            return {
                "response": clean_response,
                "music_data": music_data
            }
        else:
            print(f"❌ NO MUSIC TRIGGER FOUND IN RESPONSE")
            print(f"   This means GPT didn't include [GENERATE_MUSIC: ...] tag")
            
            return {
                "response": response_text,
                "music_data": None
            }
            
    except Exception as e:
        print(f"❌ OpenAI API Error: {e}")
        return {
            "response": "Yo, I'm having some technical difficulties! Can you try that again? 🎧",
            "music_data": None
        }


def detect_language(text: str) -> str:
    """
    Simple language detection (default to English for now)
    Can be enhanced with language detection library if needed
    """
    # For now, default to English
    # TODO: Add proper language detection if needed
    return "en"


# Test function
if __name__ == "__main__":
    print("🧪 Testing music trigger parsing...")
    
    # Test cases
    test_cases = [
        "I got you! [GENERATE_MUSIC: emotion=happy, genres=pop,rock]",
        "Let's go! [GENERATE_MUSIC: emotion=energetic, genres=hip-hop,trap,rap]",
        "Just chatting, no music needed",
        "Here's something chill [GENERATE_MUSIC: emotion=calm, genres=lo-fi,ambient]"
    ]
    
    music_pattern = r'\[GENERATE_MUSIC:\s*emotion=([^,]+),\s*genres=([^\]]+)\]'
    
    for i, test in enumerate(test_cases, 1):
        print(f"\nTest {i}: {test}")
        match = re.search(music_pattern, test)
        if match:
            print(f"  ✅ Found trigger")
            print(f"     Emotion: {match.group(1).strip()}")
            print(f"     Genres: {match.group(2).strip()}")
        else:
            print(f"  ❌ No trigger found")