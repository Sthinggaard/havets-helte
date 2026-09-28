// Shared admin model for the three legacy "events"-collection variants:
// vagter (timed shifts), opgaver (tasks), and arrangementer (events). They all
// persist to the same Firestore `events` collection and share one form, keyed
// by `type`. Mirrors the legacy admin.html EVENT_TYPES config and doc shape.

export type EventType = 'timed' | 'task' | 'event';
export type EventSection = 'vagter' | 'opgaver' | 'arrangementer';
export type SlotKind = 'volunteer' | 'attend' | 'paid';
export type SlotComponentType = 'task' | 'shift' | 'signup';
export type SignupRegistrationMode = 'local' | 'memberService';
export type SlotScheduleMode = 'fixed' | 'relative' | 'weekly' | 'biweekly';
export type SlotRelativeTo = 'event';

export interface EventSlot {
  id: string;
  // An arrangement can combine practical tasks and time-bound shifts. This
  // belongs to the slot, not the parent arrangement, so one arrangement can
  // coordinate both without splitting its signups across multiple records.
  componentType: SlotComponentType;
  // Shift periods in the same shift type share this id. Each period remains a
  // distinct signup slot, preserving per-period capacity and signup records.
  shiftGroupId: string;
  // Task items in the same task type share this id and title.
  taskGroupId: string;
  taskGroupTitle: string;
  label: string;
  role: string;
  // For timed (vagt) slots this is a "HH:MM–HH:MM" time range; for the other
  // types it is a free-text detail note (e.g. "5 spejdere pr. patrulje").
  sublabel: string;
  startTime: string;
  endTime: string;
  // All periods within a shift type use the same duration. It is stored on
  // every period so a period remains self-contained for signup and legacy
  // consumers, while the admin editor keeps the value in sync per group.
  shiftDurationMinutes: number;
  // ISO "YYYY-MM-DD", or '' when the slot has no date of its own and only
  // inherits the parent posting's dateText.
  date: string;
  // Optional year-wheel scheduling metadata. Missing values preserve legacy
  // fixed-date behaviour.
  scheduleMode?: SlotScheduleMode;
  relativeTo?: SlotRelativeTo;
  offsetDays?: number;
  deadlineDate?: string;
  deadlineScheduleMode?: SlotScheduleMode;
  deadlineOffsetDays?: number;
  recurrenceWeekday?: number;
  recurrenceStartDate?: string;
  recurrenceEndDate?: string;
  recurrenceMaterialized?: boolean;
  capacity: number; // 0 means unlimited
  kind: SlotKind;
  price: number;
  // Payment belongs to the signup option itself: an arrangement can offer
  // several paid signup groups with separate MobilePay links.
  paymentUrl: string;
  cancelDeadlineDays: number;
  // Paid activities can delegate both registration and payment to
  // Medlemsservice. Local signups remain the default for legacy records.
  registrationMode: SignupRegistrationMode;
  memberServiceUrl: string;
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
  // Normalized local event date for year-wheel calculations. `dateText` stays
  // as the legacy/display value for existing records.
  eventDate?: string;
  planYear?: number;
  location: string;
  locationLat: number | null;
  locationLng: number | null;
  type: EventType;
  active: boolean;
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
  // Only arrangementer let a slot vary participation (Frivillig/Tilmeld/Betalt).
  showKindPicker: boolean;
}
