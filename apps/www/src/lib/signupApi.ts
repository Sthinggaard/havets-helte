import { postFunction } from './functionApi';

export type SignupRequestPayload = {
  eventId: string;
  slotId: string;
  name: string;
  email: string;
  adult: boolean;
  childMode: boolean;
  groupSize: number;
  audienceGroupId?: string;
  waitlistPreferred: boolean;
};

export type SignupResponsePayload = {
  cancelToken?: string;
  signupId?: string;
  status?: 'confirmed' | 'waitlist' | 'invalid' | 'not_found' | 'full' | 'error';
  waitlist?: boolean;
  message?: string;
};

type SignupError = Error & { code?: string };

function signupError(code: string, message: string): SignupError {
  const error = new Error(message) as SignupError;
  error.code = code;
  return error;
}

export async function submitSignupRequest(payload: SignupRequestPayload): Promise<SignupResponsePayload> {
  const eventId = payload.eventId.trim();
  const slotId = payload.slotId.trim();
  const name = payload.name.trim();
  const email = payload.childMode ? '' : payload.email.trim();
  const groupSize = Number.isInteger(payload.groupSize) ? payload.groupSize : 1;

  if (!eventId) throw signupError('invalid', 'Mangler eventId.');
  if (!slotId) throw signupError('invalid', 'Mangler slotId.');
  if (!name) throw signupError('invalid', 'Navn mangler.');
  if (!payload.childMode) {
    if (!email) throw signupError('invalid', 'Email mangler.');
    if (!email.includes('@')) throw signupError('invalid', 'Email er ugyldig.');
  }
  if (groupSize < 1) throw signupError('invalid', 'Antal deltagere er ugyldigt.');

  try {
    return await postFunction<SignupResponsePayload>('submitSignup', '/api/submit-signup', {
      eventId,
      slotId,
      name,
      email,
      adult: payload.childMode ? false : payload.adult,
      childMode: payload.childMode,
      groupSize,
      ...(payload.audienceGroupId ? { audienceGroupId: payload.audienceGroupId.trim() } : {}),
      waitlistPreferred: payload.waitlistPreferred,
    });
  } catch (error) {
    const typed = error as { code?: string; message?: string };
    throw signupError(typed.code || 'error', typed.message || 'Tilmeldingen kunne ikke sendes.');
  }
}
