// src/auth/getUserInfo.js
import UserPool from '../aws/UserPool';

export const getUserAttributes = () => {
  const user = UserPool.getCurrentUser();

  if (!user) {
    return Promise.reject('No user currently signed in.');
  }

  return new Promise((resolve, reject) => {
    user.getSession((err, session) => {
      if (err || !session.isValid()) {
        reject('Session invalid.');
      } else {
        user.getUserAttributes((err, attributes) => {
          if (err) {
            reject(err);
          } else {
            const result = {};
            attributes.forEach(attr => {
              result[attr.getName()] = attr.getValue();
            });
            resolve(result);
          }
        });
      }
    });
  });
};
