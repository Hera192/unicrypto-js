var Module = Module || require('../vendor/wasm/wrapper');

const SHA = require('../hash/sha');

const { isNode, isWorker } = require('../utils');

module.exports = derive;

/**
 * Derives a key from a password.
 *
 * @param {Hash} hash - hash instance
 * @param {String} options.password - the password as a binary-encoded string of
 *                                    bytes.
 * @param {String} options.salt - the salt as a binary-encoded string of bytes.
 * @param {Number} options.iterations - the iteration count, a positive integer.
 * @param {Number} options.keyLength - the intended length, in bytes, of the
 *                                     derived key, (max: 2^32 - 1) * hash
 *                                     length of the PRF.
 *
 * @return the derived key, as a binary-encoded array of bytes, for the
 *           synchronous version (if no callback is specified).
 */
async function derive(hashStringType, options) {
  const self = this;
  const hashType = SHA.StringTypes[hashStringType];

  await Module.init();

  if (!isNode() && !isWorker()) {
    const CryptoWorker = require('../workers');

    return CryptoWorker.run(`(resolve, reject) => {
      const { pbkdf2 } = this.Unicrypto;
      const { hashStringType, options } = this.data;
      pbkdf2(hashStringType, options).then(resolve, reject);
    }`, { data: { hashStringType, options } });
  } else return new Promise((resolve, reject) => {
    const { password, salt, keyLength, rounds } = options;
    const cb = (result) => resolve(new Uint8Array(result));

    Module.pbkdf2(hashType, rounds || 5000, keyLength, password, salt, cb);
  });
}
