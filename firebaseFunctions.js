const functions = require('firebase-functions');
const admin = require('firebase-admin');
admin.initializeApp();

exports.syncUserToSupabase = functions.auth.user().onCreate(async (user) => {
  const response = await fetch(`${process.env.APP_URL}/api/sync-user`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      uid: user.uid,
      email: user.email
    })
  });
  
  if (!response.ok) {
    throw new Error('Error al sincronizar usuario');
  }
});
