// services/userService.js
const User = require('../models/User');
const { auth } = require('../lib/firebaseConfig');

const syncUser = async (firebaseUser) => {
  try {
    const [user, created] = await User.findOrCreate({
      where: { firebase_uid: firebaseUser.uid },
      defaults: {
        email: firebaseUser.email,
        name: firebaseUser.displayName || firebaseUser.email.split('@')[0]
      }
    });
    
    if (!created) {
      await user.update({
        email: firebaseUser.email,
        name: firebaseUser.displayName || user.name
      });
    }
    
    return user;
  } catch (error) {
    console.error('Error syncing user:', error);
    throw error;
  }
};

module.exports = { syncUser };
