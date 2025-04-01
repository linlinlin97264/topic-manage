import { onCall, HttpsError } from 'firebase-functions/v2/https';
import * as admin from 'firebase-admin';

admin.initializeApp();

export const getUserByEmail = onCall(async (request) => {
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'Must be logged in');
  }

  const { email } = request.data;
  if (!email) {
    throw new HttpsError('invalid-argument', 'Email is required');
  }

  try {
    const user = await admin.auth().getUserByEmail(email);
    return {
      uid: user.uid,
      email: user.email
    };
  } catch (error) {
    throw new HttpsError('not-found', 'User not found');
  }
}); 