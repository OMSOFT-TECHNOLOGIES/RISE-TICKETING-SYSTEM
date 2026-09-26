import React, { useEffect, useState } from 'react';
import { Film, ImageIcon, Loader2 } from 'lucide-react';
import { incidentApi } from '../../utils/api';
import {
  incidentEvidenceFileName,
  incidentEvidenceKind,
} from '../utils/incidentEvidence';

interface IncidentEvidenceGalleryProps {
  incidentId: string;
  files: string[];
}

type PreviewMode = 'loading' | 'image' | 'video' | 'unsupported' | 'error';

function EvidencePreview({
  incidentId,
  storedPath,
  fileName,
}: {
  incidentId: string;
  storedPath: string;
  fileName: string;
}) {
  const [mode, setMode] = useState<PreviewMode>('loading');
  const [objectUrl, setObjectUrl] = useState<string | null>(null);
  const [errorDetail, setErrorDetail] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    (async () => {
      try {
        const blob = await incidentApi.fetchEvidenceBlob(incidentId, storedPath);
        if (!active) return;

        const mime = blob.type || '';
        const url = URL.createObjectURL(blob);
        setObjectUrl(url);

        if (mime.startsWith('video/')) {
          setMode('video');
        } else if (mime.startsWith('image/')) {
          setMode('image');
        } else {
          const guessed = incidentEvidenceKind(storedPath);
          if (guessed === 'video') setMode('video');
          else if (guessed === 'image') setMode('image');
          else setMode('unsupported');
        }
      } catch (err) {
        if (!active) return;
        setMode('error');
        setErrorDetail(err instanceof Error ? err.message : 'Load failed');
      }
    })();

    return () => {
      active = false;
      setObjectUrl((prev) => {
        if (prev) URL.revokeObjectURL(prev);
        return null;
      });
    };
  }, [incidentId, storedPath]);

  if (mode === 'loading') {
    return (
      <div className="flex h-40 items-center justify-center rounded-lg border bg-muted/20">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (mode === 'error') {
    return (
      <div className="flex h-40 flex-col items-center justify-center gap-1 rounded-lg border border-dashed bg-muted/20 px-3 text-center text-xs text-muted-foreground">
        <span>Could not preview {fileName}</span>
        {errorDetail ? <span className="text-[10px] opacity-80">{errorDetail}</span> : null}
        <span className="text-[10px]">Re-upload the file if this case was created before media storage was enabled.</span>
      </div>
    );
  }

  if (mode === 'unsupported' || !objectUrl) {
    return (
      <div className="rounded-lg border p-3 text-xs text-muted-foreground">
        Preview not supported for this file type ({fileName}).
      </div>
    );
  }

  if (mode === 'video') {
    return (
      <video
        src={objectUrl}
        controls
        playsInline
        className="w-full max-h-64 rounded-lg border bg-black object-contain"
        preload="metadata"
      >
        <track kind="captions" />
      </video>
    );
  }

  return (
    <a href={objectUrl} target="_blank" rel="noopener noreferrer" className="block group">
      <img
        src={objectUrl}
        alt={fileName}
        className="w-full max-h-64 rounded-lg border object-contain bg-muted/20 group-hover:opacity-95 transition-opacity"
      />
    </a>
  );
}

export function IncidentEvidenceGallery({ incidentId, files }: IncidentEvidenceGalleryProps) {
  const normalized = files.filter((f) => f != null && String(f).trim().length > 0);

  if (!normalized.length) {
    return (
      <p className="text-sm text-muted-foreground rounded-lg border border-dashed p-4 bg-muted/10">
        No photos or videos attached to this case.
      </p>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      {normalized.map((storedPath) => {
        const fileName = incidentEvidenceFileName(storedPath);
        const kind = incidentEvidenceKind(storedPath);

        return (
          <div key={storedPath} className="space-y-2">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground min-w-0">
              {kind === 'video' ? (
                <Film className="h-3.5 w-3.5 shrink-0" />
              ) : (
                <ImageIcon className="h-3.5 w-3.5 shrink-0" />
              )}
              <span className="truncate font-medium text-foreground">{fileName}</span>
            </div>
            <EvidencePreview
              incidentId={incidentId}
              storedPath={storedPath}
              fileName={fileName}
            />
          </div>
        );
      })}
    </div>
  );
}
