#!/bin/sh
INPUT="public/audios/rodja_evening.mp3"
OUTDIR="public/audios"

# Ensure output directory exists
mkdir -p "$OUTDIR"

# 133_01.mp3: Taawudz (12-15) + Ayat Kursi (21-73)
ffmpeg -y -i "$INPUT" -filter_complex "[0:a]atrim=start=12:end=15,asetpts=PTS-STARTPTS[a0];[0:a]atrim=start=21:end=73,asetpts=PTS-STARTPTS[a1];[a0][a1]concat=n=2:v=0:a=1[outa]" -map "[outa]" -c:a libmp3lame -q:a 2 "$OUTDIR/133_01.mp3"

# 133_02.mp3: 3 Quls (121-162, 182-259, 284-421)
ffmpeg -y -i "$INPUT" -filter_complex "[0:a]atrim=start=121:end=162,asetpts=PTS-STARTPTS[a0];[0:a]atrim=start=182:end=259,asetpts=PTS-STARTPTS[a1];[0:a]atrim=start=284:end=421,asetpts=PTS-STARTPTS[a2];[a0][a1][a2]concat=n=3:v=0:a=1[outa]" -map "[outa]" -c:a libmp3lame -q:a 2 "$OUTDIR/133_02.mp3"

# Simple cuts
ffmpeg -y -i "$INPUT" -ss 445 -to 486 -c:a libmp3lame -q:a 2 "$OUTDIR/133_03.mp3"
ffmpeg -y -i "$INPUT" -ss 534 -to 545 -c:a libmp3lame -q:a 2 "$OUTDIR/133_04.mp3"
ffmpeg -y -i "$INPUT" -ss 568 -to 593 -c:a libmp3lame -q:a 2 "$OUTDIR/133_05.mp3"
ffmpeg -y -i "$INPUT" -ss 630 -to 697 -c:a libmp3lame -q:a 2 "$OUTDIR/133_06.mp3"
ffmpeg -y -i "$INPUT" -ss 737 -to 773 -c:a libmp3lame -q:a 2 "$OUTDIR/133_07.mp3"
ffmpeg -y -i "$INPUT" -ss 821 -to 845 -c:a libmp3lame -q:a 2 "$OUTDIR/133_08.mp3"
ffmpeg -y -i "$INPUT" -ss 883 -to 910 -c:a libmp3lame -q:a 2 "$OUTDIR/133_09.mp3"
ffmpeg -y -i "$INPUT" -ss 926 -to 959 -c:a libmp3lame -q:a 2 "$OUTDIR/133_10.mp3"
ffmpeg -y -i "$INPUT" -ss 975 -to 988 -c:a libmp3lame -q:a 2 "$OUTDIR/133_11.mp3"
ffmpeg -y -i "$INPUT" -ss 1014 -to 1037 -c:a libmp3lame -q:a 2 "$OUTDIR/133_12.mp3"
ffmpeg -y -i "$INPUT" -ss 1058 -to 1068 -c:a libmp3lame -q:a 2 "$OUTDIR/133_13.mp3"
ffmpeg -y -i "$INPUT" -ss 1088 -to 1091 -c:a libmp3lame -q:a 2 "$OUTDIR/133_14.mp3"
ffmpeg -y -i "$INPUT" -ss 1097 -to 1112 -c:a libmp3lame -q:a 2 "$OUTDIR/133_15.mp3"

echo "Alhamdulillah! Evening Adhkar processing complete."
