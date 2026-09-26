import { API_BASE_URL } from '../../utils/api/client';

export type IncidentEvidenceKind = 'image' | 'video' | 'other';

export function incidentEvidenceFileName(storedPath: string): string {
  const normalized = storedPath.replace(/\\/g, '/');
  const parts = normalized.split('/');
  return parts[parts.length - 1] ?? storedPath;
}

export function incidentEvidenceKind(storedPath: string): IncidentEvidenceKind {
  const name = incidentEvidenceFileName(storedPath).toLowerCase();
  if (/\.(jpe?g|png|gif|webp|bmp|heic|heif)$/i.test(name)) return 'image';
  if (/\.(mp4|mov|webm|m4v|3gp|avi|mkv)$/i.test(name)) return 'video';
  return 'other';
}

export function incidentEvidenceDownloadUrl(incidentId: string, storedPath: string): string {
  const fileName = incidentEvidenceFileName(storedPath);
  const base = API_BASE_URL.replace(/\/$/, '');
  const id = encodeURIComponent(incidentId);
  const file = encodeURIComponent(fileName);
  return `${base}/api/incidents/${id}/evidence?file=${file}`;
}
