type FunctionError = Error & { code?: string; status?: number };

function endpointUrl(functionName: string, productionPath: string): string {
  const useEmulators = import.meta.env.VITE_USE_FIREBASE_EMULATORS !== undefined
    ? import.meta.env.VITE_USE_FIREBASE_EMULATORS === 'true'
    : import.meta.env.DEV;
  return useEmulators
    ? `http://127.0.0.1:5004/havets-helte/europe-west1/${functionName}`
    : productionPath;
}

export async function postFunction<T>(
  functionName: string,
  productionPath: string,
  body: unknown,
  idToken?: string,
): Promise<T> {
  const response = await fetch(endpointUrl(functionName, productionPath), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(idToken ? { Authorization: `Bearer ${idToken}` } : {}),
    },
    body: JSON.stringify(body),
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error(payload.message || 'Handlingen kunne ikke gennemføres.') as FunctionError;
    error.code = payload.status;
    error.status = response.status;
    throw error;
  }
  return payload as T;
}

export async function getFunction<T>(
  functionName: string,
  productionPath: string,
  idToken: string,
): Promise<T> {
  const response = await fetch(endpointUrl(functionName, productionPath), {
    headers: { Authorization: `Bearer ${idToken}` },
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error(payload.message || 'Handlingen kunne ikke gennemføres.') as FunctionError;
    error.code = payload.status;
    error.status = response.status;
    throw error;
  }
  return payload as T;
}
