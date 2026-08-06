'use client';

import { useState, useEffect, useRef } from 'react';
import { X, Plus } from 'lucide-react';

interface Props {
  value: string[];
  onChange: (tags: string[]) => void;
}

export default function TagManager({ value, onChange }: Props) {
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [input, setInput] = useState('');
  const [showDrop, setShowDrop] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetch('/api/admin/tags')
      .then(r => r.json())
      .then((data: string[]) => setSuggestions(data))
      .catch(() => {});
  }, []);

  const addTag = (tag: string) => {
    const t = tag.trim();
    if (!t || value.includes(t)) return;
    onChange([...value, t]);
    setInput('');
    setShowDrop(false);
  };

  const removeTag = (tag: string) => onChange(value.filter(t => t !== tag));

  const filtered = suggestions.filter(s =>
    !value.includes(s) && s.toLowerCase().includes(input.toLowerCase())
  );

  return (
    <div>
      <div className="flex flex-wrap gap-2 mb-2">
        {value.map(tag => (
          <span key={tag} className="flex items-center gap-1 bg-blue-900/50 text-blue-300 text-sm px-2.5 py-1 rounded-full">
            {tag}
            <button type="button" onClick={() => removeTag(tag)} className="hover:text-white">
              <X size={13} />
            </button>
          </span>
        ))}
      </div>
      <div className="relative">
        <div className="flex gap-2">
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={e => { setInput(e.target.value); setShowDrop(true); }}
            onFocus={() => setShowDrop(true)}
            onBlur={() => setTimeout(() => setShowDrop(false), 150)}
            onKeyDown={e => {
              if (e.key === 'Enter') { e.preventDefault(); addTag(input); }
            }}
            placeholder="輸入標籤後按 Enter"
            className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
          />
          <button
            type="button"
            onClick={() => addTag(input)}
            className="px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-gray-400 hover:text-white hover:border-blue-500 transition-colors"
          >
            <Plus size={16} />
          </button>
        </div>
        {showDrop && filtered.length > 0 && (
          <div className="absolute z-20 w-full mt-1 bg-gray-800 border border-gray-700 rounded-lg shadow-xl max-h-48 overflow-y-auto">
            {filtered.map(s => (
              <button
                key={s}
                type="button"
                onMouseDown={() => addTag(s)}
                className="w-full text-left px-3 py-2 text-sm text-gray-300 hover:bg-gray-700 hover:text-white transition-colors"
              >
                {s}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
