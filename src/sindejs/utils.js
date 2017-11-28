import * as jsrsasign from 'jsrsasign';
import * as openpgp from 'openpgp';
import mime from 'mime-types';

export function fetchCheckText(response) {
    if (response.status >= 200 && response.status < 300) {
      console.log('checkStatusFetch ');
      return response.text();
    } else {
      var error = new Error(response.statusText);
      error.response = response;
      throw error;
    }
  };

export function jsonParse(response){
  return JSON.parse(response);
}

export default class Utils {
  constructor(parameters = {}){
    /**
     * @file {File}
     * @description file for parse to decrypt
     */
     // this.file = parameters.file;
  }

  /**
   * Load file for decrypt into message openpgp
   * @param {(File)} file for parse to decrypt
   * @returns {Promise} Promise return openpgp message parsed
   */
  static readFileForDecrypt(file){
    return new Promise((resolve, reject) => {
      let message = { data: '', type : '', dataUTF8: '' };
      const reader = new FileReader();
      // const openpgp = require('openpgp');

      // utf8 message
      reader.onload = event => {
        let data = event.target.result;
        message.dataUTF8 = data;
        try{
          message.data = openpgp.message.readArmored(data);
          message.type = 'utf8';
          resolve(message);
        }
        catch(e){
          // binary message
          reader.onload = event => {
            data = event.target.result;
            try {
              const bytes = new Uint8Array(data);
              message.data = openpgp.message.read(bytes);
              message.type = 'binary';
              resolve(message);
            }
            catch (e) {
              reject(Error('File for decrypt is not valid: ' + e));
            }
          };
          reader.readAsArrayBuffer(file);
        }
      };
      reader.readAsText(file);
    });
  }

