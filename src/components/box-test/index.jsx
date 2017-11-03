import React from 'react';
import PropTypes from 'prop-types';
import mime from 'mime-types';
import * as asn1js from "asn1js";
import {ContentInfo, EncapsulatedContentInfo, SignedData } from 'pkijs';
import sindejs from '../sindejs/sindejs.js';
import Utils from '../sindejs/utils.js';
import UtilsFIEL from '../sindejs/utils_fiel.js';
// import * as sindejs from '../sindejs.js';

import * as FileSaver from 'file-saver';
// import * as pdfMake from 'pdfmake/build/pdfmake';
// import * as vfsFonts from 'pdfmake/build/vfs_fonts.js';
import pdfMake from "pdfmake/build/pdfmake";
import pdfFonts from "pdfmake/build/vfs_fonts";
pdfMake.vfs = pdfFonts.pdfMake.vfs;

// import '../css/styles.min.css';
// import { Row, Col, FormRow, FormField, FormInput, FileUpload, Button, Spinner} from 'elemental';

class BoxTest extends React.Component {
  constructor(props) {
    super(props);

    this.messageForEncryptB64;
    this.publicKeys = {};
    this.privateKeys = {};



    this.publicKey1;
    this.publicKey2;
    this.privateKey1;
    this.publicKey2;
    this.privateKey2;
    this.messageForDecrypt;
    this.messageForEncryptBinary;
    this.messageForEncryptUnit8Array;
    this.messageForEncryptArrayBuffer;




    this.inputPublicKey1;
    this.inputPrivateKey1;
    this.fileForDecrypt;
    this.dataFileForDecrypt = {};
    this.dataFileForEncrypt = {};
    this.FIEL = {};
    this.openpgp = require('openpgp');
    this.jsrsasign = require('jsrsasign');
    this.state = {
      passPhrase: '12345678a',
      nameFileToDecrypt: ''
    }
  }

  componentDidMount(){
    console.log('sindejs: ', sindejs);
    const _loadPublicKey1 = sindejs.loadPublicKey(this.props.publicKey1);
    _loadPublicKey1.then(
      (key) => { this.publicKeys.key1 = key; console.log('_loadKey1'); console.log(this.publicKeys.key1); }, 
      (error) => { console.log(error) }
    );

    const _loadPublicKey2 = sindejs.loadPublicKey(this.props.publicKey2);
    _loadPublicKey2.then(
      (key) => { this.publicKeys.key2 = key; console.log('_loadKey2'); console.log(this.publicKeys.key2); }, 
      (error) => { console.log(error) }
    );

    const _dataFilesPDF = {
          encryptionExtension: '.cfei',
          originalName: 'this.dataFileForEncrypt.originalName',
          originalMD5: 'this.dataFileForEncrypt.md5',
          originalSize: 'this.dataFileForEncrypt.size',
          name: 'this.dataFileForEncrypt.originalName' + ".cfei",
          MD5: Utils.getMD5('messageEncrypted'),
          size: 'blobfile.size'
        };
    Promise.all([_loadPublicKey1, _loadPublicKey2]).then((values) => {
      // console.log('openpgp: ', openpgp);
      console.log('sindejs: ', sindejs);
      console.log('docDefinition: ',sindejs.getPdfDefinition(this.publicKeys, _dataFilesPDF, 'en'));
    });
  }

  handlePublicKey(e) {
    let file = e.target.files[0];
    const nameKey = e.target.id;
    const reader = new FileReader();
    reader.onload = (event) => this.loadPublicKey(event.target.result, nameKey);
    reader.readAsArrayBuffer(file);
  }

  loadPublicKey(data, nameKey) {
    console.log(nameKey);
    console.log(data);
    let readKey;

    if (data.startsWith == undefined) {
      const bytes = new Uint8Array(data);
      data = this.openpgp.armor.encode(this.openpgp.enums.armor.public_key, bytes);
    }
    console.log(data);
    readKey = this.openpgp.key.readArmored(data).keys;
    console.log(readKey);

    if (nameKey == "publicKey1")
      this.publicKey1 = readKey;

    if (nameKey == "publicKey2")
      this.publicKey2 = readKey;
    }

  handlePrivateKey(e) {
    let file = e.target.files[0];
    const nameKey = e.target.id;
    const reader = new FileReader();
    reader.onload = (event) => this.loadPrivateKey(event.target.result, nameKey);
    reader.readAsArrayBuffer(file);
  }

  loadPrivateKey(data, nameKey) {
    console.log(nameKey);
    console.log(data);
    let readKey;
    //let openpgp = require('openpgp');
    //console.log(data.startsWith);
    if (data.startsWith == undefined) {
      const bytes = new Uint8Array(data);
      console.log('after Unit8Array: ', bytes);
      data = this.openpgp.armor.encode(this.openpgp.enums.armor.private_key, bytes);
    }
    console.log(data);
    readKey = this.openpgp.key.readArmored(data);
    console.log(readKey);
    let privKeyObj = readKey.keys[0];
    console.log('passPhrase: ', this.state.passPhrase);
    privKeyObj.decrypt(this.state.passPhrase);
    console.log(privKeyObj);

    if (nameKey == "privateKey1")
      this.privateKey1 = privKeyObj;

    if (nameKey == "privateKey2")
      this.privateKey2 = privKeyObj;
    }

