const LOCAL_FUNCTIONS_URL = 'http://localhost:5004/havets-helte/europe-west1/submitSignup';
const PROD_FUNCTIONS_URL = '/api/submitSignup';
const emulatorOverride = import.meta.env.VITE_USE_FIREBASE_EMULATORS;
const useEmulators = emulatorOverride !== undefined ? emulatorOverride === 'true' : import.meta.env.DEV;

export type SignupRequestPayload = {
  eventId: string;
  slotId: string;
  name: string;
  email: string;
  adult: boolean;
  childMode: boolean;
  groupSize: number;
  waitlistPreferred: boolean;
};

export type SignupResponsePayload = {
  cancelToken?: string;
  signupId?: string;
  status?: 'confirmed' | 'waitlist' | 'invalid' | 'not_found' | 'full' | 'error';
  waitlist?: boolean;
  message?: string;
};

function getSignupApiUrl() {
  return useEmulators ? LOCAL_FUNCTIONS_URL : PROD_FUNCTIONS_URL;
}

export async function submitSignupRequest(payload: SignupRequestPayload): Promise<SignupResponsePayload> {
  const response = await fetch(getSignupApiUrl(), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  const contentType = response.headers.get('content-type') || '';
  const data = contentType.includes('application/json')
    ? await response.json().catch(() => ({}))
    : {};

  if (!response.ok) {
    const error = new Error(
      data.message ||
      (response.status === 404
        ? 'Tilmeldingstjenesten blev ikke fundet.'
        : 'Tilmeldingen kunne ikke sendes.'),
    ) as Error & { code?: string };
    error.code = data.status || (response.status === 404 ? 'not_found' : 'error');
    throw error;
  }

  return data as SignupResponsePayload;
}
