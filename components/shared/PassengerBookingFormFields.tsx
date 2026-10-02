import React from 'react';
import { Loader2, Shield } from 'lucide-react';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';

export interface PassengerBookingFormValues {
  name: string;
  phone: string;
  email: string;
  seats: number;
  seatNumber: string;
  boardingPoint: string;
  dropoffPoint: string;
  fare: string;
  notes: string;
  emergencyContactName: string;
  emergencyContactPhone: string;
  emergencyContactRelationship: string;
  biometricReference?: string;
}

export const EMPTY_PASSENGER_BOOKING_FORM: PassengerBookingFormValues = {
  name: '',
  phone: '',
  email: '',
  seats: 1,
  seatNumber: '',
  boardingPoint: '',
  dropoffPoint: '',
  fare: '',
  notes: '',
  emergencyContactName: '',
  emergencyContactPhone: '',
  emergencyContactRelationship: '',
  biometricReference: '',
};

const RELATIONSHIP_OPTIONS = [
  { value: 'parent', label: 'Parent' },
  { value: 'spouse', label: 'Spouse' },
  { value: 'child', label: 'Child' },
  { value: 'sibling', label: 'Sibling' },
  { value: 'friend', label: 'Friend' },
  { value: 'guardian', label: 'Guardian' },
  { value: 'relative', label: 'Other Relative' },
  { value: 'colleague', label: 'Colleague' },
  { value: 'other', label: 'Other' },
];

interface PassengerBookingFormFieldsProps {
  values: PassengerBookingFormValues;
  onChange: (updates: Partial<PassengerBookingFormValues>) => void;
  idPrefix?: string;
  showSeatCount?: boolean;
  maxSeats?: number;
  showSeatNumber?: boolean;
  showRoutePoints?: boolean;
  showFare?: boolean;
  showNotes?: boolean;
  phoneLookup?: boolean;
  profileFound?: boolean;
  duplicateOnTrip?: boolean;
  /** Hide full registration fields when returning passenger is recognized */
  compactWhenProfileFound?: boolean;
  /** Trip fare from schedule — read-only when set from selected trip */
  fareReadOnly?: boolean;
}