  // handleEncrypt(e) {
  //   console.log('publicKey1: ', this.publicKey1);

  //   let options = {
  //     data: this.messageForEncryptUnit8Array, // input as String (or Uint8Array)
  //     publicKeys: this.publicKey1, // for encryption
  //     //privateKeys: privKeyObj // for signing (optional)
  //   };

  //   this.openpgp.encrypt(options).then((ciphertext) => {
  //     console.log('encrypted: ', ciphertext);
  //     let encrypted = ciphertext.data; // '-----BEGIN PGP MESSAGE ... END PGP MESSAGE-----'
  //     this.messageForDecrypt = this.openpgp.message.readArmored(encrypted);
  //     console.log('encrypted armor: ', this.messageForDecrypt);

  //     options.data = encrypted;
  //     options.publicKeys = this.publicKey2;

  //     this.openpgp.encrypt(options).then((ciphertext) => {
  //       console.log('second encrypt: ', ciphertext);
  //       let encrypted2 = ciphertext.data;

  //       const typeFile = mime.lookup(this.dataFileForEncrypt.name);
  //       console.log('typeFile: ', typeFile);
  //       this.dataFileForEncrypt.type = typeFile;

  //       let blobfile = new Blob([ciphertext.data], {type: typeFile});
  //       console.log('blob: ', blobfile);

  //       let FileSaver = require('file-saver');
  //       FileSaver.saveAs(blobfile, this.dataFileForEncrypt.name + ".cfei");
  //     });

  //   });
  // }

  handleDecrypt(e){
    e.preventDefault();
    this.decrypt();
  }

  decrypt(){
    let options = {
      message: this.dataFileForDecrypt.data,
      publicKeys: this.publicKey1,
      privateKey: this.privateKey2,
    };

    if (this.dataFileForDecrypt.type == 'binary')
      options.format = 'binary';

    this.openpgp.decrypt(options).then((plaintext) => {
      this.messageForDecrypt = plaintext;
      console.log('after fisrt decrypt: ', this.messageForDecrypt);

      if (this.privateKey1 != undefined) {
        console.log('in message: ', this.messageForDecrypt.data);
        let data = this.messageForDecrypt.data;
        console.log('second raw: ', data);

        if (this.dataFileForDecrypt.type == 'binary')
          this.messageForDecrypt = this.openpgp.message.read(data);
        else
          this.messageForDecrypt = this.openpgp.message.readArmored(data);
        console.log('readed: ', this.messageForDecrypt);

        options = {
          message: this.messageForDecrypt,
          privateKey: this.privateKey1,
          format: 'binary'
        };

        this.openpgp.decrypt(options).then((plaintext) => {
          console.log('second key', plaintext); // 'Hello, World!'

          console.log('binary to blob: ', plaintext.data);
          console.log('binary buffer to blob: ', plaintext.data.buffer);

          const typeFile = mime.lookup(this.dataFileForDecrypt.name);
          console.log('typeFile: ', typeFile);
          this.dataFileForDecrypt.typeExtension = typeFile;

          let blobfile = new Blob([plaintext.data], {type: typeFile});
          console.log('blob: ', blobfile);

          let FileSaver = require('file-saver');

          if (this.dataFileForDecrypt.encryptExtension == 'cfei') {
            FileSaver.saveAs(blobfile, this.dataFileForDecrypt.name);
          } else {
            console.log('inside national');
            let file = new File([plaintext.data], this.dataFileForDecrypt.name, {type: typeFile});
            console.log('file: ', file);
            const reader = new FileReader();
            reader.onload = (event) => this.parseFile(event.target.result);
            reader.readAsArrayBuffer(file);
          }
        });
      }
    });
  }

  handleFileForDecrypt(e) {
    this.fileForDecrypt = e.target.files[0];
    const readFile = Utils.readFileForDecrypt(this.fileForDecrypt);
    readFile.then((message) => {
      console.log('loaded file message: ', message);
      this.dataFileForDecrypt.data = message.data;
      this.dataFileForDecrypt.type = message.type;
    }, (err) => {
      console.log('error in loading file message: ', err);
    });
    this.setDataFileForDecrypt(this.fileForDecrypt.name);
  }

  setDataFileForDecrypt(name) {
    let firstDot = name.lastIndexOf(".");
    const EncryptExtension = name.substr(firstDot + 1);
    const nameFile = name.substr(0, firstDot);
    this.dataFileForDecrypt.name = nameFile;
    this.dataFileForDecrypt.encryptExtension = EncryptExtension;
  }

