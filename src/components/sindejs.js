import * as jsrsasign from 'jsrsasign';
import * as openpgp from 'openpgp';
import Utils from './utils.js';
export default class sindejs {
    constructor(parameters = {}) {
        /**
         * @file {File}
         * @description file for parse to decrypt
         */
        // this.file = parameters.file;
        this.fetchInit = {
            method: 'GET',
            headers: new Headers(),
            mode: 'cors',
            cache: 'default'
        };
    }
    /**
     * Read and parse file to B64
     * @param {(File)} file for parse to decrypt
     * @returns {Promise} Promise return openpgp message parsed
     */
    static sing(message, cert, key) {
        return new Promise((resolve, reject) => {
            console.log('sing init');
            if (message == undefined || message == null) alert('error message do not exist');
            if (cert == undefined || cert == null) alert('error certifate do not exist');
            if (key == undefined || key == null) alert('error key do not exist');
            let param = {
                content: {
                    str: message
                },
                certs: [cert],
                signerInfos: [{
                    hashAlg: 'sha256',
                    sAttr: {},
                    signerCert: cert,
                    sigAlg: 'SHA256withRSA',
                    signerPrvKey: key
                }]
            };
            // if (f1.signingtime1.checked) {
            //   param.signerInfos[0].sAttr.SigningTime = {};
            // }
            try {
                const sd = jsrsasign.KJUR.asn1.cms.CMSUtil.newSignedData(param);
                resolve(sd.getPEM());
            } catch (ex) {
                reject(Error('Error sing: ' + e));
            }
        });
    }

    static encrypt(message, keys){
      return new Promise((resolve, reject) => {
        console.log('encrypt init');

        let options = {
          data: message,
          publicKeys: keys.key1,
        };

        try{
        openpgp.encrypt(options).then((ciphertext) => {
          console.log('fisrt pass encrypted: ', ciphertext);
          options.data = ciphertext.data;
          options.publicKeys = keys.key2;

          openpgp.encrypt(options).then((ciphertext) => {
            console.log('second pass encrypted: ', ciphertext);
            resolve(ciphertext.data);
          });
        });
        }
        catch(e){
          reject(Error('Error in encrypt: ' + e.message));
        }     
      });
    }

    static decrypt(message, format, publicKeys, privateKeys){
      return new Promise((resolve, reject) => {
        let messageForDecrypt;
        let options = {
          message: message,
          publicKeys: publicKeys.key2,
          privateKey: privateKeys.key2,
          format: format
        };

        // if (format == 'binary') options.format = 'binary';
        try{
        openpgp.decrypt(options).then((plaintext) => {
          messageForDecrypt = plaintext;
          console.log('after fisrt decrypt plaintext: ', plaintext);
          console.log('after fisrt decrypt data');
          console.log(plaintext.data);

          // if (this.privateKey1 != undefined) {
            let data = messageForDecrypt.data;
            console.log('second raw: ', data);

            if (format == 'binary') messageForDecrypt = openpgp.message.read(data);
            else messageForDecrypt = openpgp.message.readArmored(data);
            console.log('readed: ', messageForDecrypt);

            options = {
              message: messageForDecrypt,
              publicKeys: publicKeys.key1,
              privateKey: privateKeys.key1,
              format: format
            };

            openpgp.decrypt(options).then((plaintext) => {
              console.log('second key', plaintext);
              console.log('binary to blob: ', plaintext.data);
              console.log('binary buffer to blob: ', plaintext.data.buffer);

              resolve(plaintext);

              // const typeFile = mime.lookup(this.dataFileForDecrypt.name);
              // console.log('typeFile: ', typeFile);
              // this.dataFileForDecrypt.typeExtension = typeFile;

              // let blobfile = new Blob([plaintext.data], {type: typeFile});
              // console.log('blob: ', blobfile);

              // let FileSaver = require('file-saver');

              // if (this.dataFileForDecrypt.encryptExtension == 'cfei') {
              //   FileSaver.saveAs(blobfile, this.dataFileForDecrypt.name);
              // } else {
              //   console.log('inside national');
                // let file = new File([plaintext.data], this.dataFileForDecrypt.name, {type: typeFile});
                // console.log('file: ', file);
                // const reader = new FileReader();
                // reader.onload = (event) => this.parseFile(event.target.result);
                // reader.readAsArrayBuffer(file);
              // }
            });
          // }
        }); 
        }
        catch(e){
          reject(Error('Error in decrypt: ' + e.message));
        }  
      });
    }

    static unsing(cms){
      return new Promise((resolve, reject) => {
        try{

        }
        catch(e){
          reject(Error('Error in unsing: ' + e.message));
        }
      });
    }
    
    /**
     * Load PGP key from url, convert to object key for pgp encrypt
     * @param  {string} URL to get binary key
     * @return {object} OPENPGP Key Object
     */
    static loadPublicKey(url) {
        return new Promise((resolve, reject) => {
            fetch(url, this.fetchInit).then((response) => {
                return response.arrayBuffer();
            }).then((arraybuffer) => {
                const keyPEM = Utils._arrayBufferToPublicKeyPEM(arraybuffer);
                const key1 = openpgp.key.readArmored(keyPEM).keys;
                if (key1.length == 0) reject(Error('Error loading public key, url: ' + url));
                resolve(key1);
            }).catch((error) => {
                reject(Error('Error loading public key, url: ' + error.message));
            });
        });
    }
}