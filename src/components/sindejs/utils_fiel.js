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

  /**
   * Rean and parse remote file from url to B64
   * @param  {String} url URL from remote file
   * @return {Promise}     Promise return PEM certificate
   */
  static readCertificateFromURL(url){
    return new Promise((resolve, reject) => {
      fetch(url, this.fetchInit).then((response) => {
        // console.log('readCertificateFromURL response: ',response);
        return response.arrayBuffer();
      }).then((arraybuffer) => {
        console.log('readCertificateFromURL arraybuffer: ', arraybuffer);
        const certHex = jsrsasign.ArrayBuffertohex(arraybuffer);
        const certPem = jsrsasign.KJUR.asn1.ASN1Util.getPEMStringFromHex(certHex, "CERTIFICATE");
        console.log('readCertificateFromURL loaded cert url: : ', url);
        resolve(certPem);
      }).catch((error) => {
        reject(Error('Error readCertificateFromURL, url: ' + url + '\n' + error.message));
      });
    });    
  }

  static validateCertificate(cert, certCA){
    return new Promise((resolve, reject) => {
      console.log('validateCertificateOSCP');
      resolve('ok');
//     // generate OCSP request using sha1 algorithnm by default.
//     let hReq = this.jsrsasign.KJUR.asn1.ocsp.OCSPUtil.getRequestHex(this.certCA, this.FIEL.certificatePem);
//     console.log('hReq: ', hReq);

//     let _abReq = this.jsrsasign.hextoArrayBuffer(hReq);
//     let _blob = new Blob([_abReq], {type: "octet/stream"});

//     let _headers = new Headers();
//     _headers.append("Content-Type", "application/ocsp-request");
//     _headers.append("Accept","application/ocsp-response");

//     let _data = new FormData();
//     _data.append("hexOSCP", hReq);

//     let _options = {
//       method: 'GET',
// //      headers: _headers,
//       mode: 'cors',
//       //body: _data
//     };

//     const _url = "../../SvtValidateCertificate?hexOSCP=" + hReq;
//     let _request = new Request(_url, _options);

//     fetch(_url, _options).then(this.checkStatus).then((response) => {
//       console.log(response);
//     });
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
