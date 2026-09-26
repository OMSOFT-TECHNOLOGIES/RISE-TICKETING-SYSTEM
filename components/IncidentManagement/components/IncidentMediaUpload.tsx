import React, { useRef } from 'react';
import { ImagePlus, Video, X } from 'lucide-react';
import { Button } from '../../ui/button';
import { Label } from '../../ui/label';

interface IncidentMediaUploadProps {
  files: File[];
  onChange: (files: File[]) => void;
}

function formatSize(bytes: number): string {
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function IncidentMediaUpload({ files, onChange }: IncidentMediaUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  const addFiles = (list: FileList | null) => {
    if (!list?.length) return;
    const next = [...files];
    Array.from(list).forEach((file) => {
      const isMedia =
        file.type.startsWith('image/') ||
        file.type.startsWith('video/') ||
        /\.(jpe?g|png|webp|gif|mp4|mov|webm)$/i.test(file.name);
      if (isMedia && !next.some((f) => f.name === file.name && f.size === file.size)) {
        next.push(file);
      }
    });
    onChange(next.slice(0, 12));
  };

  const removeAt = (index: number) => {
    onChange(files.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-3">
      <Label>Photos &amp; videos (optional)</Label>
      <p className="text-xs text-muted-foreground">
        Attach scene evidence for insurance and emergency verification. Max 12 files.
      </p>
      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => inputRef.current?.click()}
        >
          <ImagePlus className="h-4 w-4 mr-2" />
          Add photos / videos
        </Button>
        <input
          ref={inputRef}
          type="file"
          accept="image/*,video/*,.mp4,.mov,.webm"
          multiple
          className="hidden"
          onChange={(e) => {
            addFiles(e.target.files);
            e.target.value = '';
          }}
        />
      </div>
      {files.length > 0 && (
        <ul className="space-y-2 rounded-lg border p-3 bg-muted/20">
          {files.map((file, index) => (
            <li key={`${file.name}-${file.size}`} className="flex items-center justify-between gap-2 text-sm">
              <span className="flex items-center gap-2 min-w-0">
                {file.type.startsWith('video/') ? (
                  <Video className="h-4 w-4 shrink-0 text-muted-foreground" />
                ) : (
                  <ImagePlus className="h-4 w-4 shrink-0 text-muted-foreground" />
                )}
                <span className="truncate">{file.name}</span>
                <span className="text-xs text-muted-foreground shrink-0">{formatSize(file.size)}</span>
              </span>
              <Button type="button" variant="ghost" size="sm" onClick={() => removeAt(index)}>
                <X className="h-4 w-4" />
              </Button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
