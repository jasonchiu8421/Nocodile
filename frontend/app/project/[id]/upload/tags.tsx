import { X } from "lucide-react";

interface TagsProps {
  classes: string[];
  addClass: (tag: string) => void;
  removeClass: (index: number) => void;
}

export default function Tags({ classes, addClass, removeClass }: TagsProps) {
  return (
    <div
      id="classes"
      className="flex flex-col border p-4 rounded-md border-gray-300 gap-4"
    >
      <h2>Tags</h2>
      <hr />
      <div className="flex flex-row gap-2 overflow-x-auto">
        {classes.map((cls: string, index: number) => (
          <div key={index} className="border border-gray-300 p-2 min-w-16">
            <div style={{ display: "inline" }}>{cls}</div>
            <button
              style={{ display: "inline", cursor: "pointer" }}
              onClick={() => removeClass(index)}
            >
              <X />
            </button>
          </div>
        ))}
      </div>
      <div>
        <input
          type="text"
          placeholder="Add new tag"
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              const newTag = (e.target as HTMLInputElement).value
                .trim()
                .toLowerCase();
              if (newTag && !classes.includes(newTag)) {
                addClass(newTag);
                (e.target as HTMLInputElement).value = "";
              } else if (classes.includes(newTag)) {
                alert("Tag already exists!");
              }
            }
          }}
        />
      </div>
    </div>
  );
}