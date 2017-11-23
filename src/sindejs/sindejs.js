import * as jsrsasign from 'jsrsasign';
import * as openpgp from 'openpgp';
import Utils from './utils.js';
import UtilsFIEL from './utils_fiel.js'
import moment from 'moment';
import * as asn1js from "asn1js";
import RSAPublicKey from '../../node_modules/pkijs/build/RSAPublicKey.js';
import ContentInfo from '../../node_modules/pkijs/build/ContentInfo.js';
import EncapsulatedContentInfo from '../../node_modules/pkijs/build/EncapsulatedContentInfo.js';
import SignedData from '../../node_modules/pkijs/build/SignedData.js';

export default class sindejs {
  constructor(parameters = {}) {
      /**
       * @fetchInit {JSON}
       * @Configurations for fetch to get public keys
       */
      this.fetchInit = {
          method: 'GET',
          headers: new Headers(),
          mode: 'cors',
          cache: 'default'
      };
  };

  /**
   * Sing message with openpgpjs
   * @param  {String} message message for sign, most common in B64
   * @param  {String} cert    PEM certificate
   * @param  {String} key     PEM key without encryption
   * @return {String}         message encrypted
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
          try {
              const sd = jsrsasign.KJUR.asn1.cms.CMSUtil.newSignedData(param);
              resolve(sd.getPEM());
          } catch (error) {
              reject(Error('Error sindejs.sing: ' + error));
          }
      });
  }

  /**
   * Check if message is string for execute new decryption.
   * @param  {Object/String} cmsPem message to get original data.
   * @return {Object}        Object with original data in B64 and certificate information for PDF.
   */
  static getSignedData(cmsPem){
    console.log('cmsPem: ', cmsPem);
    console.log('getSignedData typeof: ', typeof cmsPem.data);
    if (typeof cmsPem.data === 'string') return sindejs.getSignedDataFromUTF8(cmsPem);
    else return sindejs.getSignedDataFromBinary(cmsPem);
  }

  /**
   * Get original data from new encryption
   * @param  {String} cmsPem CMS PEM
   * @return {Object}        Object with original data in B64 and certificate information for PDF.
   */
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

  /**
   * Get original data from files encrypted with applet
   * @param  {Object} cms Binary object
   * @return {Object}     Object with original data in binary format and certificate information for PDF.
   */
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

  /**
   * Get original data and certificate information
   * @param  {ArrayBuffer} arraybuffer CMS after decryption
   * @param  {Function} resolve     Function resolve
   * @param  {Function} reject      Function reject
   * @return {Object}     Object with original data in binary format and certificate information for PDF.
   */
  static parseBinaryFile(arraybuffer, resolve, reject){
    try{
      const asn1 = asn1js.fromBER(arraybuffer);
      console.log('asn1: ', asn1);

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

      const certInfo = sindejs.getCertInfoFromPKIJSCert(cmsSignedSimpl);
      resolve({ messageB64: arrBytes, certInfo: certInfo });
    }
    catch(error){
      reject(Error('Error parseBinaryFile\n' + error.message));
    }
  }

  /**
   * Rean certificate from PEM
   * @param  {String} certPem PEM Certificate
   * @return {String}         Information about certificate
   */
  static getCertInfo(certPem){
    const certificate = new jsrsasign.X509();
    certificate.readCertPEM(certPem);
    return certificate.getInfo();
  }