  /**
   * Read and parse file to B64
   * @param {(File)} file for parse to decrypt
   * @returns {Promise} Promise return openpgp message parsed
   */
  static readFileToB64(file){
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = event => {
        const data = event.target.result;
        try {
          const fileHex = jsrsasign.ArrayBuffertohex(data);
          const fileB64 = jsrsasign.hextob64(fileHex);
          resolve(fileB64);
        }
        catch (e) {
          reject(Error('Error readFileToB64: ' + e));
        }
      };
      reader.readAsArrayBuffer(file);
    });
  }

  static _arrayBufferToPublicKeyPEM(arraybuffer){
      const bytes = new Uint8Array(arraybuffer);
      const keyPEM = openpgp.armor.encode(openpgp.enums.armor.public_key, bytes);
      return keyPEM;
  }

  static b64toBlob(b64Data, contentType, sliceSize) {
      contentType = contentType || '';
      sliceSize = sliceSize || 512;

      var byteCharacters = atob(b64Data);
      var byteArrays = [];

      for (var offset = 0; offset < byteCharacters.length; offset += sliceSize) {
        var slice = byteCharacters.slice(offset, offset + sliceSize);

        var byteNumbers = new Array(slice.length);
        for (var i = 0; i < slice.length; i++) {
          byteNumbers[i] = slice.charCodeAt(i);
        }

        var byteArray = new Uint8Array(byteNumbers);

        byteArrays.push(byteArray);
      }

      var blob = new Blob(byteArrays, {type: contentType});
      return blob;
  };

  /**
   * Get original name, encryption extension and type for male blob file from selected file for decrypt
   * @param  {string} name name from file selected with encryption extension
   * @return {object}      values from original file
   */
  static getOriginalDataFromName(name) {
    let firstDot = name.lastIndexOf(".");
    const _encryptExtension = name.substr(firstDot + 1);
    let _nameFile = name;
    if (_encryptExtension == 'cfe' || _encryptExtension == 'cfei'){
      const _name = name.substr(0, firstDot);
      firstDot = _name.lastIndexOf(".");
      _nameFile = _name.substr(0, firstDot + 4);
    }
    const _typeFile = mime.lookup(_nameFile);
    return {
      originalName: _nameFile,
      encryptExtension: _encryptExtension,
      typeFile: _typeFile
    }
  }

  /**
   * Get valid public key for encrypt from PEM key 
   * @param  {String} keyPEM utf8 key
   * @return {KEY}        Class OpenPGP KEY
   */
  static getPublicKey(keyPEM){
      const keyHeader = openpgp.key.readArmored(keyPEM);
      console.log('utils getPublicKey keyHeader: ', keyHeader);
      const key = openpgp.key.readArmored(keyPEM).keys[0];
      console.log('utls getPublicKey key: ', key);
      if (key === undefined) return false;
      if (key.verifyPrimaryKey() != openpgp.enums.keyStatus.valid || key.length == 0)
        return false
      return key;
  }

  static getPrivateKey(keyPEM, passPhrase){
    const readKey = openpgp.key.readArmored(keyPEM);
    let privKeyObj = readKey.keys[0];
    console.log('Utils readKeyPGP text privKeyObj: ', privKeyObj);
    const resultDecryptKey = privKeyObj.decrypt(passPhrase);
    console.log('resultDecryptKey', resultDecryptKey);
    if (!resultDecryptKey) return false
    else return privKeyObj;
  }

  /**
   * Get valid private key from file
   * @param  {File} file       File binary or text
   * @param  {String} passPhrase Password for decrypt private key
   * @return {KEY}            Class OpenPGP KEY
   */
  static readKeyPGP(file, passPhrase){
    return new Promise((resolve, reject) => {
      try {
        const reader = new FileReader();

        reader.onload = event => {          
          const keyPEM = event.target.result;
          if (keyPEM.startsWith('-----BEGIN PGP PRIVATE KEY BLOCK-----')){
            const key = Utils.getPrivateKey(keyPEM, passPhrase);
            if (key == false)
              reject(Error('dontReadPrivateKey'));
            else
              resolve(key);
            return;
          }
          else {
            reader.onload = event => {
              const keyBinary = event.target.result;
              const bytes = new Uint8Array(keyBinary);
              const keyPEM = openpgp.armor.encode(openpgp.enums.armor.private_key, bytes);
              const key = Utils.getPrivateKey(keyPEM, passPhrase);
              if (key == false)
                reject(Error('dontReadPrivateKey'));
              else
                resolve(key);
              return;
            }
            reader.readAsArrayBuffer(file);            
          }
        };
        reader.readAsText(file);
      }
      catch (error) {
        reject(Error('dontReadPrivateKey'));
      }
    });
  }

  static getKey(obj,val){
    return Object.keys(obj).find(key => { return obj[key] === val });
  }

  static toHexString(byteArray) {
  return Array.from(byteArray, function(byte) {
    return ('0' + (byte & 0xFF).toString(16)).slice(-2);
  }).join('')
  };

  static byteArrayToLong(/*byte[]*/byteArray) {
    var value = 0;
    for ( var i = byteArray.length - 1; i >= 0; i--) {
        value = (value * 256) + byteArray[i];
    }

    return value;
  };

  static getMD5(value){
    return jsrsasign.crypto.Util.md5(value);
  }

  static clone(obj) {
    if (null == obj || "object" != typeof obj) return obj;
    var copy = obj.constructor();
    for (var attr in obj) {
        if (obj.hasOwnProperty(attr)) copy[attr] = obj[attr];
    }
    return copy;
  }

  static cleanHeaderPEM(data){
    console.log('cleanHeaderPEM: ', data);
    let arrPem = data.split('\n');
    arrPem.splice(0, 1);
    let len = arrPem.length - 2;
    arrPem.splice(len, 2);
    return arrPem.join('\n');
  }

  static b64toBlob(b64Data, contentType, sliceSize) {
    contentType = contentType || '';
    sliceSize = sliceSize || 512;

    const byteCharacters = atob(b64Data);
    let byteArrays = [];

    for (let offset = 0; offset < byteCharacters.length; offset += sliceSize) {
      let slice = byteCharacters.slice(offset, offset + sliceSize);

      let byteNumbers = new Array(slice.length);
      for (let i = 0; i < slice.length; i++) {
        byteNumbers[i] = slice.charCodeAt(i);
      }

      const byteArray = new Uint8Array(byteNumbers);

      byteArrays.push(byteArray);
    }

    const blob = new Blob(byteArrays, {type: contentType});
    return blob;
  };

}
