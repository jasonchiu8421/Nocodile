
from pathlib import Path
file_path = "abc.txt"
exists = ["abc.txt", "abc(2).txt", "abc(3).txt"]

count = 2
stem, ext = file_path.split(".")
while file_path in exists:
            file_path = f"{stem}({count}).{ext}"
            count += 1
print(file_path)