  /**
   * Read information about certificate from PKIJS.SignedData class
   * @param  {PKIJS.SignedData} signeddata Class PKIJS.SignedData after decryption.
   * @return {String}            Information about certificate
   */
  static getCertInfoFromPKIJSCert(signeddata){
    console.log('getCertInfoFromPKIJSCert signeddata: ', signeddata);
    let resultCertInfo = '';
    const certificate = signeddata.certificates[0];    

    resultCertInfo += 'SerialNumber: ' + jsrsasign.ArrayBuffertohex(certificate.serialNumber.valueBlock.valueHex);

    //region Put information about X.509 certificate issuer
    resultCertInfo += '\nIssuer: '
    const rdnmap = {
      "2.5.4.6": "C",
      "2.5.4.10": "OU",
      "2.5.4.11": "O",
      "2.5.4.3": "CN",
      "2.5.4.7": "L",
      "2.5.4.8": "S",
      "2.5.4.12": "T",
      "2.5.4.42": "GN",
      "2.5.4.43": "I",
      "2.5.4.4": "SN",
      "1.2.840.113549.1.9.1": "E-mail"
    };
    
    for(const typeAndValue of certificate.issuer.typesAndValues)
    {
      let typeval = rdnmap[typeAndValue.type];
      if(typeof typeval === "undefined")
        typeval = typeAndValue.type;
      
      const subjval = typeAndValue.value.valueBlock.value;
      resultCertInfo += typeval + '=' + subjval + ',';
    }
    //endregion
    
    // dates
    resultCertInfo += '\nStart Date: ' + certificate.notBefore.value.toUTCString();
    resultCertInfo += '\nFinal Date: ' + certificate.notAfter.value.toUTCString();

    //region Put information about X.509 certificate subject
    resultCertInfo += '\nSubject: ';
    for(const typeAndValue of certificate.subject.typesAndValues)
    {
      let typeval = rdnmap[typeAndValue.type];
      if(typeof typeval === "undefined")
        typeval = typeAndValue.type;
      
      const subjval = typeAndValue.value.valueBlock.value;
      resultCertInfo += typeval + '=' + subjval + ',';
    }
    //endregion

    //region Put information about signature algorithm
    const algomap = {
      "1.2.840.113549.1.1.2": "MD2 with RSA",
      "1.2.840.113549.1.1.4": "MD5 with RSA",
      "1.2.840.10040.4.3": "SHA1 with DSA",
      "1.2.840.10045.4.1": "SHA1 with ECDSA",
      "1.2.840.10045.4.3.2": "SHA256 with ECDSA",
      "1.2.840.10045.4.3.3": "SHA384 with ECDSA",
      "1.2.840.10045.4.3.4": "SHA512 with ECDSA",
      "1.2.840.113549.1.1.10": "RSA-PSS",
      "1.2.840.113549.1.1.5": "SHA1 with RSA",
      "1.2.840.113549.1.1.14": "SHA224 with RSA",
      "1.2.840.113549.1.1.11": "SHA256 with RSA",
      "1.2.840.113549.1.1.12": "SHA384 with RSA",
      "1.2.840.113549.1.1.13": "SHA512 with RSA"
    };       // array mapping of common algorithm OIDs and corresponding types
    
    let signatureAlgorithm = algomap[certificate.signatureAlgorithm.algorithmId];
    if(typeof signatureAlgorithm === "undefined")
      signatureAlgorithm = certificate.signatureAlgorithm.algorithmId;
    else
      signatureAlgorithm = `${signatureAlgorithm} (${certificate.signatureAlgorithm.algorithmId})`;
    
    resultCertInfo += '\nSignature Algorithm: ' + signatureAlgorithm;


    // loop to get extensions
    resultCertInfo += '\nExtensions: ';
    let extenval = '';
    for(let i = 0; i < certificate.extensions.length; i++)
    {
      // OID map
      const extenmap = {
        "2.5.29.1": "old Authority Key Identifier",
        "2.5.29.2": "old Primary Key Attributes",
        "2.5.29.3": "Certificate Policies",
        "2.5.29.4": "Primary Key Usage Restriction",
        "2.5.29.9": "Subject Directory Attributes",
        "2.5.29.14": "Subject Key Identifier",
        "2.5.29.15": "Key Usage",
        "2.5.29.16": "Private Key Usage Period",
        "2.5.29.17": "Subject Alternative Name",
        "2.5.29.18": "Issuer Alternative Name",
        "2.5.29.19": "Basic Constraints",
        "2.5.29.28": "Issuing Distribution Point",
        "2.5.29.29": "Certificate Issuer",
        "2.5.29.30": "Name Constraints",
        "2.5.29.31": "CRL Distribution Points",
        "2.5.29.32": "Certificate Policies",
        "2.5.29.33": "Policy Mappings",
        "2.5.29.35": "Authority Key Identifier",
        "2.5.29.36": "Policy Constraints",
        "2.5.29.37": "Extended key usage",
        "2.5.29.54": "X.509 version 3 certificate extension Inhibit Any-policy"
      };
      extenval = extenmap[certificate.extensions[i].extnID];
      console.log('extenval: ',extenval);
      resultCertInfo += extenval + ',';
    };

    return resultCertInfo;
  };


