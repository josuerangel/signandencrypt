import * as jsrsasign from 'jsrsasign';
import {fetchCheckText} from './utils.js';

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
      try {
        const reader = new FileReader();
        reader.onload = event => {
          const data = event.target.result;
          const certHex = jsrsasign.ArrayBuffertohex(data);
          const certPem = jsrsasign.KJUR.asn1.ASN1Util.getPEMStringFromHex(certHex, "CERTIFICATE");
          resolve(certPem);
        };
        reader.readAsArrayBuffer(file);
      }
      catch (error) {
        reject(error);
      }
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
        // console.log('readCertificateFromURL arraybuffer: ', arraybuffer);
        const certHex = jsrsasign.ArrayBuffertohex(arraybuffer);
        
        let  certPem = jsrsasign.hextorstr(certHex);
        // console.log('readCertificateFromURL _certStr: ', certPem);
        
        if (!certPem.startsWith('-----BEGIN CERTIFICATE-----'))
          certPem = jsrsasign.KJUR.asn1.ASN1Util.getPEMStringFromHex(certHex, "CERTIFICATE");

        console.log('readCertificateFromURL loaded cert url: : ', url);
        resolve(certPem);
      }).catch((error) => {
        reject(Error('Error readCertificateFromURL, url: ' + url + '\n' + error.message));
      });
    });    
  }

  static validateCertificateOSCP(cert, certCA, url){
    return new Promise((resolve, reject) => {
      console.log('validateCertificateOSCP');
      let haveValid = false;
      let arrResult = [];
      for (var i = 0; i < certCA.length; i++) 
        arrResult[i] = UtilsFIEL._validateCertificate(cert, certCA[i].cert, url);
      
      console.log('validateCertificate arrResult: ', arrResult);
      Promise.all(arrResult).then(values => {
        console.log('Promise all: ', values);
        for (var i = 0; i < values.length; i++) {
          console.log('value in certificate validation: ', values[i].validCertificate);
          if (values[i].validCertificate) {
            console.log('Valid certifica resolve true');
            //resolve(true);
            haveValid = true;
          }
        }
        console.log('after resolve in for');

        if (haveValid) resolve(true);
        else reject(Error('Not valid OSCP'));
      }).catch(reason => {
        console.log('catch reason: ', reason);
        reject(Error(reason.message));
      });
    });
  }

  static _validateCertificate(cert, certCA, url) {
    return new Promise((resolve, reject) => {
      try{
        console.log('_validateCertificate');
        // console.log('_validateCertificate cert: ', cert);
        // console.log('_validateCertificate certCA', certCA);
        let hReq = jsrsasign.KJUR.asn1.ocsp.OCSPUtil.getRequestHex(certCA, cert);
        console.log('hReq: ', hReq);  
        const _url = url + '&hexOSCP=' + hReq;
        fetch(_url, {
          method: 'GET',
          credentials: 'same-origin',
        }).then(fetchCheckText).then((response) => {
          console.log('_validateCertificate response: ', response);
          //const _res = response.json();
          //console.log('_validateCertificate response json: ', _res);
          const responseJSON = JSON.parse(response);
          if (responseJSON.ResponseData != undefined)
            resolve(responseJSON.ResponseData[0]);
          else{
            if (responseJSON.ResponseError[0].ErrorType == "LoginError")
              reject(Error('invalidSession'));
            else
              reject(Error(responseJSON.ResponseError[0].ErrorMessage));
          }

        })
        .catch((error)=>{
          // reject(Error('Error in fetch _validateCertificate :: ' + error.message));
          reject(Error('invalidFetch'));
        });
      }
      catch(error){ // Here error is a simple string, dosen't have error structure.
        console.log('Primary error in _validateCertificate :: ', error);
        // reject(Error('Primary error in _validateCertificate :: ' + error));
        reject(Error('notValid'));
      }
    });
  }

  static readKeyFIELToPEM(file, passPhrase, cert){
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = event => {
        const data = event.target.result;
        try{
          const certificate = new jsrsasign.X509();
          console.log('readKeyFIELToPEM certificate: ', certificate);
          certificate.readCertPEM(cert);
          console.log('readKeyFIELToPEM certificate after read: ', certificate);
          const pubkey = certificate.getPublicKey();
          console.log('readKeyFIELToPEM pubkey: ', pubkey);
          const pubkeyhex = pubkey.n.toString(16);
          console.log('readKeyFIELToPEM pubkey hex: ', pubkeyhex);

          const prvp8hex = jsrsasign.ArrayBuffertohex(data);
          const prvp8pem = jsrsasign.KJUR.asn1.ASN1Util.getPEMStringFromHex(prvp8hex, 'ENCRYPTED PRIVATE KEY');
          const prvkey = jsrsasign.KEYUTIL.getKey(prvp8pem, passPhrase);
          console.log('readKeyFIELToPEM prvkey: ', prvkey);
          const prvkeyhex = prvkey.n.toString(16);
          console.log('readKeyFIELToPEM prvkey hex: ', prvkeyhex);

          if (pubkeyhex !== prvkeyhex){
            console.log('Key file does not match with X509 cetrificate');
            reject(Error('notMatchKeyWithCert'));
            return;
          }

          const prvkeyPem = jsrsasign.KEYUTIL.getPEM(prvkey, "PKCS8PRV");
          resolve(prvkeyPem);
        }
        catch(error){
          console.log('error to decrypt key - ' + error);
          let codeError = error;
          if (error.startsWith('malformed plain PKCS8 private key'))
            codeError = 'invalidPassphrase';

          reject(Error(codeError));
        }
      };
      reader.readAsArrayBuffer(file);
    });
  }
}