  setDataFileForEncrypt(name) {
    this.dataFileForEncrypt.name = name;
  }

  handlePassPhrase(event) {
    event.preventDefault();
    console.log(event.target.value);
    this.setState({passPhrase: event.target.value});
  }

  handleSignedFile(e) {
    let file = e.target.files[0];
    const reader = new FileReader();
    reader.onload = (event) => this.parseFile(event.target.result);
    reader.readAsArrayBuffer(file);
  }

  parseFile(data) {
    console.log('parseFile init');

    const asn1 = asn1js.fromBER(data);
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

    let blobfile = new Blob(arrBytes, {type: this.dataFileForDecrypt.typeExtension});
    console.log('arr blob: ', blobfile);

    let FileSaver = require('file-saver');
    FileSaver.saveAs(blobfile, this.dataFileForDecrypt.name);

    // const r = require('jsrsasign');
    // //let cms = new r.KJUR.asn1.cms();
    // let certHex = r.ArrayBuffertohex(data);
    // console.log('certHex: ', certHex);
    // console.log('KJUR.asn1: ', r.KJUR.asn1);
    // const _test = r.KJUR.asn1.setValueHex(certHex);
    // console.log('_test: ', _test);
    // console.log('certHex: ', certHex);
    // let certPem = r.KJUR.asn1.ASN1Util.getPEMStringFromHex(certHex, "CMS");
    // console.log('certPem: ', certPem);
    // let cmsPem = this.cleanHeaderPEM(certPem);
    // console.log('cmsPem: ', cmsPem);
    // let hexpem2 = r.b64nltohex(cmsPem);
    // console.log('hexpem2: ', hexpem2);



    // let r2 = r.ASN1HEX.dump(certHex);
    // console.log('r2: ', r2);
    //
    // let hCMS = certHex;
    // let result = { isValid: false, parse: {} };
    // result.parse.cmsType = "signedData";
    // // find eContent data
    // result.parse.econtent = r.ASN1HEX.getVbyList(hCMS, 0, [1, 0, 2, 1, 0]);
    // console.log('result: ', result);
    // let idx;
  	// for (let i = 3; i < 6; i++) {
  	//     idx = r.ASN1HEX.getIdxbyList(hCMS, 0, [1, 0, i]);
    //     console.log('idx: ', idx);
  	//     if (idx !== undefined) {
  	// 	let tag = hCMS.substr(idx, 2);
  	// 	if (tag === "a0") result.parse.certsIdx = idx;
  	// 	if (tag === "a1") result.parse.revinfosIdx = idx;
  	// 	if (tag === "31") result.parse.signerinfosIdx = idx;
  	//     }
  	// }




    //
    // let resultCMS = r.KJUR.asn1.cms.CMSUtil.verifySignedData({ cms: certHex});
    // console.log('result: ', resultCMS);

    // let doc = new jsPDF();
    // doc.text('Hello world Component!', 10, 10);
    // doc.save('a4.pdf');
  }

  handleFileForEncrypt(e){
    let file = e.target.files[0];
    const readFile = Utils.readFileToB64(file);
    readFile.then((data) => {
      console.log('loaded file to B64: ', data);
      this.messageForEncryptB64 = data;
    }, (err) => {
      console.log('error in loading file for encrypt: ', err);
    });
    // const reader = new FileReader();
    // reader.onload = (event) => this.parseToB64FileForEncrypt(event.target.result);
    // reader.readAsArrayBuffer(file);
    this.setDataFileForEncrypt(file.name);
  }

  // parseToB64FileForEncrypt(data){
  //   const fileHex = this.jsrsasign.ArrayBuffertohex(data);
  //   const fileB64 = this.jsrsasign.hextob64(fileHex);
  //   this.messageForEncryptB64 = fileB64;
  //   console.log('loaded this.messageForEncryptB64: ');
  //   console.log(this.messageForEncryptB64);
  // }

  parseFielCertificate(certificateBuffer){
    const certHex = this.jsrsasign.ArrayBuffertohex(certificateBuffer);
    const certPem = this.jsrsasign.KJUR.asn1.ASN1Util.getPEMStringFromHex(certHex, "CERTIFICATE");
    this.FIEL.certificatePem = certPem;
    console.log('loaded FIEL.certificatePem: ');
    console.log(this.FIEL.certificatePem);
  }

  parseFielKey(keyBuffer){
    let prvp8hex = this.jsrsasign.ArrayBuffertohex(keyBuffer);
    let prvp8pem = this.jsrsasign.KJUR.asn1.ASN1Util.getPEMStringFromHex(prvp8hex, 'ENCRYPTED PRIVATE KEY');
    let prvkey = this.jsrsasign.KEYUTIL.getKey(prvp8pem, this.state.passPhrase);
    let prvkeyPem = this.jsrsasign.KEYUTIL.getPEM(prvkey, "PKCS8PRV");
    this.FIEL.keyPEM = prvkeyPem;
    console.log('loaded this.FIEL.keyPem: ');
    console.log(this.FIEL.keyPEM);
  }

