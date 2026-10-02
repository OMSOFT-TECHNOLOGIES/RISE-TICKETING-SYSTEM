import React from 'react';
import { Loader2, Shield } from 'lucide-react';
import { BiometricCapture } from './BiometricCapture';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import type { PassengerBookingFormValues } from './PassengerBookingFormFields';

interface BiometricPassengerBookingPanelProps {
  values: PassengerBookingFormValues;
  onChange: (updates: Partial<PassengerBookingFormValues>) => void;
  idPrefix?: string;
  phoneLookup?: boolean;
  profileFound?: boolean;
  duplicateOnTrip?: boolean;
  showSeatCount?: boolean;
  maxSeats?: number;
}

export function BiometricPassengerBookingPanel({
  values,
  onChange,
  idPrefix = 'bio',
  phoneLookup = false,
  profileFound = false,
  duplicateOnTrip = false,
  showSeatCount = false,
  maxSeats = 99,
}: BiometricPassengerBookingPanelProps) {
  const needsIdentityFields = !profileFound || !values.name?.trim();

  return (
    <div className="space-y-6">
      <p className="text-sm text-muted-foreground">
        Scan or enroll the passenger&apos;s biometric, then link their phone number. Profile details
        load automatically when the passenger is already registered.
      </p>

      <BiometricCapture
        label="Passenger biometric"
        subjectName={values.name || values.phone || 'Passenger'}
        value={values.biometricReference || undefined}
        onChange={(ref) => onChange({ biometricReference: ref ?? '' })}
        required
      />

      <div className="space-y-2">
        <Label htmlFor={`${idPrefix}-phone`}>
          Phone to link booking <span className="text-red-500">*</span>
        </Label>
        <div className="relative">
          <Input
            id={`${idPrefix}-phone`}
            value={values.phone}
            onChange={(e) => onChange({ phone: e.target.value })}
            placeholder="+233 XX XXX XXXX"
          />
          {phoneLookup && (
            <Loader2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-muted-foreground" />
          )}
        </div>
        {profileFound && !phoneLookup && !duplicateOnTrip && (
          <p className="text-xs text-[#193cb8]">Registered passenger — details loaded from profile</p>
        )}
        {duplicateOnTrip && !phoneLookup && (
          <p className="text-xs text-red-600">This phone number is already booked on this trip</p>
        )}
      </div>

      {profileFound && values.name ? (
        <div className="rounded-md border bg-muted/30 px-3 py-2 text-sm">
          <p className="text-xs text-muted-foreground">Passenger</p>
          <p className="font-medium">{values.name}</p>
        </div>
      ) : null}

      {needsIdentityFields && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor={`${idPrefix}-name`}>
              Full name <span className="text-red-500">*</span>
            </Label>
            <Input
              id={`${idPrefix}-name`}
              value={values.name}
              onChange={(e) => onChange({ name: e.target.value })}
              placeholder="Passenger name"
            />
          </div>
          <div className="space-y-2 sm:col-span-2 rounded-lg border border-red-100 bg-red-50/40 p-4">
            <div className="flex items-center gap-2 text-red-700 font-medium text-sm">
              <Shield className="h-4 w-4" />
              Emergency contact (new passengers)
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-3">
              <div className="space-y-2">
                <Label htmlFor={`${idPrefix}-ec-name`}>Contact name *</Label>
                <Input
                  id={`${idPrefix}-ec-name`}
                  value={values.emergencyContactName}
                  onChange={(e) => onChange({ emergencyContactName: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor={`${idPrefix}-ec-phone`}>Contact phone *</Label>
                <Input
                  id={`${idPrefix}-ec-phone`}
                  value={values.emergencyContactPhone}
                  onChange={(e) => onChange({ emergencyContactPhone: e.target.value })}
                />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor={`${idPrefix}-ec-rel`}>Relationship *</Label>
                <Input
                  id={`${idPrefix}-ec-rel`}
                  value={values.emergencyContactRelationship}
                  onChange={(e) => onChange({ emergencyContactRelationship: e.target.value })}
                  placeholder="e.g. parent, spouse"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {showSeatCount && (
        <div className="space-y-2 max-w-xs">
          <Label htmlFor={`${idPrefix}-seats`}>Number of seats</Label>
          <Input
            id={`${idPrefix}-seats`}
            type="number"
            min={1}
            max={Math.max(1, maxSeats)}
            value={values.seats}
            onChange={(e) => {
              const parsed = parseInt(e.target.value, 10);
              const capped = Number.isNaN(parsed)
                ? 1
                : Math.min(Math.max(1, parsed), Math.max(1, maxSeats));
              onChange({ seats: capped });
            }}
          />
        </div>
      )}
    </div>
  );
}
