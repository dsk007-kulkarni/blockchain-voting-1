const crypto = require('crypto-js');
const generatePass = require('pr-pass');

/**
 *
 * @param {request body (JSON)} body
 * @param {shared Key from Diffie Hellman (Number)} sharedKey
 * @param {auth token (String)} token
 * @returns A ciphered output of above combinations
 */
module.exports = (body, sharedKey, token) => {
  const serializedBody = JSON.stringify(body);

  const aesSecret = generatePass(token, sharedKey);

  const cipher = crypto.AES.encrypt(serializedBody, aesSecret).toString();

  console.log(serializedBody, aesSecret, cipher);

  return cipher;
};
