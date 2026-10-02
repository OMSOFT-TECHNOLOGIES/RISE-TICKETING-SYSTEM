import React, { useState } from 'react';
import { AlertTriangle, CheckCircle } from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import {
  DEFAULT_HAZARD_FORM,
  calculatePriorityScore,
} from './DeathTrapReporting/constants';
import { ReportHazardDialog, type HazardReportForm } from './DeathTrapReporting/ReportHazardDialog';
import { deathTrapApi } from './utils/api/deathTraps';
import { notify } from './utils/notify';

export function PublicDeathTrapReportPage() {
  const [dialogOpen, setDialogOpen] = useState(true);
  const [submitted, setSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState<HazardReportForm>(DEFAULT_HAZARD_FORM);
  const [isLocationFromMap, setIsLocationFromMap] = useState(false);

  const priorityScore = calculatePriorityScore(
    formData.severityLevel,
    formData.affectedRoutes.length
  );

  const formatLocationFromMap = (location: { lat: number; lng: number; address?: string }) => {
    if (location.address) return location.address;
    return `Location at ${location.lat.toFixed(4)}, ${location.lng.toFixed(4)}`;
  };

  const handleLocationSelect = (location: { lat: number; lng: number; address?: string }) => {
    setFormData((prev) => ({
      ...prev,
      coordinates: { lat: location.lat, lng: location.lng },
      locationAddress: location.address || '',
      location: formatLocationFromMap(location),
    }));
    setIsLocationFromMap(true);
  };

  const handleFormChange = (updates: Partial<HazardReportForm>) => {
    setFormData((prev) => {
      const next = { ...prev, ...updates };
      if (updates.location !== undefined && isLocationFromMap && updates.location !== prev.location) {
        setIsLocationFromMap(false);
      }
      return next;
    });
  };

  const handleResetLocation = () => {
    setFormData((prev) => ({
      ...prev,
      location: '',
      coordinates: { lat: 0, lng: 0 },
      locationAddress: '',
    }));
    setIsLocationFromMap(false);
  };

  const handleSubmit = async (media: { photos: File[]; videos: File[] }) => {
    if (!formData.location || !formData.description) {
      notify.error('Please fill in all required fields');
      return;
    }
    if (formData.coordinates.lat === 0 && formData.coordinates.lng === 0) {
      notify.error('Please pin the hazard on the map or use current location');
      return;
    }

    setIsSubmitting(true);
    try {
      const form = new FormData();
      form.append('type', formData.type);
      form.append('location', formData.location);
      form.append('description', formData.description);
      form.append('severityLevel', formData.severityLevel);
      form.append('lat', String(formData.coordinates.lat));
      form.append('lng', String(formData.coordinates.lng));
      if (formData.affectedNotes.trim()) {
        form.append('affectedNotes', formData.affectedNotes.trim());
      }
      if (formData.reporterName?.trim()) {
        form.append('reporterName', formData.reporterName.trim());
      }
      if (formData.reporterPhone?.trim()) {
        form.append('reporterPhone', formData.reporterPhone.trim());
      }
      media.photos.forEach((file) => form.append('photos', file));
      media.videos.forEach((file) => form.append('videos', file));

      const response = await deathTrapApi.createPublic(form);
      if (response.success) {
        setDialogOpen(false);
        setSubmitted(true);
        setFormData(DEFAULT_HAZARD_FORM);
        setIsLocationFromMap(false);
      } else {
        notify.error(response.error || 'Failed to submit report');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-muted/40 to-background px-4 py-8">
      <div className="max-w-3xl mx-auto space-y-6">
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center rounded-full bg-red-50 border border-red-200 p-3">
            <AlertTriangle className="h-8 w-8 text-red-600" />
          </div>
          <h1 className="text-2xl font-semibold tracking-tight">Public hazard report</h1>
          <p className="text-sm text-muted-foreground max-w-lg mx-auto">
            Report death traps and road hazards for your community. No login required. Use your phone
            location or expand the map to pin the exact spot.
          </p>
        </div>

        {submitted ? (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-emerald-700">
                <CheckCircle className="h-5 w-5" />
                Report received
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm text-muted-foreground">
              <p>
                Thank you. Road safety teams will review your report. You may close this page or
                submit another hazard.
              </p>
              <Button
                className="bg-[#193cb8] hover:bg-[#152f94]"
                onClick={() => {
                  setSubmitted(false);
                  setDialogOpen(true);
                }}
              >
                Report another hazard
              </Button>
            </CardContent>
          </Card>
        ) : (
          <ReportHazardDialog
            open={dialogOpen}
            onOpenChange={setDialogOpen}
            form={formData}
            isLocationFromMap={isLocationFromMap}
            priorityScore={priorityScore}
            onFormChange={handleFormChange}
            onLocationSelect={handleLocationSelect}
            onResetLocation={handleResetLocation}
            onSubmit={(media) => void handleSubmit(media)}
            onCancel={() => {
              window.location.href = '/';
            }}
            publicMode
            isSubmitting={isSubmitting}
          />
        )}

        <p className="text-center text-xs text-muted-foreground">
          RISE · National Road Safety reporting
        </p>
      </div>
    </div>
  );
}
