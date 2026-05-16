import subprocess
import os

def run_ffmpeg(args):
    cmd = ["ffmpeg", "-y"] + args
    result = subprocess.run(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)
    if result.returncode != 0:
        print(f"Error running ffmpeg: {result.stderr}")
    return result

def cut_simple(input_file, output_file, start, end):
    run_ffmpeg([
        "-i", input_file,
        "-ss", str(start), "-to", str(end),
        "-c:a", "libmp3lame", "-q:a", "2",
        output_file
    ])
    print(f"Cut: {output_file} ({start}s -> {end}s)")

def cut_and_concat(input_file, output_file, ranges):
    # ranges is a list of (start, end)
    filter_parts = []
    for i, (s, e) in enumerate(ranges):
        filter_parts.append(f"[0:a]atrim=start={s}:end={e},asetpts=PTS-STARTPTS[a{i}]")
    
    concat_filter = ";".join(filter_parts) + ";" + "".join(f"[a{i}]" for i in range(len(ranges))) + f"concat=n={len(ranges)}:v=0:a=1[outa]"
    
    run_ffmpeg([
        "-i", input_file,
        "-filter_complex", concat_filter,
        "-map", "[outa]",
        "-c:a", "libmp3lame", "-q:a", "2",
        output_file
    ])
    print(f"Cut & Concat: {output_file} for ranges {ranges}")

def main():
    input_file = "public/audios/rodja_evening.mp3"
    output_dir = "public/audios"
    os.makedirs(output_dir, exist_ok=True)
    
    # Mapping based on user timestamps
    # Taawudz: 00:12 - 00:15 (12-15)
    # Ayat Kursi: 00:21 - 01:13 (21-73)
    cut_and_concat(input_file, os.path.join(output_dir, "133_01.mp3"), [(12, 15), (21, 73)])
    
    # Al-Ikhlas: 02:01 - 02:42 (121-162)
    # Al-Falaq: 03:02 - 04:19 (182-259)
    # An-Nas: 04:44 - 07:01 (284-421)
    cut_and_concat(input_file, os.path.join(output_dir, "133_02.mp3"), [(121, 162), (182, 259), (284, 421)])
    
    # Others
    mapping = [
        ("133_03.mp3", 445, 486),   # 1 (Amsayna...)
        ("133_04.mp3", 534, 545),   # 2 (Allahumma bika...)
        ("133_05.mp3", 568, 593),   # sayyidul istigfar
        ("133_06.mp3", 630, 697),   # 3 (Testimony 4x)
        ("133_07.mp3", 737, 773),   # 4 (Blessings)
        ("133_08.mp3", 821, 845),   # 5 (Wellbeing 3x)
        ("133_09.mp3", 883, 910),   # 6 (Sufficient 7x)
        ("133_10.mp3", 926, 959),   # 7 (Safety)
        ("133_11.mp3", 975, 988),   # 8 (Protection from Self/Shaitan)
        ("133_12.mp3", 1014, 1037), # 9 (Protection Name 3x)
        ("133_13.mp3", 1058, 1068), # 10 (Pleasure 3x)
        ("133_14.mp3", 1088, 1091), # 11 (Ya Hayyu)
        ("133_15.mp3", 1097, 1112), # 12 (Upon Morning/Evening)
    ]
    
    for filename, start, end in mapping:
        cut_simple(input_file, os.path.join(output_dir, filename), start, end)

    print("\nAlhamdulillah! Evening Adhkar cut according to user timestamps.")

if __name__ == "__main__":
    main()
