import React from 'react';
import {createWriteStream, supported, version} from 'StreamSaver';
import mime from 'mime-types';
import * as asn1js from "asn1js";
import {Certificate, SignedData, EncapsulatedContentInfo} from 'pkijs';
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
    this.messageForEncryptUnit8Array;
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
    this.messageForEncryptUnit8Array = bytes;
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
  }

  parseFielKey(keyBuffer){
    const bytes = new Uint8Array(keyBuffer);
    this.FIEL.key = this.openpgp.armor.encode(this.openpgp.enums.armor.private_key, bytes);
    console.log('loaded fiel key: ', this.FIEL.key);
    //const pk = PrivateKeyInfo({ privateKey: keyBuffer });
    const pk = PrivateKeyInfo({ parsedKey: this.FIEL.key });
    console.log('privateKey: ', pk);
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
          <input type="file" onChange={ event => { this.handleLoadFile(event, this.parseFielCertificate) }}></input>
        </label>
        <br></br>
        <br></br>
        <label>
          key certificate
          <input type="file" onChange={ event => { this.handleLoadFile(event, this.parseFielKey) }}></input>
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
          file signed
          <input type="file" onChange={this.handleSignedFile.bind(this)}></input>
        </label>
      </div>
    )
  }
}

module.exports = Box;
