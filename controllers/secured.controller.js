const luckyGen = require('../helpers/luckyNumGen');
const pow = require('../helpers/modularExp');
const Vote = require('../blockchain/blockchain').Vote;
const client = require('../helpers/postgres');
const generatePass = require('pr-pass');
const crypto = require('crypto-js');

module.exports = {
  vote: async (req, res) => {
    try {
      const { uid, bday } = req.authorizedUser;

      /**
       * Diffie Hellman, ( g = 17 ,p = 541)
       * get public from client
       * Generate private server again
       * calculate shared private
       */

      console.log(req.authorizedUser, req.headers);

      const clientPublic = parseInt(req.headers.publickey);

      const serverPrivate = luckyGen({
        uid,
        bday,
      });
      const sharedKey = pow(clientPublic, serverPrivate, 541);
      console.log(sharedKey);
      /**
       * Generate Symmetric Key with PR Pass
       * You have lucky number as sharedKey from Diffie Hellman
       */

      const secretAES = generatePass(req.headers.authorization, sharedKey);

      /**
       * Decrypt with the symmetric key generated from PR Pass.
       */

      console.log(secretAES);
      const cipher = crypto.AES.decrypt(req.body.payload, secretAES).toString(
        crypto.enc.Utf8
      );
      // const cipher = crypto.AES.encrypt(
      //   JSON.stringify(req.body),
      //   secretAES
      // ).toString();
      console.log(cipher);

      /**
       * request body is converted back to the original plaintext
       * JSON fomrat that was sent by the voter
       */

      req.body = JSON.parse(cipher);

      const { data, timestamp } = req.body;
      console.log(req.body);

      /**
       * Vote is added to the block.
       */

      votes.push(
        new Vote({ ...data, from: req.authorizedUser.uid, timestamp })
      );
      console.log(votes);

      const res_ = await client.query(
        'INSERT INTO VOTED(UID, VOTE) VALUES($1, $2)',
        [req.authorizedUser.uid, '1']
      );

      res.status(200).send('success');
    } catch (err) {
      console.log(err);
      res.status(503).send('Error');
    }
  },
};