  loadFileArrayBuffer(file, callback, openmode = 'binary'){
    const reader = new FileReader();
    reader.onload = event => callback.call(this, event.target.result);
    (openmode == 'binary') ? reader.readAsArrayBuffer(file) : reader.readAsText(file);
  }

  handleLoadFile(event, callback, openmode = 'binary'){
    event.preventDefault();
    this.loadFileArrayBuffer(event.target.files[0], callback);
  }

  handleEncryptSign(e){
    e.preventDefault();

  }

  _b64toBlob(b64Data, contentType, sliceSize) {
      contentType = contentType || '';
      sliceSize = sliceSize || 512;

      var byteCharacters = atob(b64Data);
      var byteArrays = [];

      for (var offset = 0; offset < byteCharacters.length; offset += sliceSize) {
        var slice = byteCharacters.slice(offset, offset + sliceSize);

        var byteNumbers = new Array(slice.length);
        for (var i = 0; i < slice.length; i++) {
          byteNumbers[i] = slice.charCodeAt(i);
        }

        var byteArray = new Uint8Array(byteNumbers);

        byteArrays.push(byteArray);
      }

      var blob = new Blob(byteArrays, {type: contentType});
      return blob;
  };

  _arrayBufferToBase64( buffer ) {
		var binary = '';
		var bytes = new Uint8Array( buffer );
		var len = bytes.byteLength;
		for (var i = 0; i < len; i++) {
			binary += String.fromCharCode( bytes[ i ] );
		}
		return window.btoa( binary );
	}

  handleKeyPEM(event){
    const reader = new FileReader();
    reader.onload = event => {
      console.log('handleKeyPEM: ', event.target.result);
      this.FIEL.keyPEM = event.target.result;
      const r = require('jsrsasign');
      console.log('load jsrsasign: ', this.FIEL.keyPEM);
      // let h = r.KEYUTIL.getKeyFromPlainPrivatePKCS8PEM(this.FIEL.keyPEM);
      // let h = r.KEYUTIL.getRSAKeyFromEncryptedPKCS8PEM(this.FIEL.keyPEM);
      let h = r.KEYUTIL.getKey(this.FIEL.keyPEM);
      console.log('h: ', h);
      this.FIEL.key = h;
    };
    reader.readAsText(event.target.files[0]);
  }

  handleKeyRawString(event){
    const reader = new FileReader();
    reader.onload = event => {
      console.log('handleKeyRawString: ', event.target.result);
      const r = require('jsrsasign');
      let prvp8bin = event.target.result;
      // let prv8hex = r.rstrtohex(prvp8bin);
      // console.log('handleKeyRawString prv8hex: ', prv8hex);
      // let prvp8pem = r.KJUR.asn1.ASN1Util.getPEMStringFromHex(prv8hex, 'RSA PRIVATE KEY');
      // console.log('handleKeyRawString prvp8pem: ', prvp8pem);
      //let prvkey = r.KEYUTIL.getKey(prvp8pem, '12345678a');
      // let prvkey = r.KEYUTIL.getKeyFromEncryptedPKCS8PEM(prvp8pem, '12345678a');
      let prvkey = r.KEYUTIL.getKeyFromEncryptedPKCS8PEM(event.target.result, '12345678a');
      console.log('handleKeyRawString key: ', prvkey);
    };
    reader.readAsText(event.target.files[0]);
  }

  handleCertificatePEM(event){
    const reader = new FileReader();
    reader.onload = event => {
      console.log('handleKeyPEM: ', event.target.result);
      this.FIEL.keyPEM = event.target.result;
      const r = require('jsrsasign');
      console.log('load jsrsasign: ', this.FIEL.keyPEM);
      // let h = r.KEYUTIL.getKeyFromPlainPrivatePKCS8PEM(this.FIEL.keyPEM);
      // let h = r.KEYUTIL.getRSAKeyFromEncryptedPKCS8PEM(this.FIEL.keyPEM);
      let h = r.KEYUTIL.getKey(this.FIEL.keyPEM);
      console.log('h: ', h);
      this.FIEL.key = h;
    };
    reader.readAsText(event.target.files[0]);
  }

  handleNewSignedFile(e) {
    let file = e.target.files[0];
    const reader = new FileReader();
    reader.onload = (event) => this.parseNewSignedFile(event.target.result);
    reader.readAsText(file);
  }

  cleanHeaderPEM(data){
    let arrPem = data.split('\n');
    arrPem.splice(0, 1);
    let len = arrPem.length - 2;
    arrPem.splice(len, 2);
    return arrPem.join('\n');
  }

