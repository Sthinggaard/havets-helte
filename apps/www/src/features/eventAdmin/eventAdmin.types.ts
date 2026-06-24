// Shared admin model for the three legacy "events"-collection variants:
// vagter (timed shifts), opgaver (tasks), and arrangementer (events). They all
// persist to the same Firestore `events` collection and share one form, keyed
// by `type`. Mirrors the legacy admin.html EVENT_TYPES config and doc shape.

export type EventType = 'timed' | 'task' | 'event';
export type EventSection = 'vagter' | 'opgaver' | 'arrangementer';
export type SlotKind = 'volunteer' | 'attend' | 'paid';

export interface EventSlot {
  id: string;
  label: string;
  role: string;
  // For timed (vagt) slots this is a "HH:MM–HH:MM" time range; for the other
  // types it is a free-text detail note (e.g. "5 spejdere pr. patrulje").
  sublabel: string;
  capacity: number; // 0 means unlimited
  kind: SlotKind;
  price: number;
  groupSize: number;
  groupMin: number;
  groupMax: number;
  minAge: number;
  requiresAdult: boolean;
}

export interface AdminEvent {
  id: string;
  title: string;
  description: string;
  dateText: string;
  location: string;
  locationLat: number | null;
  locationLng: number | null;
  type: EventType;
  active: boolean;
  paymentUrl: string;
  cancelDeadlineDays: number;
  imageUrl: string;
  slots: EventSlot[];
  createdAt?: number;
  updatedAt?: number;
}

export interface EventTypeConfig {
  section: EventSection;
  type: EventType;
  title: string;
  newLabel: string;
  formNew: string;
  formEdit: string;
  saveLabel: string;
  empty: string;
  titleError: string;
  // vagter slots use a strict start–end time picker; the others use free text.
  timedSlots: boolean;
  // Only arrangementer let a slot vary participation (Frivillig/Tilmeld/Betalt)
  // and expose the payment section (MobilePay link + cancellation deadline).
  showKindPicker: boolean;
  showPayment: boolean;
}
