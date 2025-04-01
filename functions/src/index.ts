import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
admin.initializeApp();

export const getUserByEmail = functions.https.onCall(async (request: functions.https.CallableRequest<{email: string}>, context: functions.https.CallableContext) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'Must be logged in');
  }

  const { email } = request.data;
  if (!email) {
    throw new functions.https.HttpsError('invalid-argument', 'Email is required');
  }

  try {
    const user = await admin.auth().getUserByEmail(email);
    return {
      uid: user.uid,
      email: user.email
    };
  } catch (error) {
    throw new functions.https.HttpsError('not-found', 'User not found');
  }
}); 