  parseNewSignedFile(data){
    console.log('parseNewSignedFile: ', data);
    let cmsPem = data;
    try{
      const r = require('jsrsasign');
      let hexpem = r.b64nltohex(cmsPem);
      let arrPem = cmsPem.split('\n');
      console.log(arrPem.length);
      arrPem.splice(0, 1);
      console.log(arrPem.length);
      let len = arrPem.length-2
      console.log('len: ', len);
      console.log('array: ', arrPem);
      arrPem.splice(len, 2);
      console.log('array: ', arrPem);
      console.log(arrPem.length);
      cmsPem = arrPem.join('\n');
      // cmsPem = cmsPem.substr(0, cmsPem.lastIndexOf("\n"));
      console.log(cmsPem);
      console.log('hexpem: ',hexpem);
      let hexpem2 = r.b64nltohex(cmsPem);
      console.log('hexpem2: ', hexpem2);
      let resultCMS = r.KJUR.asn1.cms.CMSUtil.verifySignedData({ cms: hexpem2});
      console.log('result: ', resultCMS);

      let hexresult = resultCMS.parse.econtent;
      console.log('hexresult: ', hexresult);

      let resultArrayBuffer = r.hextoArrayBuffer(hexresult);
      console.log('resultArrayBuffer: ', resultArrayBuffer);

      let resultString = r.hextorstr(hexresult);
      console.log('resultString: ', resultString);
      // let resultUtf8 = r.b64toutf8(resultString);
      // console.log('resultUtf8: ', resultUtf8);

      const typeFile = mime.lookup('test.pdf');
      // console.log('typeFile: ', typeFile);
      // this.dataFileForDecrypt.typeExtension = typeFile;

      // resultArrayBuffer = r.hextoArrayBuffer(resultString);
      // console.log('resultArrayBuffer 2: ', resultArrayBuffer);

      let blobfile = this._b64toBlob(resultString, typeFile);

      // let blobfile = new Blob([resultArrayBuffer], {type: typeFile});
      console.log('blob: ', blobfile);
      const FileSaver = require('file-saver');
      //FileSaver.saveAs(blobfile, 'test.pdf');

      console.log('issuerstring: ', resultCMS.certs[0].getIssuerString());
      console.log('getSubjectString: ', resultCMS.certs[0].getSubjectString());
      console.log('getSerialNumberHex: ', resultCMS.certs[0].getSerialNumberHex());
      console.log('getSerialNumberUTF8: ', r.hextoutf8(resultCMS.certs[0].getSerialNumberHex()));
      console.log('getPublicKey: ', resultCMS.certs[0].getPublicKey());
      console.log('getPublicKey n: ', resultCMS.certs[0].getPublicKey().n.toString(16));
      console.log('getSignatureAlgorithmName: ', resultCMS.certs[0].getSignatureAlgorithmName());
      console.log('getSignatureValueHex: ', resultCMS.certs[0].getSignatureValueHex());
      console.log('getInfo: ', resultCMS.certs[0].getInfo());

      // let doc = new jsPDF();
      // doc.text(resultCMS.certs[0].getInfo(), 10, 10);
      // doc.save('acuse.pdf');

      pdfMake.vfs = vfs.pdfMake.vfs;
      let docDefinition = { content: resultCMS.certs[0].getInfo()};
      pdfMake.createPdf(docDefinition).download('acusedeloquesea.pdf');

    }
    catch(ex){
      console.log('error verify jsrsasign', ex);
    }

  }


  encrypt(){
    console.log('Encrypt init');

    let options = {
      data: this.messageForEncryptB64,
      publicKeys: this.publicKey1,
    };

    this.openpgp.encrypt(options).then((ciphertext) => {
      console.log('encrypted: ', ciphertext);
      let encrypted = ciphertext.data; // '-----BEGIN PGP MESSAGE ... END PGP MESSAGE-----'
      // this.messageForDecrypt = this.openpgp.message.readArmored(encrypted);
      // console.log('encrypted armor: ', this.messageForDecrypt);

      options.data = encrypted;
      options.publicKeys = this.publicKey2;

      this.openpgp.encrypt(options).then((ciphertext) => {
        console.log('second encrypt: ', ciphertext);
        let encrypted2 = ciphertext.data;

        const typeFile = mime.lookup(this.dataFileForEncrypt.name);
        console.log('typeFile: ', typeFile);
        this.dataFileForEncrypt.type = typeFile;

        let blobfile = new Blob([ciphertext.data], {type: typeFile});
        console.log('blob: ', blobfile);

        let FileSaver = require('file-saver');
        FileSaver.saveAs(blobfile, this.dataFileForEncrypt.name + ".cfe");
      });

    });
  }


  /*
  Only final code
  */

