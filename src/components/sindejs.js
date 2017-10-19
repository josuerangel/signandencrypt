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