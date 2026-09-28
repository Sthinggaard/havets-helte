import { getAppAuth } from '@/lib/firebase';
import { postFunction } from '@/lib/functionApi';

export type ManageSignupAction = 'approve' | 'move';

export async function manageVolunteerSignup(signupId: string, action: ManageSignupAction, targetSlotId = '') {
  const auth = await getAppAuth();
  const token = await auth.currentUser?.getIdToken();
  if (!token) throw new Error('Log ind som leder for at fortsætte.');
  return postFunction<{ status: string; slotId: string; waitlist: boolean }>(
    'manageVolunteerSignup', '/api/manage-volunteer-signup',
    { signupId, action, targetSlotId }, token,
  );
}
