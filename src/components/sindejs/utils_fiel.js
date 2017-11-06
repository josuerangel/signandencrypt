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
        
        let  certPem = jsrsasign.hextorstr(certHex);
        console.log('readCertificateFromURL _certStr: ', certPem);
        
        if (!certPem.startsWith('-----BEGIN CERTIFICATE-----'))
          certPem = jsrsasign.KJUR.asn1.ASN1Util.getPEMStringFromHex(certHex, "CERTIFICATE");

        console.log('readCertificateFromURL loaded cert url: : ', url);
        resolve(certPem);
      }).catch((error) => {
        reject(Error('Error readCertificateFromURL, url: ' + url + '\n' + error.message));
      });
    });    
  }

  static validateCertificateOSCP(cert, certCA, url = "../../filter/SvtFIEL?option=validateCert"){
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
        reject(Error(reason));
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
              reject("Session error");
            else
              reject(responseJSON.ResponseError[0].ErrorMessage);
          }

        })
        .catch((error)=>{
          reject(Error('Error _validateCertificate :: ' + error.message));
        });
      }
      catch(error){
        reject(Error('Error _validateCertificate :: ' + error));
      }
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
