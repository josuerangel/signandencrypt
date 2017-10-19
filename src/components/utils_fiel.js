import * as jsrsasign from 'jsrsasign';

export default class UtilsFIEL {
  constructor(parameters = {}){
    /**
     * @file {File}
     * @description file for parse to decrypt
     */
     this.file = parameters.file;
     // this.jsrsasign = require('jsrsasign');
  }

  /**
   * Read and parse file to B64
   * @param {(File)} file for parse to decrypt
   * @returns {Promise} Promise return openpgp message parsed
   */
  static readCertificateToPEM(file){
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = event => {
        const data = event.target.result;
        try {
          const certHex = jsrsasign.ArrayBuffertohex(data);
          const certPem = jsrsasign.KJUR.asn1.ASN1Util.getPEMStringFromHex(certHex, "CERTIFICATE");
          resolve(certPem);
        }
        catch (e) {
          reject(Error('Error readCertificateToPEM: ' + e));
        }
      };
      reader.readAsArrayBuffer(file);
    });
  }

  static readKeyFIELToPEM(file, passPhrase){
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = event => {
        const data = event.target.result;
        try{
          const prvp8hex = jsrsasign.ArrayBuffertohex(data);
          const prvp8pem = jsrsasign.KJUR.asn1.ASN1Util.getPEMStringFromHex(prvp8hex, 'ENCRYPTED PRIVATE KEY');
          const prvkey = jsrsasign.KEYUTIL.getKey(prvp8pem, passPhrase);
          const prvkeyPem = jsrsasign.KEYUTIL.getPEM(prvkey, "PKCS8PRV");
          resolve(prvkeyPem);
        }
        catch(e){
          reject(Error('Error readKeyFIELToPEM: ' + e));
        }
      };
      reader.readAsArrayBuffer(file);
    });
  }
}