  /**
   * Encrypt a message with openpgp.js
   * @param  {String} message Message to encrypt
   * @param  {Object} keys    Public keys to encrypt
   * @return {String}         Message encrypted
   */
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
   * Decrypt a message with openpgp.js
   * @param  {String} message     Message to decrypt
   * @param  {String} format      binary or uft8
   * @param  {Object} publicKeys  Public keys for decrypt
   * @param  {Object} privateKeys Private keys for decrypt
   * @return {String}             Message decrypted
   */
  static decrypt(message, format, publicKeys, privateKeys){
    console.log('sindejs decrypt init');
    return new Promise((resolve, reject) => {
      let messageForDecrypt;
      let options = {
        message: message,
        publicKeys: publicKeys.key2,
        privateKey: privateKeys.key2,
        format: format
      };

      try{
        console.log('sindejs decrypt before first decrypt');
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
          }, (error) => {
            console.log('error first key invalid for decrypt:', error);
            reject(Error('firstKeyInvalidForDecrypt'));            
          });
        }, (error) => { 
          console.log('error second key invalid for decrypt:', error);
          reject(Error('secondKeyInvalidForDecrypt'));
        }); 
      }
      catch(error){
        console.log('sindejs decrypt error: ', error);
        reject(Error('decryptError'));
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
        console.log('loadPublicKey arraybuffer: ', arraybuffer);
        const _temp = new File([arraybuffer], "tempPublicKey.gpg");
        
        let reader = new FileReader();
        reader.onload = event => {
          let keyPEM = event.target.result;
          console.log('loadPublicKey readAsText: ', keyPEM);
          console.log('loadPublicKey readAsText startsWith: ', keyPEM.startsWith('-----BEGIN PGP PUBLIC KEY BLOCK-----'));
          
          if (keyPEM.startsWith('-----BEGIN PGP PUBLIC KEY BLOCK-----')){
            let key = Utils.getPublicKey(keyPEM);
            if (key == false)
              reject(Error('dontReadPublicKey'));
            else
              resolve(key);
            return;
          }
          else {
            reader = new FileReader();
            reader.onload = event => {
              const keyBinary = event.target.result;
              keyPEM = Utils._arrayBufferToPublicKeyPEM(keyBinary);
              let key = Utils.getPublicKey(keyPEM);
              if (key == false)
                reject(Error('dontReadPublicKey'));
              else
                resolve(key);
              return;
            };
            reader.readAsArrayBuffer(_temp);
          }
        };
        reader.readAsText(_temp);

      }).catch((error) => {
        reject(Error('Error loading public key, url: ' + url + '\n' + error.message));
      });
    });
  }

  /**
   * Det data from PGP key
   * @param  {OPENPGP.KEY} key OPENPGP.KEY class
   * @return {Object}     Information about the KEY
   */
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

  /**
   * Get key template for PDF in json
   * @param  {Object} keyData Data about key
   * @param  {Object} lng     JSON Object with message
   * @param  {Number} number  Number of key
   * @return {Object}         JSON with structure for PDF
   */
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
  
  /**
   * Get JSON structur for makePDF
   * @param  {OPENPGP.KEY} keys   OPENPGP.KEY class
   * @param  {Object} filesInfo   JSON with info about files to encrypt or decrypt
   * @param  {String} languaje    Languaje 'sp' or 'en'
   * @param  {String} typeProcess Type of process for mesage in PDF
   * @return {Object}             JSON objecto for makePDF
   */
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

  /**
   * Read  and validate OSCP certification
   * @param  {[type]} file [description]
   * @param  {[type]} CA   [description]
   * @return {[type]}      [description]
   */
  static readAndValidateCertificate(file, CA, OSCPUrl){
    return new Promise((resolve, reject) => {
      console.log('readAndValidateCertificate');
      const readCert = UtilsFIEL.readCertificateToPEM(file);
      readCert.then((data) => {
        console.log('loaded certificate: ');
        console.log(data);

        const validateCert = UtilsFIEL.validateCertificateOSCP(data, CA, OSCPUrl);
        validateCert.then(
          (valid) => {
            console.log('readAndValidateCertificate valid: ', valid);
            resolve(data);
          },
          (error) => {
            console.log('Error readAndValidateCertificate', error);
            reject(Error(error.message));
          }
        );

      }, (error) => {
        console.log('Error readAndValidateCertificate', error);
        reject(error);
      });
    });
  }
};

module.exports = sindejs