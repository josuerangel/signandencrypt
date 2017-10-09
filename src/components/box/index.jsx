import React from 'react';
import {createWriteStream, supported, version} from 'StreamSaver';
import mime from 'mime-types';
import * as asn1js from "asn1js";
import {Certificate, SignedData, SignerInfo, IssuerAndSerialNumber, EncapsulatedContentInfo} from 'pkijs';
import {ContentInfo, PrivateKeyInfo} from 'pkijs';
import {EnvelopedData, SafeContents} from 'pkijs';
import forge from 'node-forge';
import Message from '../Message.jsx';

class Box extends React.Component {
  constructor(props) {
    super(props);
    this.publicKey1;
    this.publicKey2;
    this.privateKey1;
    this.publicKey2;
    this.privateKey2;
    this.messageForDecrypt;
    this.messageForEncryptBinary;
    this.messageForEncryptUnit8Array;
    this.messageForEncryptArrayBuffer;
    this.messageForEncryptB64;
    this.inputPublicKey1;
    this.inputPrivateKey1;
    this.fileForDecrypt;
    this.dataFileForDecrypt = {};
    this.dataFileForEncrypt = {};
    this.FIEL = {};
    this.openpgp = require('openpgp');
    this.state = {
      passPhrase: '12345678a',
      nameFileToDecrypt: ''
    }
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

  handleEncrypt(e) {
    console.log('publicKey1: ', this.publicKey1);

    let options = {
      data: this.messageForEncryptUnit8Array, // input as String (or Uint8Array)
      publicKeys: this.publicKey1, // for encryption
      //privateKeys: privKeyObj // for signing (optional)
    };

    this.openpgp.encrypt(options).then((ciphertext) => {
      console.log('encrypted: ', ciphertext);
      let encrypted = ciphertext.data; // '-----BEGIN PGP MESSAGE ... END PGP MESSAGE-----'
      this.messageForDecrypt = this.openpgp.message.readArmored(encrypted);
      console.log('encrypted armor: ', this.messageForDecrypt);

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
        FileSaver.saveAs(blobfile, this.dataFileForEncrypt.name + ".cfei");
      });

    });
  }

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
    const readFile = Message.readFile(this.fileForDecrypt);
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
  }

  handleFileForEncrypt(e){
    let file = e.target.files[0];
    const reader = new FileReader();
    reader.onload = (event) => this.parseFileForEncrypt(event.target.result);
    reader.readAsArrayBuffer(file);
    this.setDataFileForEncrypt(file.name);
  }

  parseFileForEncrypt(data){
    console.log('parseFileForEncrypt raw: ', data);
    const bytes = new Uint8Array(data);
    console.log('after Unit8Array: ', bytes);
    this.messageForEncryptBinary = data;
    this.messageForEncryptUnit8Array = bytes;
    this.messageForEncryptArrayBuffer = data;

    const r = require('jsrsasign');
    let fileHex = r.ArrayBuffertohex(data);
    let fileB64 = r.hextob64(fileHex);
    this.messageForEncryptB64 = fileB64;
    console.log('this.messageForEncryptB64: ', fileB64);
  }

  handleCert(e){
    e.preventDefault();
    this.loadFileArrayBuffer(e.target.files[0], this.parseCert);
  }

  parseFielCertificate(certificateBuffer){
    console.log('parseCert: ', certificateBuffer);
    const asn1 = asn1js.fromBER(certificateBuffer);
  	const certificate = new Certificate({ schema: asn1.result });
    console.log('parseCert certificate: ', certificate);
    this.FIEL.certificate = certificate;
    // const _asn1 = forge.asn1.fromDer(certificateBuffer);
    // console.log('_asn1: ', _asn1);
    // const certforge = forge.pki.certificateFromAsn1(asn1);
    // console.log('certforge: ', certforge);
    // const certPem = forge.pki.certificateToPem(certforge);
    // console.log('certPem: ', certPem);

    const r = require('jsrsasign');
    let certHex = r.ArrayBuffertohex(certificateBuffer);
    console.log('certHex: ', certHex);
    let certPem = r.KJUR.asn1.ASN1Util.getPEMStringFromHex(certHex, "CERTIFICATE");
    console.log('certPem: ', certPem);
    this.FIEL.certificatePem = certPem;
    console.log('FIEL.certificatePem: ', this.FIEL.certificatePem);
  }

  parseFielKey(keyBuffer){
    const r = require('jsrsasign');
    let prvp8bin = keyBuffer; // raw PKCS#8 private key;
    console.log('prvp8bin: ', prvp8bin);
    let prvp8hex = r.ArrayBuffertohex(prvp8bin);
    console.log('prvp8hex: ', prvp8hex);
    // let prvp8pem = r.KJUR.asn1.ASN1Util.getPEMStringFromHex(prvp8hex, 'ENCRYPTED PRIVATE KEY');
    let prvp8pem = r.KJUR.asn1.ASN1Util.getPEMStringFromHex(prvp8hex, 'ENCRYPTED PRIVATE KEY');
    console.log('prvp8pem: ', prvp8pem);
    let prvkey = r.KEYUTIL.getKey(prvp8pem, '12345678a');
    console.log('prvkey: ', prvkey);
    this.FIEL.key = prvkey;


    let prvkeyPem = r.KEYUTIL.getPEM(prvkey, "PKCS8PRV");
    console.log('prvkeyPem: ', prvkeyPem);
    this.FIEL.keyPEM = prvkeyPem;
    console.log('this.FIEL.keyPem: ', this.FIEL.keyPEM);

    // const bytes = new Uint8Array(keyBuffer);
    // this.FIEL.key = this.openpgp.armor.encode(this.openpgp.enums.armor.private_key, bytes);
    //console.log('loaded fiel key: ', this.FIEL.key);
    //const pk = PrivateKeyInfo({ privateKey: keyBuffer });
    //const pk = PrivateKeyInfo({ parsedKey: this.FIEL.key });
    //console.log('privateKey: ', pk);

    // const NodeRSA = require('node-rsa');
    // const key = new NodeRSA();
    //
    // const asn1Der = forge.asn1.fromDer(keyBuffer, 64);
    // console.log('asn1Der: ', asn1Der);
    //
    // const asn1 = asn1js.fromBER(keyBuffer);
    // console.log('asn1: ', asn1);

    // this.FIEL.key = "" +
    // "-----BEGIN ENCRYPTED PRIVATE KEY-----\r\n" +
    // this._arrayBufferToBase64(keyBuffer)
    // "-----END ENCRYPTED PRIVATE KEY-----\r\n";
    // console.log('parseFielKey: ', this.FIEL.key);

    //this.FIEL.key = this._arrayBufferToBase64(keyBuffer);
    //const pk = PrivateKeyInfo({ schema: asn1 });
    //console.log('pk: ', pk);
    //const rs = require('jsrsasign');
    //let prvKey = rs.KEYUTIL.getDecryptedKeyHex(this.FIEL.key, '12345678a');

    // const bs64 = require('base64-js');
    // let key64 = bs64.fromByteArray(keyBuffer);
    // console.log('key64: ', key64);
    // var encryptedKey = '-----BEGIN RSA PRIVATE KEY--(snip)Proc-Type: 4,ENCRYPTED(snip)';
    // var decryptedKeyHex = PKCS5PKEY.getDecryptedKeyHex(encryptedKey, passcode);
    // var rsa = new RSAKey();
    // rsa.readPrivateKeyFromASN1HexString(decryptedKeyHex);
  }

  loadFileArrayBuffer(file, callback){
    const reader = new FileReader();
    reader.onload = event => callback.call(this, event.target.result);
    reader.readAsArrayBuffer(file);
  }

  handleLoadFile(event, callback){
    event.preventDefault();
    this.loadFileArrayBuffer(event.target.files[0], callback);
  }

  handleEncryptSign(e){
    e.preventDefault();
    //certSimpl.subjectPublicKeyInfo.importKey(publicKey)

    let cmsSignedSimpl = new SignedData({
      version: 1,
      encapContentInfo: new EncapsulatedContentInfo({
        eContentType: "1.2.840.113549.1.7.1", // "data" content type
        eContent: new asn1js.OctetString({ value_hex: this.messageForEncryptArrayBuffer })
      }),
      signerInfos: [
        new SignerInfo({
          version: 1,
          sid: new IssuerAndSerialNumber({
            issuer: this.FIEL.certificate.issuer,
            serialNumber: this.FIEL.certificate.serialNumber
          })
        })
      ],
      certificates: [this.FIEL.certificate]
    });
    console.log('cmsSignedSimpl: ', cmsSignedSimpl);

    // const contentInfo = new EncapsulatedContentInfo({
    //   eContent: new asn1js.OctetString({ valueHex: this.messageForEncryptArrayBuffer })
    // });

    // cmsSignedSimpl.encapContentInfo.eContent = contentInfo.eContent;
    // console.log('eContent added');

    // const r = require('jsrsasign');
    // console.log('load jsrsasign: ', this.FIEL.key);
    // var h = r.KEYUTIL.getKeyFromEncryptedPKCS8PEM(this.FIEL.key, this.state.passPhrase);
    // //var h = r.KEYUTIL.getDecryptedKeyHex(this.FIEL.key, this.state.passPhrase);
    // //let h = r.KEYUTIL.getKeyFromPlainPrivatePKCS8PEM(this.FIEL.keyPEM);
    // console.log('h: ', h);

    // signed pkijs
    // let signok = cmsSignedSimpl.sign(h, 0, "sha-1");
    //let signok = cmsSignedSimpl.sign(this.FIEL.keyPEM, 0, "sha-1");
    //console.log('signok pkijs: ', signok);


    // signed jsrsasign
    // let sd = r.KJUR.asn1.cms.CMSUtil.newSignedData({
    //   content: {str: "jsrsasign"},
    //   certs: [this.FIEL.certificate],
    //   signerInfos: [{
    //     hashAlg: 'sha-1',
    //     sAttr: {
    //       SigningTime: {},
    //       SigningCertificateV2: {array: [this.FIEL.certificate]},
    //     },
    //     signerCert: this.FIEL.certificate,
    //     sigAlg: 'SHA1withRSA',
    //     signerPrvKey: this.FIEL.key
    //   }]
    // });

    let prvKeyPEM = this.FIEL.keyPEM;
    let certPEM = this.FIEL.certificatePem;
    console.log('before sign jsrsasign', prvKeyPEM, certPEM);
    let param = {
        content: {str: "jsrsasign"},
        certs: [certPEM],
        signerInfos: [{
          hashAlg: 'sha256',
          sAttr: {
          },
          signerCert: certPEM,
          sigAlg: 'SHA256withRSA',
          signerPrvKey: prvKeyPEM
        }]
    };

    param.content.str = this.messageForEncryptB64;
    //param.signerInfos[0].hashAlg = f1.hashalg1.value;
    //param.signerInfos[0].sigAlg = f1.sigalg1.value;
    // if (f1.signingtime1.checked) {
    //   param.signerInfos[0].sAttr.SigningTime = {};
    // }

    const r = require('jsrsasign');
    let cmsPem;
    try {
      let sd = r.KJUR.asn1.cms.CMSUtil.newSignedData(param);
      cmsPem = sd.getPEM();
      console.log('cmsPem: ', cmsPem);
      const FileSaver = require('file-saver');
      const blob = new Blob([cmsPem], {type: "text/plain;charset=utf-8"});
      FileSaver.saveAs(blob, "testSign.txt");
      // const asn1 = asn1js.fromBER(cmsPem);
      // console.log('asn1: ', asn1);

      // const cmsContentSimpl = new ContentInfo({schema: asn1.result});
      // console.log("cmsContentSimpl: ", cmsContentSimpl);
      //
      // const cmsSignedSimpl = new SignedData({schema: cmsContentSimpl.content});
      // console.log("cmsSignedSimpl: ", cmsSignedSimpl);
      //
      // const cmsEncapsulatedSimpl = new EncapsulatedContentInfo(cmsSignedSimpl.encapContentInfo);
      // console.log('cmsEncapsulatedSimpl: ', cmsEncapsulatedSimpl);

    } catch (ex) {
      //f1.newcms1.value = ex;
      console.log('error sign jsrsasign', ex);
    }

    // try{
    //   let hexpem = r.b64nltohex(cmsPem);
    //   let arrPem = cmsPem.split('\n');
    //   console.log(arrPem.length);
    //   arrPem.splice(0, 1);
    //   console.log(arrPem.length);
    //   let len = arrPem.length-2
    //   console.log('len: ', len);
    //   console.log('array: ', arrPem);
    //   arrPem.splice(len, 2);
    //   console.log('array: ', arrPem);
    //   console.log(arrPem.length);
    //   cmsPem = arrPem.join('\n');
    //   // cmsPem = cmsPem.substr(0, cmsPem.lastIndexOf("\n"));
    //   console.log(cmsPem);
    //   console.log('hexpem: ',hexpem);
    //   let hexpem2 = r.b64nltohex(cmsPem);
    //   console.log('hexpem2: ', hexpem2);
    //   let resultCMS = r.KJUR.asn1.cms.CMSUtil.verifySignedData({ cms: hexpem2});
    //   console.log('result: ', resultCMS);
    //
    //   let hexresult = resultCMS.parse.econtent;
    //   console.log('hexresult: ', hexresult);
    //
    //   let resultArrayBuffer = r.hextoArrayBuffer(hexresult);
    //   console.log('resultArrayBuffer: ', resultArrayBuffer);
    //
    //   let resultString = r.hextorstr(hexresult);
    //   console.log('resultString: ', resultString);
    //   // let resultUtf8 = r.b64toutf8(resultString);
    //   // console.log('resultUtf8: ', resultUtf8);
    //
    //   const typeFile = mime.lookup('test.pdf');
    //   // console.log('typeFile: ', typeFile);
    //   // this.dataFileForDecrypt.typeExtension = typeFile;
    //
    //   // resultArrayBuffer = r.hextoArrayBuffer(resultString);
    //   // console.log('resultArrayBuffer 2: ', resultArrayBuffer);
    //
    //   let blobfile = this._b64toBlob(resultString, typeFile);
    //
    //   // let blobfile = new Blob([resultArrayBuffer], {type: typeFile});
    //   console.log('blob: ', blobfile);
    //   //let FileSaver = require('file-saver');
    //   FileSaver.saveAs(blobfile, 'test.pdf');
    //
    //   // console.log('issuerstring: ', resultCMS.certs[0].getIssuerString());
    //   // console.log('getSubjectString: ', resultCMS.certs[0].getSubjectString());
    //   // console.log('getSerialNumberHex: ', resultCMS.certs[0].getSerialNumberHex());
    //   // console.log('getSerialNumberUTF8: ', r.hextoutf8(resultCMS.certs[0].getSerialNumberHex()));
    //   // console.log('getPublicKey: ', resultCMS.certs[0].getPublicKey());
    //   // console.log('getPublicKey n: ', resultCMS.certs[0].getPublicKey().n.toString(16));
    //   // console.log('getSignatureAlgorithmName: ', resultCMS.certs[0].getSignatureAlgorithmName());
    //   // console.log('getSignatureValueHex: ', resultCMS.certs[0].getSignatureValueHex());
    //   // console.log('getInfo: ', resultCMS.certs[0].getInfo());
    // }
    // catch(ex){
    //   console.log('error verify jsrsasign', ex);
    // }

    //let signok = cmsSignedSimpl.sign(h, 0, "sha-256");
    //console.log('signok: ', signok);
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
    }
    catch(ex){
      console.log('error verify jsrsasign', ex);
    }

  }

  render() {
    return (
      <div>
        Decrypt
        <br></br>
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
        <br></br>
        <label>
          cert
          <input type="file" accept=".cer" onChange={ event => { this.handleLoadFile(event, this.parseFielCertificate) }}></input>
        </label>
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

module.exports = Box;