export function PassengerBookingFormFields({
  values,
  onChange,
  idPrefix = 'pb',
  showSeatCount = false,
  maxSeats = 99,
  showSeatNumber = false,
  showRoutePoints = false,
  showFare = false,
  showNotes = false,
  phoneLookup = false,
  profileFound = false,
  duplicateOnTrip = false,
  compactWhenProfileFound = true,
  fareReadOnly = false,
}: PassengerBookingFormFieldsProps) {
  const hasEmergencyOnFile = Boolean(
    values.emergencyContactName?.trim() &&
      values.emergencyContactPhone?.trim() &&
      values.emergencyContactRelationship?.trim()
  );
  const compact =
    compactWhenProfileFound && profileFound && hasEmergencyOnFile && !phoneLookup;
  const showEmergencySection = !profileFound || !hasEmergencyOnFile || !compactWhenProfileFound;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor={`${idPrefix}-phone`}>
            Phone <span className="text-red-500">*</span>
          </Label>
          <div className="relative">
            <Input
              id={`${idPrefix}-phone`}
              value={values.phone}
              onChange={(e) => onChange({ phone: e.target.value })}
              placeholder="+233 XX XXX XXXX"
              required
            />
            {phoneLookup && (
              <Loader2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-muted-foreground" />
            )}
          </div>
          {profileFound && !phoneLookup && !duplicateOnTrip && (
            <p className="text-xs text-[#193cb8]">
              Registered passenger — details filled from profile
            </p>
          )}
          {duplicateOnTrip && !phoneLookup && (
            <p className="text-xs text-red-600">
              This phone number is already booked on this trip
            </p>
          )}
        </div>
        {compact ? (
          <div className="space-y-1 sm:col-span-2 rounded-md border bg-muted/30 px-3 py-2">
            <p className="text-xs text-muted-foreground">Passenger</p>
            <p className="font-medium">{values.name || '—'}</p>
            {values.email ? (
              <p className="text-xs text-muted-foreground">{values.email}</p>
            ) : null}
          </div>
        ) : (
          <div className="space-y-2">
            <Label htmlFor={`${idPrefix}-name`}>
              Full name <span className="text-red-500">*</span>
            </Label>
            <Input
              id={`${idPrefix}-name`}
              value={values.name}
              onChange={(e) => onChange({ name: e.target.value })}
              placeholder="Passenger name"
              required
            />
          </div>
        )}
        {!compact && (
          <div className="space-y-2">
            <Label htmlFor={`${idPrefix}-email`}>Email</Label>
            <Input
              id={`${idPrefix}-email`}
              type="email"
              value={values.email}
              onChange={(e) => onChange({ email: e.target.value })}
              placeholder="passenger@email.com"
            />
          </div>
        )}
        {showSeatCount && (
          <div className="space-y-2">
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
            {maxSeats > 0 ? (
              <p className="text-xs text-muted-foreground">
                Up to {maxSeats} seat{maxSeats === 1 ? '' : 's'} available on this trip
              </p>
            ) : null}
          </div>
        )}
        {showSeatNumber && (
          <div className="space-y-2">
            <Label htmlFor={`${idPrefix}-seat-number`}>Seat number</Label>
            <Input
              id={`${idPrefix}-seat-number`}
              value={values.seatNumber}
              onChange={(e) => onChange({ seatNumber: e.target.value })}
              placeholder="e.g. A12"
            />
          </div>
        )}
        {showRoutePoints && (
          <>
            <div className="space-y-2">
              <Label htmlFor={`${idPrefix}-boarding`}>Boarding point</Label>
              <Input
                id={`${idPrefix}-boarding`}
                value={values.boardingPoint}
                onChange={(e) => onChange({ boardingPoint: e.target.value })}
                placeholder="Boarding location"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor={`${idPrefix}-dropoff`}>Drop-off point</Label>
              <Input
                id={`${idPrefix}-dropoff`}
                value={values.dropoffPoint}
                onChange={(e) => onChange({ dropoffPoint: e.target.value })}
                placeholder="Destination stop"
              />
            </div>
          </>
        )}
        {showFare && (
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor={`${idPrefix}-fare`}>Fare (₵)</Label>
            <Input
              id={`${idPrefix}-fare`}
              type="number"
              value={values.fare}
              onChange={(e) => onChange({ fare: e.target.value })}
              placeholder="45.00"
              readOnly={fareReadOnly}
              className={fareReadOnly ? 'bg-muted/60' : undefined}
            />
            {fareReadOnly && values.fare ? (
              <p className="text-xs text-muted-foreground">
                Fare from trip schedule (set when the trip was created)
              </p>
            ) : null}
          </div>
        )}
      </div>

      {showEmergencySection && (
      <div className="space-y-4 rounded-lg border border-red-100 bg-red-50/40 p-4">
        <div className="flex items-center gap-2 text-red-700 font-medium">
          <Shield className="h-4 w-4" />
          Emergency contact
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor={`${idPrefix}-ec-name`}>
              Contact name <span className="text-red-500">*</span>
            </Label>
            <Input
              id={`${idPrefix}-ec-name`}
              value={values.emergencyContactName}
              onChange={(e) => onChange({ emergencyContactName: e.target.value })}
              placeholder="Any name (letters, numbers, titles allowed)"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor={`${idPrefix}-ec-phone`}>
              Contact phone <span className="text-red-500">*</span>
            </Label>
            <Input
              id={`${idPrefix}-ec-phone`}
              value={values.emergencyContactPhone}
              onChange={(e) => onChange({ emergencyContactPhone: e.target.value })}
              placeholder="+233 XX XXX XXXX"
              required
            />
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor={`${idPrefix}-ec-rel`}>
              Relationship <span className="text-red-500">*</span>
            </Label>
            <Input
              id={`${idPrefix}-ec-rel`}
              list={`${idPrefix}-ec-rel-list`}
              value={values.emergencyContactRelationship}
              onChange={(e) => onChange({ emergencyContactRelationship: e.target.value })}
              placeholder="e.g. parent, spouse, friend"
            />
            <datalist id={`${idPrefix}-ec-rel-list`}>
              {RELATIONSHIP_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </datalist>
          </div>
        </div>
      </div>
      )}

      {showNotes && (
        <div className="space-y-2">
          <Label htmlFor={`${idPrefix}-notes`}>Notes (optional)</Label>
          <Textarea
            id={`${idPrefix}-notes`}
            value={values.notes}
            onChange={(e) => onChange({ notes: e.target.value })}
            placeholder="Special requirements or notes"
            rows={3}
          />
        </div>
      )}
    </div>
  );
}
