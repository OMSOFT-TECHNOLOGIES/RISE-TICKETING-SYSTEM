import { API_BASE_URL } from '../utils/api/client';

export type ClaimDocumentKind = 'image' | 'video' | 'pdf' | 'other';

export function claimDocumentFileName(storedPath: string): string {
  const normalized = storedPath.replace(/\\/g, '/');
  const parts = normalized.split('/');
  return parts[parts.length - 1] ?? storedPath;
}

export function claimDocumentKind(storedPath: string): ClaimDocumentKind {
  const name = claimDocumentFileName(storedPath).toLowerCase();
  if (/\.(jpe?g|png|gif|webp|bmp|heic|heif)$/i.test(name)) return 'image';
  if (/\.(mp4|mov|webm|m4v|3gp|avi|mkv)$/i.test(name)) return 'video';
  if (/\.pdf$/i.test(name)) return 'pdf';
  return 'other';
}

export function claimDocumentDownloadUrl(claimId: string, storedPath: string): string {
  const fileName = claimDocumentFileName(storedPath);
  const base = API_BASE_URL.replace(/\/$/, '');
  const id = encodeURIComponent(claimId);
  const file = encodeURIComponent(fileName);
  return `${base}/api/incident-claims/${id}/documents?file=${file}`;
}

export function guessClaimDocumentMime(storedPath: string): string {
  const name = claimDocumentFileName(storedPath).toLowerCase();
  if (/\.(jpe?g)$/.test(name)) return 'image/jpeg';
  if (/\.png$/.test(name)) return 'image/png';
  if (/\.gif$/.test(name)) return 'image/gif';
  if (/\.webp$/.test(name)) return 'image/webp';
  if (/\.pdf$/.test(name)) return 'application/pdf';
  if (/\.mp4$/.test(name)) return 'video/mp4';
  if (/\.webm$/.test(name)) return 'video/webm';
  if (/\.mov$/.test(name)) return 'video/quicktime';
  return 'application/octet-stream';
}
