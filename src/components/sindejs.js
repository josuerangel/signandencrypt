import * as jsrsasign from 'jsrsasign';
import * as openpgp from 'openpgp';
import Utils from './utils.js';
// import * as moment from 'moment';
import moment from 'moment';
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
                const keyHeader = openpgp.key.readArmored(keyPEM);
                const key = openpgp.key.readArmored(keyPEM).keys[0];
                // console.log('keyHeader: ', keyHeader);
                // console.log('KeyId: ', key.verifyPrimaryUser(keyHeader.keys)[0].keyid.toHex());
                // console.log('KeyId from key: ', key.verifyPrimaryUser([key])[0].keyid.toHex());
                // console.log(Utils.getKey(openpgp.enums.keyStatus, key.verifyPrimaryKey()));
                if (key.verifyPrimaryKey() != openpgp.enums.keyStatus.valid)
                  reject(Error('Error loading public key is not valid, url: ' + url));
                if (key.length == 0) reject(Error('Error loading public key, url: ' + url));
                resolve(key);
            }).catch((error) => {
                reject(Error('Error loading public key, url: ' + url + '\n' + error.message));
            });
        });
    }

    static getInfoFromKeyGPG(key){
      // console.log('openpgp: ', openpgp);
      // console.log('key: ', key);

      // console.log('UserID', key.getPrimaryUser().user.userId.userid);
      // console.log('KeyId: ', key.verifyPrimaryUser([key])[0].keyid.toHex());
      // console.log('Fingerprint: ', key.primaryKey.fingerprint);
      // console.log('Algorithm: ', key.primaryKey.algorithm);

      // // let _mpi = new openpgp.MPI();
      // // _mpi.read(key.primaryKey.mpi);
      // // console.log(_mpi);
      // // console.log('Strength: ', key.primaryKey.mpi.byteLength());

      // console.log('Date: ', key.primaryKey.created.getTime());
      // console.log('Expiration (null not expiration): ', key.getExpirationTime());


      const _expirationDate = key.getExpirationTime();
      const info = {
        userId: key.getPrimaryUser().user.userId.userid,
        keyId: key.verifyPrimaryUser([key])[0].keyid.toHex(),
        fingerprint: key.primaryKey.fingerprint,
        algorithm: key.primaryKey.algorithm,
        creationDate: key.primaryKey.created.getTime(),
        expirationDate: (_expirationDate == null) ? "Never" : _expirationDate
      };
      return info;
    }

  static getPdfDefinition(keys, filesInfo){
    console.log('getPdfDefinition init');
    const _key1 = this.getInfoFromKeyGPG(keys.key1);
    const _key2 = this.getInfoFromKeyGPG(keys.key2);
    const _date = moment().format();
    return {
      styles: {
        header: {
          fontSize: 18,
          bold: true,
          alignment: 'center'
        },
        subheader: {
          fontSize: 15,
          bold: true
        },
      },
      content: [
        { text: 'ACUSE DE GENERACIÓN DE DOCUMENTO .CFEI', style: 'header' },
        '*'.repeat(99) + '\n\n\n\n',
        '*'.repeat(99) + '\n\n',
        { text: 'ENCRIPTACIÓN PASO 1:\n\n', style: 'subheader' },
        'Primary user-ID: ' + _key1.userId,
        'Key-ID: ' + _key1.keyId,
        'Fingerprint: ' + _key1.fingerprint,
        'Algorithm: ' + _key1.algorithm,
        // 'Strength in bit: ',
        'Creation date: ' + moment(_key1.creationDate).format(),
        'Expiration date: ' + _key1.expirationDate,
        '\n\n',
        '*'.repeat(99) + '\n\n',
        { text: 'ENCRIPTACIÓN PASO 2:\n\n', style: 'subheader' },
        'Primary user-ID: ' + _key2.userId,
        'Key-ID: ' + _key2.keyId,
        'Fingerprint: ' + _key2.fingerprint,
        'Algorithm: ' + _key2.algorithm,
        // 'Strength in bit: ',
        'Creation date: ' + moment(_key2.creationDate).format(),
        'Expiration date: ' + _key2.expirationDate,
        '\n\n\n\n',
        '*'.repeat(99) + '\n\n',
        { text: 'RESUMEN:\n\n', style: 'subheader' },
        'Fecha: ' + _date,
        'Arcvhivo original: ' + filesInfo.originalName,
        'Hash (MD5): ' + filesInfo.originalMD5,
        'Tamaño: ' + filesInfo.originalSize,
        '\n\n',
        'Arcvhivo CFE: ' + filesInfo.name,
        'Hash (MD5): ' + filesInfo.MD5,
        'Tamaño: ' + filesInfo.size,
      ]
    }
  }
}