  handleEncrypt(event){
    event.preventDefault();
    console.log('start Encrypt');
    const encryptProcess = sindejs.encrypt(this.messageForEncryptB64, this.publicKeys);
    encryptProcess.then(
      (messageEncrypted) => {
        console.log('message encrypted');
        console.log(messageEncrypted);
        const blobfile = new Blob([messageEncrypted], {type: "text/plain;charset=utf-8"});
        console.log('this.dataFileForEncrypt', this.dataFileForEncrypt);
        const dataFilesPDF = {
          originalName: this.dataFileForEncrypt.originalName,
          originalMD5: this.dataFileForEncrypt.md5,
          originalSize: this.dataFileForEncrypt.sizeOriginalFile,
          name: this.dataFileForEncrypt.originalName + ".cfei",
          MD5: Utils.getMD5(messageEncrypted),
          size: blobfile.size + 3
        }
        FileSaver.saveAs(blobfile, this.dataFileForEncrypt.originalName + ".cfei");
        pdfMake.createPdf(sindejs.getPdfDefinition(this.publicKeys, dataFilesPDF)).download(this.dataFileForEncrypt.originalName + '.acuseGeneracion.pdf');
      }, 
      (error) => { console.log(error); }
    );
  }

  handleSignEncrypt(event){
    event.preventDefault();
    console.log('start SingEncrypt');
    const singProcess = sindejs.sing(this.messageForEncryptB64, this.FIEL.certificatePem, this.FIEL.keyPEM);
    singProcess.then(
      (messageSigned)=> {
        console.log('messageSigned');
        console.log(messageSigned);
        const encryptProcess = sindejs.encrypt(messageSigned, this.publicKeys);
        encryptProcess.then(
          (messageEncrypted) => {
            console.log('message encrypted');
            console.log(messageEncrypted);
            const blobfile = new Blob([messageEncrypted], {type: "text/plain;charset=utf-8"});
            console.log('blob: ', blobfile);
            const dataFilesPDF = {
              originalName: this.dataFileForEncrypt.originalName,
              originalMD5: this.dataFileForEncrypt.md5,
              originalSize: this.dataFileForEncrypt.sizeOriginalFile,
              name: this.dataFileForEncrypt.originalName + ".cfe",
              MD5: Utils.getMD5(messageEncrypted),
              size: blobfile.size + 3
            }
            FileSaver.saveAs(blobfile, this.dataFileForEncrypt.originalName + ".cfe");
            pdfMake.createPdf(sindejs.getPdfDefinition(this.publicKeys, dataFilesPDF)).download(this.dataFileForEncrypt.originalName + '.acuseGeneracion.pdf');            
          }, 
          (error) => { console.log(error); }
        );
      }, 
      (error) => { console.log(error); }
    );
  }

  loadFileForEncrypt(file){
    Object.assign(this.dataFileForEncrypt, Utils.getOriginalDataFromName(file.name));
    this.dataFileForEncrypt.sizeOriginalFile = file.size;
    const readFile = Utils.readFileToB64(file);
    readFile.then((data) => {
      console.log('loaded file for encrypt to B64: ', data);
      this.messageForEncryptB64 = data;
      this.dataFileForEncrypt.md5 = Utils.getMD5(this.messageForEncryptB64);
      console.log('this.dataFileForEncrypt: ',this.dataFileForEncrypt);
    }, (err) => {
      console.log('error in loading file for encrypt: ', err);
    });
  }

  loadCertificate(file){
    const readFile = UtilsFIEL.readCertificateToPEM(file);
    readFile.then((data) => {
      this.FIEL.certificatePem = data;
      console.log('loaded certificate: ');
      console.log(this.FIEL.certificatePem);
    }, (err) => {
      console.log('error in loading certificate: ', err);
    });
  }


  loadCertificateIssuer(file){
    const readFile = UtilsFIEL.readCertificateToPEM(file);
    readFile.then((data) => {
      this.FIEL.certificateIssuer = data;
      console.log('loaded certificate issuer: ');
      console.log(this.FIEL.certificateIssuer);
    }, (err) => {
      console.log('error in loading certificate issuer: ', err);
    });
  }

  loadKeyFIEL(file){
    const readFile = UtilsFIEL.readKeyFIELToPEM(file, this.state.passPhrase);
    readFile.then((data) => {
      this.FIEL.keyPEM = data;
      console.log('loaded key fiel: ');
      console.log(this.FIEL.keyPEM);
    }, (err) => {
      console.log('error in loading key fiel: ', err);
    });
  }

  handleLoadFile(event, type){
    event.preventDefault();
    let file = event.target.files[0];
    switch (type) {
      case 'fileForEncrypt':
        this.loadFileForEncrypt(file);
        break;
      case 'certificate':
        this.loadCertificate(file);
        break;
      case 'certificateIssuer':
        this.loadCertificateIssuer(file);
        break;        
      case 'keyFIEL':
        this.loadKeyFIEL(file);
        break;
      default:
        console.log('Do not exist that type for load file');
    }
  }

  checkStatus(response) {
    console.log('checkStatus.....');
    if (response.status >= 200 && response.status < 300) {
      return response;
    } else {
      var error = new Error(response.statusText);
      error.response = response;
      throw error;
    }
  }  

