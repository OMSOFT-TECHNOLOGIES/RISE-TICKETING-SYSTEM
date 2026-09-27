import React, { useEffect, useState } from 'react';
import { FileText, Film, ImageIcon, Loader2 } from 'lucide-react';
import { incidentClaimApi } from '../utils/api';
import {
  claimDocumentFileName,
  claimDocumentKind,
  type ClaimDocumentKind,
} from './claimDocuments';

type PreviewMode = 'loading' | 'image' | 'video' | 'pdf' | 'download' | 'error';

function DocumentPreview({
  claimId,
  storedPath,
  fileName,
}: {
  claimId: string;
  storedPath: string;
  fileName: string;
}) {
  const [mode, setMode] = useState<PreviewMode>('loading');
  const [objectUrl, setObjectUrl] = useState<string | null>(null);
  const [errorDetail, setErrorDetail] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    const kind = claimDocumentKind(storedPath);

    (async () => {
      try {
        const blob = await incidentClaimApi.fetchDocumentBlob(claimId, storedPath);
        if (!active) return;

        const mime = blob.type || '';
        const url = URL.createObjectURL(blob);
        setObjectUrl(url);

        if (mime.startsWith('video/') || kind === 'video') {
          setMode('video');
        } else if (mime.startsWith('image/') || kind === 'image') {
          setMode('image');
        } else if (mime.includes('pdf') || kind === 'pdf') {
          setMode('pdf');
        } else {
          setMode('download');
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
  }, [claimId, storedPath]);

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
        <span>Could not load {fileName}</span>
        {errorDetail ? <span className="text-[10px] opacity-80">{errorDetail}</span> : null}
      </div>
    );
  }

  if (!objectUrl) {
    return null;
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

  if (mode === 'pdf') {
    return (
      <iframe
        title={fileName}
        src={objectUrl}
        className="w-full h-64 rounded-lg border bg-muted/10"
      />
    );
  }

  if (mode === 'image') {
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

  return (
    <a
      href={objectUrl}
      download={fileName}
      className="flex items-center gap-2 rounded-lg border p-3 text-sm text-[#193cb8] hover:bg-muted/30"
    >
      <FileText className="h-4 w-4 shrink-0" />
      Download {fileName}
    </a>
  );
}

function KindIcon({ kind }: { kind: ClaimDocumentKind }) {
  if (kind === 'video') return <Film className="h-3.5 w-3.5 shrink-0" />;
  if (kind === 'pdf' || kind === 'other') return <FileText className="h-3.5 w-3.5 shrink-0" />;
  return <ImageIcon className="h-3.5 w-3.5 shrink-0" />;
}

export function ClaimDocumentGallery({
  claimId,
  title,
  files,
  emptyMessage,
}: {
  claimId: string;
  title: string;
  files: string[];
  emptyMessage: string;
}) {
  const normalized = files.filter((f) => f != null && String(f).trim().length > 0);

  return (
    <div className="space-y-3">
      <p className="text-sm font-medium">{title}</p>
      {!normalized.length ? (
        <p className="text-sm text-muted-foreground rounded-lg border border-dashed p-3 bg-muted/10">
          {emptyMessage}
        </p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {normalized.map((storedPath) => {
            const fileName = claimDocumentFileName(storedPath);
            const kind = claimDocumentKind(storedPath);
            return (
              <div key={storedPath} className="space-y-2">
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground min-w-0">
                  <KindIcon kind={kind} />
                  <span className="truncate font-medium text-foreground">{fileName}</span>
                </div>
                <DocumentPreview claimId={claimId} storedPath={storedPath} fileName={fileName} />
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
