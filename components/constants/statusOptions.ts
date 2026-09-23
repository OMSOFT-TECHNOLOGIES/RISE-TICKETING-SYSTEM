type StatusOption = { value: string; label: string; color: string };

export const statusOptions: Record<string, StatusOption[]> = {
  trip: [
    { value: 'booking', label: 'Booking', color: 'blue' },
    { value: 'scheduled', label: 'Scheduled', color: 'blue' },
    { value: 'on_road', label: 'On Road', color: 'yellow' },
    { value: 'arrived', label: 'Arrived', color: 'green' },
    { value: 'broken_down', label: 'Broken Down', color: 'red' },
    { value: 'rescheduled', label: 'Rescheduled', color: 'orange' },
    { value: 'offloaded', label: 'Offloaded', color: 'purple' },
    { value: 'full', label: 'Full', color: 'orange' },
  ],
  vehicle: [
    { value: 'active', label: 'Active', color: 'green' },
    { value: 'maintenance', label: 'Maintenance', color: 'yellow' },
    { value: 'inactive', label: 'Inactive', color: 'gray' },
    { value: 'out_of_service', label: 'Out of Service', color: 'red' },
    { value: 'broken_down', label: 'Broken Down', color: 'red' },
  ],
  driver: [
    { value: 'active', label: 'Active', color: 'green' },
    { value: 'suspended', label: 'Suspended', color: 'red' },
    { value: 'on_leave', label: 'On Leave', color: 'yellow' },
    { value: 'terminated', label: 'Terminated', color: 'gray' },
    { value: 'training', label: 'Training', color: 'blue' },
  ],
  station: [
    { value: 'active', label: 'Active', color: 'green' },
    { value: 'inactive', label: 'Inactive', color: 'gray' },
    { value: 'maintenance', label: 'Maintenance', color: 'yellow' },
  ],
  incident: [
    { value: 'reported', label: 'Reported', color: 'purple' },
    { value: 'investigating', label: 'Investigating', color: 'blue' },
    { value: 'resolved', label: 'Resolved', color: 'green' },
    { value: 'closed', label: 'Closed', color: 'gray' },
  ],
  deathTrap: [
    { value: 'reported', label: 'Reported', color: 'blue' },
    { value: 'acknowledged', label: 'Acknowledged', color: 'yellow' },
    { value: 'in_progress', label: 'In Progress', color: 'orange' },
    { value: 'resolved', label: 'Resolved', color: 'green' },
    { value: 'escalated', label: 'Escalated', color: 'red' },
  ],
};

export const tripStatuses = statusOptions.trip;
export const speedStatuses = [
  { value: 'normal_speed', label: 'Normal Speed', color: 'green' },
  { value: 'over_speed', label: 'Over Speed', color: 'red' },
];
