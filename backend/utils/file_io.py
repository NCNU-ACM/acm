import frontmatter
import yaml
import os
from datetime import datetime
from typing import Optional


CONTENT_ROOT = os.path.join(os.path.dirname(__file__), "..", "..", "acm-website", "content")


def get_collection_path(collection: str, semester: Optional[str] = None) -> str:
    if collection == "members" and semester:
        return os.path.join(CONTENT_ROOT, collection, semester)
    return os.path.join(CONTENT_ROOT, collection)


def generate_timestamp_id() -> str:
    return datetime.now().strftime("%Y%m%d%H%M%S")


def list_entries(collection: str, semester: Optional[str] = None) -> list:
    folder = get_collection_path(collection, semester)
    if not os.path.exists(folder):
        return []

    results = []
    for filename in os.listdir(folder):
        if not filename.endswith('.md'):
            continue
        filepath = os.path.join(folder, filename)
        try:
            with open(filepath, 'r', encoding='utf-8') as f:
                text = f.read()
            if text.startswith('---'):
                parts = text.split('---', 2)
                if len(parts) >= 3:
                    metadata = yaml.safe_load(parts[1])
                    if metadata:
                        entry = dict(metadata)
                        entry['id'] = filename[:-3]
                        if semester:
                            entry['semester'] = semester
                        results.append(entry)
        except Exception as e:
            print(f"Error loading {filepath}: {e}")
            continue

    return results


def read_entry(collection: str, entry_id: str, semester: Optional[str] = None) -> Optional[dict]:
    folder = get_collection_path(collection, semester)
    filepath = os.path.join(folder, f"{entry_id}.md")
    if not os.path.exists(filepath):
        return None

    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            text = f.read()
        if text.startswith('---'):
            parts = text.split('---', 2)
            if len(parts) >= 3:
                metadata = yaml.safe_load(parts[1])
                if metadata:
                    entry = dict(metadata)
                    entry['id'] = entry_id
                    if semester:
                        entry['semester'] = semester
                    return entry
        return None
    except Exception as e:
        print(f"Error loading {filepath}: {e}")
        return None


def write_entry(collection: str, entry_id: str, data: dict, semester: Optional[str] = None) -> str:
    folder = get_collection_path(collection, semester)
    os.makedirs(folder, exist_ok=True)
    filepath = os.path.join(folder, f"{entry_id}.md")

    clean_data = {k: v for k, v in data.items() if v is not None}

    post = frontmatter.Post("")
    post.metadata = clean_data

    output = frontmatter.dumps(post)

    with open(filepath, "w", encoding="utf-8") as f:
        f.write(output)

    return filepath


def delete_entry(collection: str, entry_id: str, semester: Optional[str] = None) -> bool:
    folder = get_collection_path(collection, semester)
    filepath = os.path.join(folder, f"{entry_id}.md")
    if not os.path.exists(filepath):
        return False

    os.remove(filepath)

    if os.path.exists(folder) and not os.listdir(folder):
        os.rmdir(folder)

    return True


def list_semesters(collection: str) -> list[str]:
    folder = get_collection_path(collection)
    if not os.path.exists(folder):
        return []
    return [d for d in os.listdir(folder) if os.path.isdir(os.path.join(folder, d))]