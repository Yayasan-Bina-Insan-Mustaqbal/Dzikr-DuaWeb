import os

def link_audios():
    audio_dir = 'public/audios'
    # Chapter 27 (Morning) has 25 files
    # Chapter 133 (Evening) should borrow them
    
    for i in range(1, 26):
        src = f'027_{i:02d}.mp3'
        dst = f'133_{i:02d}.mp3'
        
        src_path = os.path.join(audio_dir, src)
        dst_path = os.path.join(audio_dir, dst)
        
        if os.path.exists(src_path):
            if not os.path.exists(dst_path):
                # Using relative symlink for portability
                os.symlink(src, dst_path)
                print(f"Linked {dst} -> {src}")
            else:
                print(f"File {dst} already exists")
        else:
            print(f"Source {src} not found")

if __name__ == "__main__":
    link_audios()