  validateCertificate(event){
    // generate OCSP request using sha1 algorithnm by default.
    let hReq = this.jsrsasign.KJUR.asn1.ocsp.OCSPUtil.getRequestHex(this.FIEL.certificateIssuer, this.FIEL.certificatePem);
    console.log('hReq: ', hReq);

    let _abReq = this.jsrsasign.hextoArrayBuffer(hReq);
    let _blob = new Blob([_abReq], {type: "octet/stream"});

    let _headers = new Headers();
    _headers.append("Content-Type", "application/ocsp-request");
    _headers.append("Accept","application/ocsp-response");

    let _data = new FormData();
    _data.append("hexOSCP", hReq);

    let _options = {
      method: 'GET',
//      headers: _headers,
      mode: 'cors',
      //body: _data
    };

    const _url = "../../SvtValidateCertificate?hexOSCP=" + hReq;
    let _request = new Request(_url, _options);

    fetch(_url, _options).then(this.checkStatus).then((response) => {
      console.log(response);
    });
  }

  validateCertificateCAPEM(event){
    console.log('certCA: ', this.certCA);
    // generate OCSP request using sha1 algorithnm by default.
    let hReq = this.jsrsasign.KJUR.asn1.ocsp.OCSPUtil.getRequestHex(this.certCA, this.FIEL.certificatePem);
    console.log('hReq: ', hReq);

    let _abReq = this.jsrsasign.hextoArrayBuffer(hReq);
    let _blob = new Blob([_abReq], {type: "octet/stream"});

    let _headers = new Headers();
    _headers.append("Content-Type", "application/ocsp-request");
    _headers.append("Accept","application/ocsp-response");

    let _data = new FormData();
    _data.append("hexOSCP", hReq);

    let _options = {
      method: 'GET',
//      headers: _headers,
      mode: 'cors',
      //body: _data
    };

    const _url = "../../SvtValidateCertificate?hexOSCP=" + hReq;
    let _request = new Request(_url, _options);

    fetch(_url, _options).then(this.checkStatus).then((response) => {
      console.log(response);
    });
  }  

