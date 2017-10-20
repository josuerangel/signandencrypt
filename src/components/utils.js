import * as jsrsasign from 'jsrsasign';
import * as openpgp from 'openpgp';
import mime from 'mime-types';
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
      let message = { data: '', type : '' };
      const reader = new FileReader();
      const openpgp = require('openpgp');

      // utf8 message
      reader.onload = event => {
        let data = event.target.result;
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

  static getOriginalDataFromName(name) {
    let firstDot = name.lastIndexOf(".");
    const _encryptExtension = name.substr(firstDot + 1);
    const _nameFile = (_encryptExtension == 'cfe' || _encryptExtension == 'cfei') ? name.substr(0, firstDot) : name;
    const _typeFile = mime.lookup(_nameFile);
    return {
      originalName: _nameFile,
      encryptExtension: _encryptExtension,
      typeFile: _typeFile
    }
  }

  static readKeyPGP(file, passPhrase){
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = event => {
        const data = event.target.result;
        try{
          const bytes = new Uint8Array(data);
          const keyArmored = openpgp.armor.encode(openpgp.enums.armor.private_key, bytes);
          const readKey = openpgp.key.readArmored(keyArmored);
          let privKeyObj = readKey.keys[0];
          const resultDecryptKey = privKeyObj.decrypt(passPhrase);
          console.log('resultDecryptKey', resultDecryptKey);
          if (!resultDecryptKey) reject(Error('Error decrypting key, check passPhrase'));
          resolve(privKeyObj);
        }
        catch(error){
          reject(Error('Error reading openpgp key file: ' + error.message));
        }
      }
      reader.readAsArrayBuffer(file);
    });
  }
}
