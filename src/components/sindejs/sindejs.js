import * as jsrsasign from 'jsrsasign';
import * as openpgp from 'openpgp';
import Utils from './utils.js';
import moment from 'moment';
import * as asn1js from "asn1js";
import {ContentInfo, EncapsulatedContentInfo, SignedData } from 'pkijs';

// export function sindejs() {
//     console.log('new instance sindejs');
//     if (!(this instanceof sindejs)){
//       return new sindejs();
//     }
// }

 export default class sindejs {
//class sindejs {
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
      self = this;
      console.log(openpgp);
  };

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
                  // sAttr: {},
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
          } catch (error) {
              reject(Error('Error sindejs.sing: ' + error));
          }
      });
  }

  static getSignedData(cmsPem){
    console.log('cmsPem: ', cmsPem);
    console.log('getSignedData typeof: ', typeof cmsPem.data);
    if (typeof cmsPem.data === 'string') return sindejs.getSignedDataFromUTF8(cmsPem);
    else return sindejs.getSignedDataFromBinary(cmsPem);
  }

  static getSignedDataFromUTF8(cmsPem){
    return new Promise((resolve, reject) => {
      let result = {};
      try{
        cmsPem = Utils.cleanHeaderPEM(cmsPem.data);
        console.log('cmsPem', cmsPem);
        const hexpem = jsrsasign.b64nltohex(cmsPem);
        console.log('hexpem: ', hexpem);
        let resultCMS = jsrsasign.KJUR.asn1.cms.CMSUtil.verifySignedData({ cms: hexpem });
        console.log('resultCMS: ', resultCMS);
        let hexresult = resultCMS.parse.econtent;
        console.log('hexresult: ', hexresult);
        let resultString = jsrsasign.hextorstr(hexresult);
        console.log('resultString: ', resultString);
        result.messageB64 = resultString;

        console.log('issuerstring: ', resultCMS.certs[0].getIssuerString());
        console.log('getSubjectString: ', resultCMS.certs[0].getSubjectString());
        console.log('getSerialNumberHex: ', resultCMS.certs[0].getSerialNumberHex());
        console.log('getSerialNumberUTF8: ', jsrsasign.hextoutf8(resultCMS.certs[0].getSerialNumberHex()));
        console.log('getPublicKey: ', resultCMS.certs[0].getPublicKey());
        console.log('getPublicKey n: ', resultCMS.certs[0].getPublicKey().n.toString(16));
        console.log('getSignatureAlgorithmName: ', resultCMS.certs[0].getSignatureAlgorithmName());
        console.log('getSignatureValueHex: ', resultCMS.certs[0].getSignatureValueHex());
        console.log('getInfo: ', resultCMS.certs[0].getInfo());
        result.certInfo = resultCMS.certs[0].getInfo();

        resolve(result);
      }
      catch(error){
        reject(Error('Error getSignedData\n' + error.message));
      }
    });    
  }

  static getSignedDataFromBinary(cms) {
    return new Promise((resolve, reject) => {
      try{
        console.log('parseFile init');
        console.log('cms: \n', cms);

        const file = new File([cms.data], 'binaryDecrypt.temp');
        console.log('file: ', file);
        const reader = new FileReader();
        reader.onload = (event) => sindejs.parseBinaryFile(event.target.result, resolve, reject);
        reader.readAsArrayBuffer(file);
      }catch(error){
        reject(Error('Error getSignedDataFromBinary\n' + error.message));
      }

  });
  }

  static parseBinaryFile(arraybuffer, resolve, reject){
    try{
      const asn1 = asn1js.fromBER(arraybuffer);
      console.log('asn1: ', asn1);

      // const asn1 = asn1js.fromBER(certificateBuffer);
      // const certificate = new Certificate({ schema: asn1.result });
      // console.log('certificate: ', certificate);

      const cmsContentSimpl = new ContentInfo({schema: asn1.result});
      console.log("cmsContentSimpl: ", cmsContentSimpl);

      const cmsSignedSimpl = new SignedData({schema: cmsContentSimpl.content});
      console.log("cmsSignedSimpl: ", cmsSignedSimpl);

      const cmsEncapsulatedSimpl = new EncapsulatedContentInfo(cmsSignedSimpl.encapContentInfo);
      console.log('cmsEncapsulatedSimpl: ', cmsEncapsulatedSimpl);

      let offset = 0;
      const bytesContent = new Uint8Array(cmsEncapsulatedSimpl.eContent.valueBlock.value[0].valueBlock.valueHex, offset, ((offset + 65536) > cmsEncapsulatedSimpl.eContent.valueBlock.value[0].valueBlock.valueHex.byteLength)
        ? (cmsEncapsulatedSimpl.eContent.valueBlock.value[0].valueBlock.valueHex.byteLength - offset)
        : 65536);
      console.log('bytesContent: ', bytesContent);

      let bytesItem;
      let arrBytes = cmsEncapsulatedSimpl.eContent.valueBlock.value.map((item) => {
        bytesItem = new Uint8Array(item.valueBlock.valueHex, offset, ((offset + 65536) > item.valueBlock.valueHex.byteLength)
          ? (item.valueBlock.valueHex.byteLength - offset)
          : 65536);
        return bytesItem;
      });

      resolve({ messageB64: arrBytes });
    }
    catch(error){
      reject(Error('Error parseBinaryFile\n' + error.message));
    }
    ///let blobfile = new Blob(arrBytes, {type: this.dataFileForDecrypt.typeExtension});
    //console.log('arr blob: ', blobfile);

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

      try{
        openpgp.decrypt(options).then((plaintext) => {
          messageForDecrypt = plaintext;
          console.log('after fisrt decrypt plaintext: ', plaintext);
          console.log('after fisrt decrypt data');
          console.log(plaintext.data);

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
          });
        }); 
      }
      catch(e){
        reject(Error('Error in decrypt: ' + e.message));
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
    const _expirationDate = key.getExpirationTime();
    const info = {
      userId: key.getPrimaryUser().user.userId.userid,
      keyId: key.verifyPrimaryUser([key])[0].keyid.toHex(),
      fingerprint: key.primaryKey.fingerprint,
      algorithm: key.primaryKey.algorithm,
      creationDate: key.primaryKey.created.getTime(),
      expirationDate: (_expirationDate == null) ? "never" : _expirationDate
    };
    return info;
  }

  static getStructureKey(keyData, lng, number){
    return [
      '*'.repeat(99) + '\n\n',
      { text: lng.subheader_encryption + ' ' + number + ':\n\n', style: 'subheader' },
      lng.key.userId + keyData.userId,
      lng.key.keyId + keyData.keyId,
      lng.key.fingerprint + keyData.fingerprint,
      lng.key.algorithm + keyData.algorithm,
      lng.key.creationDate + moment(keyData.creationDate).format(),
      lng.key.expirationDate + keyData.expirationDate,
      '\n\n',
    ];
  }
  
  static getPdfDefinition(keys, filesInfo, languaje, typeProcess = 'encrypt'){
    console.log('getPdfDefinition init', languaje, typeProcess);
    const _key1 = this.getInfoFromKeyGPG(keys.key1);
    const _key2 = this.getInfoFromKeyGPG(keys.key2);
    const _date = moment().format();
    const _ext = filesInfo.encryptionExtension.toUpperCase();

    let en = {
      header : 'ACKNOWLEDGMENT OF DOCUMENT GENERATION',
      subheader_encryption: 'ENCRYPTION STEP',
      subheader_sign: 'ELECTRONIC SIGNATURE',
      key: {
        userId: 'Primary user-ID: ',
        keyId: 'Key-ID: ',
        fingerprint: 'Fingerprint: ',
        algorithm: 'Algorithm: ',
        creationDate: 'Creation date: ',
        expirationDate: 'Expiration date: ',
      },
      resume: {
        header: 'RESUME:',
        date: 'Date: ',
        originalFileName: 'Original file: ',
        md5: 'Hash (MD5): ',
        size: 'Size in bytes: ',
        finalFileName: _ext + ' file: ',
      }
    };
    
    let sp = new Utils.clone(en);
    sp.resume = new Utils.clone(en.resume);
    sp.header = 'ACUSE DE GENERACIÓN DE DOCUMENTO';
    sp.subheader_encryption = 'ENCRIPTACIÓN PASO';
    sp.subheader_sign = 'FIRMA ELECTRÓNICA';
    sp.resume.header = 'RESUMEN: ';
    sp.resume.date = 'Fecha: ';
    sp.resume.originalFileName = 'Archivo original: ';
    sp.resume.size = 'Tamaño en bytes: ';
    sp.resume.finalFileName = 'Archivo ' + _ext + ': ';

    if (typeProcess === 'decrypt'){
      en.header = 'ACKNOWLEDGMENT OF DOCUMENT OF DECRYPTION ';
      en.subheader_encryption = 'DECRYPTION STEP ';
      en.resume.originalFileName = _ext + ' file: ';
      en.resume.finalFileName = 'Decrypted file: ';

      sp.header = 'ACUSE DE DESENCRIPTACIÓN DE DOCUMENTO';
      sp.subheader_encryption = 'DESENCRIPTACIÓN PASO';
      sp.resume.originalFileName = 'Archivo ' + _ext + ': ';
      sp.resume.finalFileName = 'Archivo desencriptado: ';
    }

    let lng = (languaje == 'sp') ? sp : en;
    let _contentKey1 = sindejs.getStructureKey(_key1, lng, 1);
    let _contentKey2 = sindejs.getStructureKey(_key2, lng, 2);
    if (typeProcess === 'decrypt'){
      _contentKey1 = sindejs.getStructureKey(_key2, lng, 1);
      _contentKey2 = sindejs.getStructureKey(_key1, lng, 2);
    }

    let _contentCertificate = [];
    if (filesInfo.certInfo !== undefined){
      _contentCertificate.push('*'.repeat(99) + '\n\n');
      _contentCertificate.push({ text: lng.subheader_sign + ':\n\n', style: 'subheader' });
      _contentCertificate.push(filesInfo.certInfo);
      _contentCertificate.push('\n\n');
    }

    const _contentHeader = { text: lng.header + " ." + filesInfo.encryptionExtension.toUpperCase(), style: 'header' };
    const _contentResume = [
      '*'.repeat(99) + '\n\n',
      { text: lng.resume.header+'\n\n', style: 'subheader' },
      lng.resume.date + _date,
      '\n\n',
      lng.resume.originalFileName + filesInfo.originalName,
      lng.resume.md5 + filesInfo.originalMD5,
      lng.resume.size + filesInfo.originalSize,
      '\n\n',
      lng.resume.finalFileName + filesInfo.name,
      lng.resume.md5 + filesInfo.MD5,
      lng.resume.size + filesInfo.size,
    ];
    let _content = [_contentHeader].concat(_contentCertificate, _contentKey1, _contentKey2, _contentResume);

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
      content: _content,
    }
  }
};

module.exports = sindejs