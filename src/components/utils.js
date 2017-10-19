import * as jsrsasign from 'jsrsasign';
import * as openpgp from 'openpgp';
export default class Utils {
  constructor(parameters = {}){
    /**
     * @file {File}
     * @description file for parse to decrypt
     */
     this.file = parameters.file;
     // this.jsrsasign = require('jsrsasign');
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

      // ascii message
      reader.onload = event => {
        let data = event.target.result;
        try{
          message.data = openpgp.message.readArmored(data);
          message.type = 'ascii';
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
}
