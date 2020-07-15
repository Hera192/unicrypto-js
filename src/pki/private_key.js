var Module = Module || require('../vendor/wasm/wrapper');

const Boss = require('../Boss/protocol');
const utils = require('../utils');
const helpers = require('./helpers');
const PublicKey = require('./public_key');
const SHA = require('../hash/sha');
const HMAC = require('../hash/hmac');
const pbkdf2 = require('./pbkdf2');
const cipher = require('../cipher');
const AbstractKey = require('./abstract_key');
const SymmetricKey = require('./symmetric_key');
const KeyInfo = require('./key_info');
const ExtendedSignature = require('./extended_signature');

const {
  BigInteger,
  bigIntToByteArray,
  byteArrayToBigInt,
  byteStringToArray,
  randomBytes,
  concatBytes,
  crc32,
  textToHex,
  hexToBytes,
  encode64
} = utils;

const { AESCTRTransformer } = cipher;

const { ONE: one } = BigInteger;
const { wrapOptions, getMaxSalt, normalizeOptions } = helpers;

module.exports = class PrivateKey extends AbstractKey {
  constructor(load, unload) {
    super();

    this.load = load;
    this.unload = unload;
    // this.publicKey = PublicKey.fromPrivate(load, unload);
  }

  async loadProperties(key) {
    const self = this;
    this.publicKey = await PublicKey.fromPrivate(key);

    this.n = this.publicKey.n;
    this.e = this.publicKey.e;
    this.p = key.get_p();
    this.q = key.get_q();
    this.bitStrength = this.publicKey.bitStrength;
    this._fingerprint = this.publicKey.fingerprint;
  }

  getN() { return this.n; }
  getE() { return this.e; }
  getP() { return this.p; }
  getQ() { return this.q; }
  getBitStrength() { return this.bitStrength; }
  get fingerprint() { return this._fingerprint; }

  async sign(data, options = {}) {
    const self = this;
    const hashType = SHA.wasmType(options.pssHash || 'sha1');
    const mgf1Type = SHA.wasmType(options.mgf1Hash || 'sha1');
    let saltLength = -1;
    if (typeof options.saltLength === 'number') saltLength = options.saltLength;

    const key = await this.load();

    return new Promise(resolve => {
      const cb = res => {
        self.unload(key);
        resolve(new Uint8Array(res));
      }

      if (options.salt)
        key.signWithCustomSalt(data, hashType, mgf1Type, salt, cb);
      else
        key.sign(data, hashType, mgf1Type, saltLength, cb);
    });
  }

  async signExtended(data) {
    const self = this;
    const pub = this.publicKey;
    const dataHash = new SHA('512');
    const fingerprint = this.fingerprint;
    const sha512Digest = await dataHash.get(data);
    const publicPacked = await pub.packed();

    const targetSignature = Boss.dump({
      'key': fingerprint,
      'sha512': sha512Digest,
      'created_at': new Date(),
      'pub_key': publicPacked
    });


    const signature = await self.sign(targetSignature, {
      pssHash: 'sha512',
      mgf1Hash: 'sha1'
    });

    return Boss.dump({
      'exts': targetSignature,
      'sign': signature
    });
  }

  async decrypt(data, options = {}) {
    const self = this;
    const oaepHash = SHA.wasmType(options.oaepHash || 'sha1');
    const key = await this.load();

    return new Promise(resolve => {
      key.decrypt(data, oaepHash, (res) => {
        self.unload(key);
        resolve(new Uint8Array(res));
      });
    });
  }

  async pack(options) {
    const opts = {};
    if (typeof options === 'string') opts.password = options;

    const key = await this.load();
    const packed = await PrivateKey.packBOSS(Object.assign({ key }, opts));
    this.unload(key);

    return packed;
  }

  // async packBOSS(options) {
  //   const self = this;
  //   const key = options.key || await this.load();

  //   return new Promise(resolve => {
  //     const cb = (result) => {
  //       if (self.unload) self.unload(key);
  //       resolve(result);
  //     };

  //     if (!options)
  //       key.pack(bin => cb(new Uint8Array(bin)));
  //     else {
  //       const password = options.password || options;
  //       const rounds = options.rounds || 160000;

  //       key.packWithPassword(password, rounds, (err, packed) => {
  //         if (err === '') cb(new Uint8Array(packed));
  //         else reject(err);
  //       });
  //     }
  //   });
  // }

  static async packBOSS(options) {
    const { key, password } = options;

    return new Promise(resolve => {
      if (!password)
        key.pack(bin => resolve(new Uint8Array(bin)));
      else {
        const rounds = options.rounds || 160000;

        key.packWithPassword(password, rounds, (err, packed) => {
          if (err === '') resolve(new Uint8Array(packed));
          else reject(err);
        });
      }
    });
  }

  static async unpack(options, password) {
    let key = options.key;

    if (!key) {
      if (options.q && options.p)
        key = await PrivateKey.unpackExponents(options);
      else
        key = await PrivateKey.unpackBOSS(options, password);
    }

    const raw = await PrivateKey.packBOSS({ key });
    const load = () => PrivateKey.unpackBOSS(raw);
    const unload = (key) => key.delete();

    const instance = new PrivateKey(load, unload);
    await instance.loadProperties(key);

    unload(key);

    return instance;
  }

  static async unpackBOSS(options, password) {
    await Module.isReady;

    return new Promise(resolve => {
      if (!options.password) return resolve(new Module.PrivateKeyImpl(options));

      const { bin, password } = options;

      Module.PrivateKeyImpl.unpackWithPassword(bin, password, (err, key) => {
        if (err === "") resolve(key);
        else reject(err);
      });
    });
  }

  static async unpackExponents(options) {
    const { e, p, q } = options;

    return PrivateKey.unpackBOSS(Boss.dump([
      AbstractKey.TYPE_PRIVATE,
      bigIntToByteArray(new BigInteger(e, 16)),
      bigIntToByteArray(new BigInteger(p, 16)),
      bigIntToByteArray(new BigInteger(q, 16))
    ]));
  }

  static async generate(options) {
    const { strength } = options;

    await Module.isReady;

    const generator = new Promise(resolve => {
      Module.PrivateKeyImpl.generate(strength, resolve);
    });

    const key = await generator;

    return PrivateKey.unpack({ key });
  }
}

function toBOSS(instance, options) {
  if (options) return toBOSSPassword(instance, options);

  const { key } = instance;

  const { e, p, q } = key;

  return Boss.dump([
    AbstractKey.TYPE_PRIVATE,
    bigIntToByteArray(e),
    bigIntToByteArray(p),
    bigIntToByteArray(q)
  ]);
}

function fromBOSS(dump) {
  if (dump.password) return fromBOSSPassword(dump);

  return new Module.PrivateKeyImpl(dump);
}
