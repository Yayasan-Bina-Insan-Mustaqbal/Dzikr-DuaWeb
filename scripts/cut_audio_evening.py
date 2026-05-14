import subprocess
import os

def cut_audio(input_file, output_file, start, end):
    cmd = [
        "ffmpeg", "-y", "-i", input_file,
        "-ss", str(start), "-to", str(end),
        "-c", "copy", output_file
    ]
    subprocess.run(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
    print(f"Saved: {output_file} ({start}s -> {end}s)")

def main():
    input_file = "public/audios/rodja_evening.mp3"
    os.makedirs("public/audios", exist_ok=True)
    
    # Mapping based on evening transcript analysis
    cuts = [
        ("034_01.mp3", 21.0, 73.0),    # Ayatul Kursi (ID 99)
        ("034_02.mp3", 153.0, 421.0),  # 3 Qul (ID 100)
        ("034_03.mp3", 421.0, 485.0),  # Amseina... (ID 101)
        # Rodja Evening might skip ID 102 "Allahumma bike amseyna" or it's further down
        ("034_05.mp3", 574.0, 593.0),  # Sayyidul Istighfar (ID 103)
        ("034_06.mp3", 633.0, 698.0),  # Allahumma 'afini... (ID 104)
        ("034_07.mp3", 744.0, 756.0),  # Allahumma inni as'aluka... (ID 105)
    ]
    
    print("Cutting Evening Adhkar...")
    for filename, start, end in cuts:
        output_path = os.path.join("public/audios", filename)
        cut_audio(input_file, output_path, start, end)

    print("\nAlhamdulillah! Evening Adhkar cut and saved to public/audios/")

if __name__ == "__main__":
    main()