  render() {
    return (
      <div>
        Decrypt
        <br></br>
        <textarea ref={(input) => this.certCA = input.value } id="certCA" name="certCA" rows="10" cols="65">
-----BEGIN CERTIFICATE-----
MIIFHjCCBAagAwIBAgIUMDAwMDAwMDAwMDAwMDAwMDEwNDMwDQYJKoZIhvcNAQEF
BQAwggE2MTgwNgYDVQQDDC9BLkMuIGRlbCBTZXJ2aWNpbyBkZSBBZG1pbmlzdHJh
Y2nDs24gVHJpYnV0YXJpYTEvMC0GA1UECgwmU2VydmljaW8gZGUgQWRtaW5pc3Ry
YWNpw7NuIFRyaWJ1dGFyaWExHzAdBgkqhkiG9w0BCQEWEGFjb2RzQHNhdC5nb2Iu
bXgxJjAkBgNVBAkMHUF2LiBIaWRhbGdvIDc3LCBDb2wuIEd1ZXJyZXJvMQ4wDAYD
VQQRDAUwNjMwMDELMAkGA1UEBhMCTVgxGTAXBgNVBAgMEERpc3RyaXRvIEZlZGVy
YWwxEzARBgNVBAcMCkN1YXVodGVtb2MxMzAxBgkqhkiG9w0BCQIMJFJlc3BvbnNh
YmxlOiBGZXJuYW5kbyBNYXJ0w61uZXogQ29zczAeFw0wODEwMTYxODI5NDBaFw0x
NjEwMTQxODI5NDBaMIIBNjE4MDYGA1UEAwwvQS5DLiBkZWwgU2VydmljaW8gZGUg
QWRtaW5pc3RyYWNpw7NuIFRyaWJ1dGFyaWExLzAtBgNVBAoMJlNlcnZpY2lvIGRl
IEFkbWluaXN0cmFjacOzbiBUcmlidXRhcmlhMR8wHQYJKoZIhvcNAQkBFhBhY29k
c0BzYXQuZ29iLm14MSYwJAYDVQQJDB1Bdi4gSGlkYWxnbyA3NywgQ29sLiBHdWVy
cmVybzEOMAwGA1UEEQwFMDYzMDAxCzAJBgNVBAYTAk1YMRkwFwYDVQQIDBBEaXN0
cml0byBGZWRlcmFsMRMwEQYDVQQHDApDdWF1aHRlbW9jMTMwMQYJKoZIhvcNAQkC
DCRSZXNwb25zYWJsZTogRmVybmFuZG8gTWFydMOtbmV6IENvc3MwggEiMA0GCSqG
SIb3DQEBAQUAA4IBDwAwggEKAoIBAQDlkFD9MrqF4NDx2DRfON6QvYCxaoPYFsLI
MHuRzc2FlYI4ZDYlq+OA341rfgP2UqAUgC/MXJ2dXPHm/Egkg170X0Pp2Sm8IJuK
SqM9oOI+rUDtqh8iVDouvQGIkSaiQ0hMrt8btQdjMPruSwUf5t20UgsYPP9IH4Qe
reGNGFDvjvAOqFA44t2DNQS6Bec0Tldi6s7j+gIcItXGxNbP30NrBnR+7ZmkgaQ1
VJnjh2HdyvRbiOuIicK4WCl7co3OX85hNirckAG/2B4OOY5e9+1BkOF4BA8f2dTO
mhb/pTqRoMhbDvqpbIqU5OgbxZmi5tpvElRVPshSKLVqNe51R6LTAgMBAAGjIDAe
MA8GA1UdEwEB/wQFMAMBAf8wCwYDVR0PBAQDAgEGMA0GCSqGSIb3DQEBBQUAA4IB
AQDI4fg+F5xPIaXUkCfkfEhjJmxnhAf52PCqHw9NuzdMYpE0P+qO5RvfMvsS1RBM
Mv3v4ASQx4NeJUQia+3cCc9E69kSwVhJfY9UOAtOIFQ4W1eUBJ+WIEzbChWtL8AD
i5lhsE73gmapGuxVqye+4e/HNLdTv3MzhmqS69DkbdySzRnoPMCrspxX4EU8nsFD
/HnhdgNu8J5b5HV9JckM2OC3BMTPp3BhKBAlADHLSgmttxZhMoK7nW+gus1px3B2
yLmorf2GUOC3kQrrrLeNBEoZgSPmkVjeL6Z+/qfctvd1LzAla4VZpXH3uQw7a2EH
M18k9fczppiB4O1/ShgIiHVp
-----END CERTIFICATE-----
</textarea><br/>
        <label>
          public key 1
          <input id="publicKey1" ref={(input) => this.inputPublicKey1 = input} type="file" onChange={this.handlePublicKey.bind(this)}></input>
        </label>
        <br></br>
        <label>
          public key 2
          <input id="publicKey2" ref={(input) => this.inputPublicKey2 = input} type="file" onChange={this.handlePublicKey.bind(this)}></input>
        </label>
        <br></br>
        <label>
          private key 1
          <input id="privateKey1" ref={(input) => this.inputPrivateKey1 = input} type="file" onChange={this.handlePrivateKey.bind(this)}></input>
        </label>

        <br></br>
        <label>
          private key 2
          <input id="privateKey2" type="file" onChange={this.handlePrivateKey.bind(this)}></input>
        </label>
        <br></br>
        <label>
          encrypt file
          <input type="file" onChange={this.handleFileForEncrypt.bind(this)}></input>
        </label>
        <br></br>
        <label>
          decrypt file binary
          <input type="file" onChange={this.handleFileForDecrypt.bind(this)}></input>
        </label>
        <br></br>
        <br></br>
        <label>
          issuer cert
          <input type="file" accept=".cer" onChange={ event => { this.handleLoadFile(event, 'certificateIssuer') }}></input>
        </label>
        <br></br>
        <br></br> 
        <label>
          cert
          <input type="file" accept=".cer" onChange={ event => { this.handleLoadFile(event, 'certificate') }}></input>
        </label>
        <br></br>
        <br></br>
        <br></br>
        <button onClick={this.validateCertificate.bind(this)}>Validate certificate</button>        
        <br></br>
        <button onClick={this.validateCertificateCAPEM.bind(this)}>Validate certificate CA PEM</button>        
        <br></br>
        <br></br>
        <label>
          key certificate
          <input type="file" accept=".key" onChange={ event => { this.handleLoadFile(event, this.parseFielKey) }}></input>
        </label>
        <br></br>
        <br></br>
        <label>
          key certificate PEM
          <input type="file" accept=".pem" onChange={this.handleKeyPEM.bind(this)}></input>
        </label>
        <br></br>
        <label>
          key certificate raw string
          <input type="file" accept="" onChange={this.handleKeyRawString.bind(this)}></input>
        </label>
        <br></br>
        <label>
          text
          <input type="text" onChange={this.handlePassPhrase.bind(this)} value={this.state.passPhrase}></input>
        </label>
        <br></br>
        <button onClick={this.handleEncrypt.bind(this)}>Encrypt</button>
        <br></br>
        <button onClick={this.handleEncryptSign.bind(this)}>Encrypt Sign</button>
        <br></br>
        <button onClick={this.handleDecrypt.bind(this)}>Decrypt</button>
        <br></br>
        <textarea></textarea>
        <br></br>
        <label>
          file signed with old tool
          <input type="file" onChange={this.handleSignedFile.bind(this)}></input>
        </label>
        <br></br>
        <label>
          file signed
          <input type="file" onChange={this.handleNewSignedFile.bind(this)}></input>
        </label>
      </div>
    )
  }
}

BoxTest.propTypes = {
  publicKey1: PropTypes.string.isRequired,
  publicKey2: PropTypes.string.isRequired
}

module.exports = BoxTest;
