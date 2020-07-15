const fs = require('fs');
const gentlyCopy = require('gently-copy');
const buildWASM = require('./build_wasm');
const VERSION = process.env.npm_package_version;

const distPaths = ['build', 'public', 'dist'];

let copied = false;

function copyWASM(destination) {
  gentlyCopy([`./dist/crypto.v${VERSION}.wasm`], `${destination}/crypto.v${VERSION}.wasm`);
  copied = true;
}

function tryToCopy() {
  distPaths.map(path => {
    const relative = '../../' + path;
    if (fs.existsSync(relative)) {
      if (path === "public") {
        const jsPath = relative + '/js';

        if (fs.existsSync(jsPath)) copyWASM(jsPath);
        else copyWASM(relative);
      }
      else copyWASM(relative);
    }
  });

  if (!copied) console.log("WARNING: Cannot find destination directory. Please, copy node_modules/unicrypto/dist/crypto.v${VERSION}.wasm to your frontend public directory");
}

buildWASM.then(tryToCopy);