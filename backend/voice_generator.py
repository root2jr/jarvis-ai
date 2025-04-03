import sys
import pyttsx3
sys.stdout.reconfigure(encoding='utf-8')

if len(sys.argv) != 3:
    print("Usage: python voice_generator.py '<text>' '<filename>'")
    sys.exit(1)

text = sys.argv[1]
filename = sys.argv[2]

# Initialize the TTS engine
engine = pyttsx3.init()

# Set Male Voice (Choose from available voices)
voices = engine.getProperty('voices')
engine.setProperty('voice', voices[0].id)  # Change index if needed

# Save as MP3 file
engine.save_to_file(text, filename)
engine.runAndWait()

print(f"✅ Male Voice file saved: {filename}")
