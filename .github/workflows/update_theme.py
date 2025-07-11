import json
import os
import subprocess


def get_last_modified_date(directory):
    result = subprocess.run(
        ["stat", "-c", "%y", directory], capture_output=True, text=True
    )
    return result.stdout.split(" ")[0]


def update_theme_json(file_path):
    try:
        with open(file_path, "r") as f:
            content_before = f.read()
            f.seek(0)
            data = json.load(f)

        directory = os.path.dirname(file_path)
        last_modified = get_last_modified_date(directory)
        data["updatedAt"] = last_modified

        with open(file_path, "w") as f:
            json.dump(data, f, indent=2)
            f.truncate()
            content_after = f.read()

        if content_before == content_after:
            print("::set-output name=updated::false")
        else:
            print("::set-output name=updated::true")

        print(f"Updated {file_path} with date {last_modified}")

    except Exception as e:
        print(f"Error processing {file_path}: {e}")
        print("::set-output name=updated::false")


files = subprocess.run(
    ["find", ".", "-name", "theme.json", "-print0"], capture_output=True, text=True
).stdout.split("\0")

for file in filter(None, files):
    update_theme_json(file)
