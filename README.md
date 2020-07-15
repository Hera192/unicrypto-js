## unicrypto

Minimalistic Javascript library required to perform basic operations with Universa smart contracts and other objects.

Supports:
 * [SHA family](#sha)
 * [HMAC](#hmac)
 * [PBKDF2](#pbkdf2)
 * [RSA OAEP/PSS](#oaep-pss)
 * [AES256, AES512](#aes)
 * [BOSS](#boss)

## Installation

### Node.js

For usage in an existing Node.js project, add it to your dependencies:

```
$ npm install unicrypto
```

or with yarn:

```
$ yarn add unicrypto
```


And use it wherever you need it.

```javascript
import { encode64 } from 'unicrypto';
```

### Web

In root folder of package run

```bash
npm install
npm run build
```

In folder `dist` there will be `unicrypto.min.js`, `crypto.js`, `crypto.wasm`. Also there will be \*.LICENSE files.

Copy files to your scripts folder and set them in order. Also, wait for initalization:

```html
<script src="path/to/crypto.js"></script>
<script src="path/to/unicrypto.min.js"></script>

<script>
  async function main() {
    // Example of key generation
    const options = { strength: 2048 };
    const priv = await Unicrypto.PrivateKey.generate(options);
    console.log(priv);
  }

  main();
</script>
```

## Usage

### Signed record

Pack data to signed record (Uint8Array) with key:

```js
import { SignedRecord, decode64, PrivateKey } from 'unicrypto';

const payload = { ab: "cd" };
const nonce = decode64("abc");
const key = await PrivateKey.unpack(privateKeyPacked);

const recordBinary = await SignedRecord.packWithKey(key, payload, nonce); // Uint8Array
```

Unpack signed record:

```js
import { SignedRecord, decode64, PrivateKey } from 'unicrypto';

const payload = { ab: "cd" };
const nonce = decode64("abc");
const key = await PrivateKey.unpack(privateKeyPacked);

const recordBinary = await SignedRecord.packWithKey(key, payload, nonce); // Uint8Array

const record = await SignedRecord.unpack(recordBinary);

record.recordType === SignedRecord.RECORD_WITH_KEY; // true
record.nonce // nonce
record.payload // payload
record.key // PublicKey
```

### Misc

Random byte array for given length

```js
import { randomBytes } from 'unicrypto';

const bytes16 = randomBytes(16); // Uint8Array
```

HashId for binary data

```js
import { hashId } from 'unicrypto';

const id = await hashId(decode64("abc")); // Uint8Array
```

CRC32

```js
import { crc32 } from 'unicrypto';

const digest = crc32(decode64("abc")); // Uint8Array
```

### Converters

Convert byte array to hex string and back

```js
    import { bytesToHex, hexToBytes } from 'unicrypto';

    const hexString = bytesToHex(uint8arr);  // String
    const bytesArray = hexToBytes(hexString); // Uint8Array
```

Convert plain text to bytes and back

```js
  import { textToBytes, bytesToText } from 'unicrypto';

  const bytes = textToBytes("one two three"); // Uint8Array
  const text = bytesToText(bytes); // "one two three"
```

Convert bytes to base64 and back

```js
import { encode64, encode64Short, decode64 } from 'unicrypto';

const bytes = decode64("abc"); // Uint8Array
const base64str = encode64(bytes); // String

// short representation of base64 string
const base64ShortString = encode64Short(bytes);
```

Convert bytes to base58 and back

```js
import { encode58, decode58 } from 'unicrypto';

const bytes = decode58("abc"); // Uint8Array
const base58str = encode58(bytes); // String
```

### SHA

Supports SHA256, SHA512, SHA1, SHA3(256, 384, 512)

Get instant hash value for given byte array

```js
import { SHA } from 'unicrypto';

const resultBytes1 = await SHA.getDigest('sha256', textToBytes('somevalue')); // Uint8Array
```

Get hash value for large data

```js
import { SHA } from 'unicrypto';

const sha512 = new SHA(512);

await sha512.put(dataPart1); // dataPart1 is Uint8Array
await sha512.put(dataPart2);
// .....
await sha512.put(dataPartFinal);

const resultBytes = await sha512.get(); // Uint8Array
```

Get hash value in HEX

```js
import { SHA } from 'unicrypto';

const sha256 = new SHA(256);
const hexResult = await sha256.get(textToBytes("one two three"), 'hex'); // String
```

### HMAC

```js
import { SHA, HMAC  } from 'unicrypto';

const data = textToBytes('a quick brown for his done something disgusting');
const key = textToBytes('1234567890abcdef1234567890abcdef');

const hmac = new HMAC('sha256', key);
const result = await hmac.get(data) // Uint8Array
```

### PBKDF2

```js
import { hexToBytes, pbkdf2, SHA } from 'unicrypto';

const derivedKey = await pbkdf2('sha256', {
  rounds: 1, // number of iterations
  keyLength: 20,  // bytes length
  password: 'password',
  salt: hexToBytes('abc123')
}); // Uint8Array
```

### RSA Pair, keys helpers

Private key unpack

```js
import { PrivateKey, decode64, BigInteger } from 'unicrypto';

const bossEncodedKey = decode64(keyPacked64);

const privateKey2 = await PrivateKey.unpack(bossEncodedKey);

// Read password-protected key
const privateKey4 = await PrivateKey.unpack({
  bin: bossEncodedKey,
  password: "qwerty"
});
```

Public key unpack

```js
import { PublicKey, PrivateKey, decode64, BigInteger } from 'unicrypto';

const bossEncodedKey = decode64(keyPacked64);
const privateKey1 = await PrivateKey.unpack(bossEncodedKey);
const publicKey1 = privateKey1.publicKey;

const publicKey2 = await PublicKey.unpack(bossEncodedPublicKey);
```

Public key fingerprint

```js
publicKey.fingerprint; // fingerprint (Uint8Array)
```

Public key bit strength

```js
publicKey.getBitStrength(); // number
```

Public key address

```js
publicKey.shortAddress.bytes;   // short address (Uint8Array)
publicKey.shortAddress.base58;   // short address (Uint8Array)
publicKey.longAddress.bytes;    // long address (Uint8Array)
publicKey.longAddress.base58;    // long address (Uint8Array)

// DEPRECATED
publicKey.shortAddress58; // short address (base58)
publicKey.longAddress58;  // long address (base58)
```

Check if given address is valid

```js
import { PublicKey } from 'unicrypto';

PublicKey.isValidAddress(publicKey.shortAddress) // true

// accepts base58 representation of address too
PublicKey.isValidAddress(publicKey.shortAddress58) // true

```

Generate private key

```js
import { PrivateKey } from 'unicrypto';

const options = { strength: 2048 };
const priv = await PrivateKey.generate(options); // instance of PrivateKey
```

Private(public) key - export

```js
import { PrivateKey } from 'unicrypto';

const bossEncodedKey = decode64(keyPacked64);

const key = await PrivateKey.unpack(bossEncodedKey);
const keyPacked = await key.pack(); // Uint8Array
const keyPackedProtected = await key.pack("somepassword"); // Uint8Array
const keyPackedProtected1000 = await key.pack({ password: "qwerty", rounds: 1000 });

const bossEncodedPublic = await key.publicKey.packed();
```

Get type of key package. There are 4 types of what key binary package may contain.

AbstractKey.TYPE_PRIVATE - binary package of private key without password
AbstractKey.TYPE_PUBLIC - binary package of public key without password
AbstractKey.TYPE_PRIVATE_PASSWORD_V2 - binary package of private key with password (actual version)
AbstractKey.TYPE_PRIVATE_PASSWORD_V1 - binary package of private key with password (deprecated version)

```js
import { AbstractKey } from 'unicrypto';

const bossEncoded = await privateKey.pack("somepassword");

AbstractKey.typeOf(bossEncoded) === AbstractKey.TYPE_PRIVATE_PASSWORD_V2 // true
```

### KEY INFO

Contains information about Key and helper to match keys compatibility

Supported algorithms: RSAPublic, RSAPrivate, AES256

Supported PRF: HMAC_SHA1, HMAC_SHA256, HMAC_SHA512

```js
import { KeyInfo } from 'unicrypto';

const keyInfo = new KeyInfo({
  algorithm: KeyInfo.Algorithm.AES256,
  tag: decode64("abc"), // Uint8Array
  keyLength: 32,        // Int
  prf: KeyInfo.PRF.HMAC_SHA256,
  rounds: 16000,        // number of iterations
  salt: decode64("bcd") // Uint8Array
});

```

Pack to BOSS

```js
const packed = keyInfo.pack(); // Uint8Array
```

Read from BOSS

```js
// bossEncoded is Uint8Array
const keyInfo = KeyInfo.unpack(bossEncoded); // KeyInfo
```

Check that this key can decrypt other key

```js
const canDecrypt = keyInfo.matchType(otherKeyInfo); // boolean
```

Derived key from password

```js
const derivedKey = await keyInfo.derivePassword("somepassword"); // Uint8Array
```

### SYMMETRIC KEY

Symmetric key: main interface to the symmetric cipher.
This implementation uses AES256 in CTR mode with IV to encrypt / decrypt.

```js
import { SymmetricKey } from 'unicrypto';

// Creates random key (AES256, CTR)
const symmetricKey = new SymmetricKey();

// Creates key by derived key (Uint8Array) and it's info (KeyInfo)
const symmetricKey2 = new SymmetricKey({
  keyBytes: derivedKey,
  keyInfo: keyInfo
});

// Creates key by derived key (Uint8Array)
const symmetricKey2 = new SymmetricKey({
  keyBytes: derivedKey
});

// Creates key by password (String) and number of rounds (Int). Salt is optional
// Uint8Array, null by default
const symmetricKey3 = await SymmetricKey.fromPassword(password, rounds, salt);
```

Pack symmetric key (get derived key bytes)

```js
import { SymmetricKey } from 'unicrypto';

// Creates random key (AES256, CTR)
const symmetricKey = new SymmetricKey();

const derivedKey = symmetricKey.pack(); // Uint8Array
```

Encrypt / decrypt data with AES256 in CRT mode with IV

```js
// data is Uint8Array
const encrypted = symmetricKey.encrypt(data); // Uint8Array
const decrypted = symmetricKey.decrypt(encrypted); // Uint8Array
```

Encrypt / decrypt data with EtA using Sha256-based HMAC

```js
// data is Uint8Array
const encrypted = await symmetricKey.etaEncrypt(data); // Uint8Array
const decrypted = await symmetricKey.etaDecrypt(encrypted); // Uint8Array
```

### RSA OAEP/PSS


OAEP encrypt/decrypt

You can pass hash types with instances or with string types. Supported types for SHA:
sha1
sha256
sha384
sha512
sha512/256
sha3_256
sha3_384
sha3_512

```js
const privateKey; // some PrivateKey instance
const publicKey = privateKey.publicKey;

// encrypt data
const data = decode64("abc123");
const options = {
  seed: decode64("abcabc"), // optional, default none
  mgf1Hash: 'sha512', // optional, default SHA(256)
  oaepHash: 'sha512' // optional, default SHA(256)
};
const encrypted = await publicKey.encrypt(data, options);
const decrypted = await privateKey.decrypt(encrypted, options);

encode64(data) === encode64(decrypted); // true
```

OAEP max encryption message length

```js
const privateKey; // some PrivateKey instance
const publicKey = privateKey.publicKey;

// encrypt data
const options = {
  seed: decode64("abcabc"), // optional, default none
  mgf1Hash: 'SHA512', // optional, default SHA(256)
  oaepHash: 'SHA512' // optional, default SHA(256)
};

const maxLength = publicKey.encryptionMaxLength(options);
```

OAEP default hash

```js
publicKey.DEFAULT_OAEP_HASH // SHA1 instance
```

MGF1 default hash

```js
publicKey.DEFAULT_MGF1_HASH // SHA1 instance
```

PSS sign/verify

You can pass hash types with instances or with string types. Supported types for SHA:
sha1
sha256
sha384
sha512
sha512/256
sha3_256
sha3_384
sha3_512

```js
const privateKey; // some PrivateKey instance
const publicKey = privateKey.publicKey;

const options = {
  salt: decode64("abcabc"), // optional
  saltLength: null, // optional, numeric
  mgf1Hash: 'sha512', // optional, default SHA(256)
  pssHash: 'sha512' // optional, default SHA(256)
};

const message = 'abc123';

const signature = await privateKey.sign(message, options);
const isCorrect = await publicKey.verify(message, signature, options);
console.log(isCorrect); // true
```

### Extended signature

Sign/verify

```js
import { ExtendedSignature } from 'unicrypto';

const data = decode64("abcde12345");
const privateKey; // some PrivateKey instance
const publicKey = privateKey.publicKey;

const signature = await privateKey.signExtended(data);
const es = await publicKey.verifyExtended(signature, data);

const isCorrect = !!es;
console.log(es.created_at); // Date - signature created at
console.log(es.key); // Uint8Array - PublicKey fingerprint
console.log(ExtendedSignature.extractPublicKey(signature)); // PublicKey instance
```

### BOSS

Encode/decode

```js
import { Boss } from 'unicrypto';

const boss = new Boss();

const data = {
  a: decode64("abc")
  b: new Date(),
  c: [1, 2, 'test'],
  d: { a: 1 }
};

const encoded = boss.dump(data); // Uint8Array
const decoded = boss.load(encoded); // original data
```

Encode stream

```js
const writer = new Boss.writer();

writer.write(0);
writer.write(1);
writer.write(2);
writer.write(3);

const dump = writer.get(); // Uint8Array
```

Decode stream

```js
const reader = new Boss.reader(hexToBytes('00081018'));

const arg1 = reader.read(); // 0
const arg2 = reader.read(); // 1
const arg3 = reader.read(); // 2
const arg4 = reader.read(); // 3
const arg5 = reader.read(); // undefined
```

### AES

Encrypt/decrypt

```js
import { AES } from 'unicrypto';

const key = decode64("abc"); // 16 bytes for aes128, 32 bytes for aes256
const message = textToBytes('some text');

const aes256 = new AES(key);
const encrypted = aes256.encrypt(message);   // Uint8Array
const decrypted = aes256.decrypt(encrypted); // Uint8Array
```

## Create bundle

Run in package root folder

```bash
npm install
npm run build
```

In folder `dist` there will be `universa.min.js`, `crypto.js`, `crypto.wasm`. Also there will be \*.LICENSE files.

## Running tests
```bash
npm test
```