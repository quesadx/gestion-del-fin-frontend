import { useState, useRef } from 'react';
import { ImagePlus, X } from 'lucide-react';

interface FileInputProps {
  value: string;
  onChange: (dataUrl: string) => void;
  accept?: string;
  label?: string;
}

export function FileInput({
  value,
  onChange,
  accept = 'image/*',
  label = 'UPLOAD IMAGE',
}: FileInputProps) {
  const [preview, setPreview] = useState<string>(value || '');
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      setPreview(dataUrl);
      onChange(dataUrl);
    };
    reader.readAsDataURL(file);
  };

  const handleClear = () => {
    setPreview('');
    onChange('');
    if (inputRef.current) {
      inputRef.current.value = '';
    }
  };

  return (
    <div>
      <label className="block mb-1.5 text-[10px] tracking-[0.2em] text-zinc-500 font-mono-data uppercase">
        {label} //
      </label>
      {preview ? (
        <div className="relative inline-block">
          <img
            src={preview}
            alt="Preview"
            className="max-h-32 max-w-full border border-zinc-700 rounded-sm"
          />
          <button
            type="button"
            onClick={handleClear}
            className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition-colors"
          >
            <X size={10} />
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="flex items-center gap-2 px-4 py-3 border border-zinc-700 text-zinc-400 hover:text-zinc-200 hover:border-zinc-500 transition-colors rounded-sm font-mono-data text-[11px]"
        >
          <ImagePlus size={14} />
          {label}
        </button>
      )}
      <input ref={inputRef} type="file" accept={accept} onChange={handleFile} className="hidden" />
    </div>
  );
}
