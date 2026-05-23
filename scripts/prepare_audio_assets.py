import os
import json
import shutil
import re

def sanitize_name(name):
    # Remove parentheses
    name = re.sub(r'[\(\)]', '', name)
    # Replace non-alphanumeric (except space/hyphen/underscore) with empty
    name = re.sub(r'[^a-zA-Z0-9\s_\-]', '', name)
    # Replace spaces and consecutive underscores with a single underscore
    name = re.sub(r'[\s\-]+', '_', name)
    name = re.sub(r'_+', '_', name)
    return name.strip('_')

def prepare_assets():
    print("Bismillah, starting audio asset preparation...")
    
    # Paths
    json_path = 'src/data/invocations.json'
    public_dir = 'public'
    playlist_dir = os.path.join(public_dir, 'playlist')
    invocations_dir = os.path.join(public_dir, 'invocations')
    
    # Create directories if they do not exist
    os.makedirs(playlist_dir, exist_ok=True)
    os.makedirs(invocations_dir, exist_ok=True)
    
    # Load invocations.json
    if not os.path.exists(json_path):
        print(f"Error: Source file {json_path} does not exist.")
        return
        
    with open(json_path, 'r', encoding='utf-8') as f:
        chapters = json.load(f)
        
    print(f"Loaded {len(chapters)} chapters from {json_path}.")
    
    transliteration_keys = ["latin", "cyrillic", "english_trans", "pinyin", "hebrew_trans"]
    translation_keys = ["indonesian", "english", "albanian", "turkish", "urdu", "french", "spanish", "malay", "russian", "german"]
    metadata_keys = ["reference", "chapter_name", "internal_id"]
    
    for chapter in chapters:
        chapter_id = chapter.get('id')
        chapter_name = chapter.get('chapter_name', f"Chapter {chapter_id}")
        sanitized_chapter = sanitize_name(chapter_name)
        
        # 1. Prepare Playlist JSON
        playlist_filename = f"{chapter_id}_{sanitized_chapter}.json"
        playlist_filepath = os.path.join(playlist_dir, playlist_filename)
        
        playlist_invocations = []
        
        # Invocations
        invocations = chapter.get('invocations', [])
        for inv in invocations:
            inv_id = inv.get('id')
            inv_name = inv.get('name', '')
            if not inv_name:
                # Fallback to internal_id or chapter_name
                inv_name = inv.get('internal_id', f"Invocation {inv_id}")
            
            playlist_invocations.append({
                "id": inv_id,
                "name": inv_name
            })
            
            # 2. Prepare Invocation Folder
            sanitized_inv_name = sanitize_name(inv_name)
            inv_folder_name = f"{inv_id}_{sanitized_inv_name}"
            inv_folder_path = os.path.join(invocations_dir, inv_folder_name)
            os.makedirs(inv_folder_path, exist_ok=True)
            
            # Prepare data.json fields
            data_json = {
                "id": inv_id,
                "name": inv_name,
                "arabic": inv.get('arabic', ''),
                "metadata": {},
                "transliterations": {},
                "translations": {},
                "audio": []
            }
            
            # Populate metadata, translations, transliterations
            for key, val in inv.items():
                if key in metadata_keys:
                    data_json["metadata"][key] = val
                elif key in transliteration_keys:
                    data_json["transliterations"][key] = val
                elif key in translation_keys:
                    data_json["translations"][key] = val
                elif key not in ["id", "name", "arabic", "audio"] and isinstance(val, str) and val.strip():
                    # Any other string fields could be translation or metadata
                    data_json["translations"][key] = val
            
            # Handle audio copying & renaming
            orig_audio_path = inv.get('audio')
            if orig_audio_path:
                # Strip leading slash if present
                clean_orig_path = orig_audio_path.lstrip('/')
                src_audio_full = os.path.join(public_dir, clean_orig_path)
                
                if os.path.exists(src_audio_full):
                    _, ext = os.path.splitext(clean_orig_path)
                    if not ext:
                        ext = '.mp3'
                        
                    # Target audio file name: {id}_{english_name}_{reciter}_{version}{ext}
                    reciter = "default"
                    version = "1"
                    dest_audio_filename = f"{inv_id}_{sanitized_inv_name}_{reciter}_{version}{ext}"
                    dest_audio_full = os.path.join(inv_folder_path, dest_audio_filename)
                    
                    # Copy audio file
                    shutil.copy2(src_audio_full, dest_audio_full)
                    
                    # Add to data_json['audio']
                    data_json["audio"].append({
                        "reciter": reciter,
                        "version": version,
                        "filename": dest_audio_filename,
                        "path": f"/invocations/{inv_folder_name}/{dest_audio_filename}"
                    })
                else:
                    print(f"Warning: Audio file {src_audio_full} for invocation {inv_id} not found.")
            
            # Save data.json inside the invocation folder
            data_json_path = os.path.join(inv_folder_path, 'data.json')
            with open(data_json_path, 'w', encoding='utf-8') as df:
                json.dump(data_json, df, ensure_ascii=False, indent=2)
                
        # Save playlist json
        playlist_data = {
            "id": chapter_id,
            "name": chapter_name,
            "invocations": playlist_invocations
        }
        with open(playlist_filepath, 'w', encoding='utf-8') as pf:
            json.dump(playlist_data, pf, ensure_ascii=False, indent=2)
            
    print("Alhamdulillah, audio assets prepared successfully.")

if __name__ == "__main__":
    prepare_assets()
