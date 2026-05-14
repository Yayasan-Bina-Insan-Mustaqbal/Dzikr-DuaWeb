import subprocess
import os

def cut_audio(input_file, output_file, start, end):
    # -y to overwrite, -ss for start, -to for end
    cmd = [
        "ffmpeg", "-y", "-i", input_file,
        "-ss", str(start), "-to", str(end),
        "-c", "copy", output_file
    ]
    subprocess.run(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
    print(f"Saved: {output_file} ({start}s -> {end}s)")

def main():
    input_file = "public/audios/rodja_morning.mp3"
    os.makedirs("public/audios/rodja", exist_ok=True)
    
    # Mapping based on transcript analysis
    # Format: (output_filename, start_seconds, end_seconds)
    cuts = [
        ("027_01.mp3", 21.0, 72.5),    # Ayatul Kursi
        ("027_02.mp3", 132.0, 379.0),  # 3 Qul (Combined)
        ("027_03.mp3", 398.0, 442.0),  # Asbahna...
        ("027_04.mp3", 493.0, 502.0),  # Allahumma bike...
        ("027_05.mp3", 526.0, 551.0),  # Sayyidul Istighfar
        ("027_06.mp3", 572.0, 667.0),  # Allahumma 'afini... (3x)
        ("027_07.mp3", 684.0, 741.0),  # Allahumma inni as'aluka...
        ("027_08.mp3", 797.0, 814.0),  # Allahumma 'alimal ghayb...
        ("027_09.mp3", 851.0, 878.0),  # Bismillahilladzi... (3x)
        ("027_10.mp3", 878.0, 942.0),  # Radhitu billah... (3x)
        ("027_11.mp3", 994.0, 1002.0), # Asbahna 'ala fitratil Islam...
    ]
    
    print("Cutting Morning Adhkar...")
    for filename, start, end in cuts:
        output_path = os.path.join("public/audios", filename)
        cut_audio(input_file, output_path, start, end)

    print("\nAlhamdulillah! Morning Adhkar cut and saved to public/audios/")

if __name__ == "__main__":
    main()
