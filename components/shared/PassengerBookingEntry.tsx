import React from 'react';
import { Fingerprint, FileText } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import {
  PassengerBookingFormFields,
  type PassengerBookingFormValues,
} from './PassengerBookingFormFields';
import { BiometricPassengerBookingPanel } from './BiometricPassengerBookingPanel';

export type PassengerBookingMethod = 'manual' | 'biometric';

interface PassengerBookingEntryProps {
  method: PassengerBookingMethod;
  onMethodChange: (method: PassengerBookingMethod) => void;
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
  compactWhenProfileFound?: boolean;
  fareReadOnly?: boolean;
  /** Use pill segmented switcher (e.g. Add passengers modal) */
  tabsVariant?: 'default' | 'segment';
}

export function PassengerBookingEntry({
  method,
  onMethodChange,
  values,
  onChange,
  idPrefix = 'pb',
  showSeatCount,
  maxSeats,
  showSeatNumber,
  showRoutePoints,
  showFare,
  showNotes,
  phoneLookup,
  profileFound,
  duplicateOnTrip,
  compactWhenProfileFound,
  fareReadOnly,
  tabsVariant = 'default',
}: PassengerBookingEntryProps) {
  const handleMethodChange = (next: string) => {
    const m = next === 'biometric' ? 'biometric' : 'manual';
    onMethodChange(m);
    if (m === 'manual') {
      onChange({ biometricReference: '' });
    }
  };

  const tabsList = (
    <TabsList className="grid w-full grid-cols-2 mb-4">
      <TabsTrigger
        value="manual"
        className={tabsVariant === 'segment' ? 'justify-center px-4' : 'gap-2'}
      >
        {tabsVariant === 'default' ? <FileText className="h-4 w-4" /> : null}
        Manual
      </TabsTrigger>
      <TabsTrigger
        value="biometric"
        className={tabsVariant === 'segment' ? 'justify-center px-4' : 'gap-2'}
      >
        {tabsVariant === 'default' ? <Fingerprint className="h-4 w-4" /> : null}
        Biometric
      </TabsTrigger>
    </TabsList>
  );

  return (
    <Tabs value={method} onValueChange={handleMethodChange} className="w-full">
      {tabsVariant === 'segment' ? (
        <div className="rise-segment-tabs w-full">{tabsList}</div>
      ) : (
        tabsList
      )}

      <TabsContent value="manual" className="mt-0">
        <PassengerBookingFormFields
          idPrefix={idPrefix}
          values={values}
          onChange={onChange}
          showSeatCount={showSeatCount}
          maxSeats={maxSeats}
          showSeatNumber={showSeatNumber}
          showRoutePoints={showRoutePoints}
          showFare={showFare}
          showNotes={showNotes}
          phoneLookup={phoneLookup}
          profileFound={profileFound}
          duplicateOnTrip={duplicateOnTrip}
          compactWhenProfileFound={compactWhenProfileFound}
          fareReadOnly={fareReadOnly}
        />
      </TabsContent>

      <TabsContent value="biometric" className="mt-0">
        <BiometricPassengerBookingPanel
          idPrefix={`${idPrefix}-bio`}
          values={values}
          onChange={onChange}
          phoneLookup={phoneLookup}
          profileFound={profileFound}
          duplicateOnTrip={duplicateOnTrip}
          showSeatCount={showSeatCount}
          maxSeats={maxSeats}
        />
      </TabsContent>
    </Tabs>
  );
}
