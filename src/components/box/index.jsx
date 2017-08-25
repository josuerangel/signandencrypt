import React from 'react';
import {createWriteStream, supported, version} from 'StreamSaver';
import mime from 'mime-types';
import * as asn1js from "asn1js";
import {SignedData, EncapsulatedContentInfo} from 'pkijs';
import {ContentInfo} from 'pkijs';
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
    //let openpgp = require('openpgp');
    //console.log(data.startsWith);
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
    //reader.readAsBinaryString(file);
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

  handleDecrypt(e) {
    e.preventDefault();
    // console.log(this.inputPrivateKey1);
    // let key1 = this.inputPrivateKey1.onchange().bind(this);
    // console.log('key1', key1);
    console.log('key1', this.privateKey1);
    console.log('key2', this.privateKey2);
    //this.messageForDecrypt =
    console.log('message', this.messageForDecrypt);

    let options = {
      message: this.messageForDecrypt, // parse armored message
      publicKeys: this.publicKey1, // for verification (optional)
      privateKey: this.privateKey2, // for decryption
      format: 'binary'
    };

    this.openpgp.decrypt(options).then((plaintext) => {
      this.messageForDecrypt = plaintext;
      console.log('after fisrt decrypt: ', this.messageForDecrypt); // 'Hello, World!'

      if (this.privateKey1 != undefined) {
        console.log('in message: ', this.messageForDecrypt.data);
        let data = this.messageForDecrypt.data;
        console.log('second raw: ', data);
        this.messageForDecrypt = this.openpgp.message.read(data);
        console.log('readed: ', this.messageForDecrypt);

        options = {
          message: this.messageForDecrypt, // parse armored message
          //publicKeys: this.publicKey1,    // for verification (optional)
          privateKey: this.privateKey1, // for decryption
          format: 'binary'
        };

        this.openpgp.decrypt(options).then((plaintext) => {
          console.log('second key', plaintext); // 'Hello, World!'

          console.log('binary to blob: ', plaintext.data);
          console.log('binary buffer to blob: ', plaintext.data.buffer);

          const typeFile = mime.lookup(this.dataFileForDecrypt.name);
          console.log('typeFile: ', typeFile);
          this.dataFileForDecrypt.type = typeFile;

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
    //const readFile = this.setFileForDecrypt(this.fileForDecrypt);
    readFile.then((result) => {
      console.log('resolve: ', result);
    }, (err) => {
      console.log('reject: ', err);
    });
    // const reader = new FileReader();
    // reader.onload = (event) => this.loadFileForDecrypt(event.target.result);
          //reader.readAsText(file);
    // reader.readAsArrayBuffer(this.fileForDecrypt);
          //reader.readAsBinaryString(file);
    this.setDataFileForDecrypt(this.fileForDecrypt.name);
  }

  setFileForDecrypt(file){
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        let data = event.target.result;
        try{
          this.messageForDecrypt = this.openpgp.message.readArmored(data);
          resolve('loaded armored file for decrypt');
        }
        catch(e){
          reader.onload = (event) => {
            data = event.target.result;
            try {
              const bytes = new Uint8Array(data);
              this.messageForDecrypt = this.openpgp.message.read(bytes);
              resolve('loaded binary file for decrypt');
            }
            catch (e) {
              reject(Error('File for decrypt is not valid: ' + e));
            }
          };
          reader.readAsArrayBuffer(this.fileForDecrypt);
        }
      };
      reader.readAsText(file);
    });
  }

  setDataFileForDecrypt(name) {
    let firstDot = name.lastIndexOf(".");
    const EncryptExtension = name.substr(firstDot + 1);
    console.log('EncryptExtension: ', EncryptExtension);
    const nameFile = name.substr(0, firstDot);
    console.log('nameFile: ', nameFile);
    this.dataFileForDecrypt.name = nameFile;
    this.dataFileForDecrypt.encryptExtension = EncryptExtension;
  }

  setDataFileForEncrypt(name) {
    this.dataFileForEncrypt.name = name;
  }

  loadFileForDecrypt(data) {
    console.log('raw: ', data);

    try {
      const bytes = new Uint8Array(data);
      console.log('file after Unit8Array: ', bytes);
      this.messageForDecrypt = this.openpgp.message.read(bytes);
    } catch (e) {
      console.log('is not binary', e);
      this.messageForDecrypt = this.openpgp.message.readArmored(data);
    }

    // const base64String = this.base64ArrayBuffer(data);
    // console.log('base64String: ', base64String);

    //data = this.openpgp.armor.encode(this.openpgp.enums.armor.message, bytes);
    //this.messageForDecrypt = data;
    //let encryptedMessage = this.openpgp.message.readArmored(data);
    //console.log(encryptedMessage);
    //this.messageForDecrypt = encryptedMessage;

    // this is ok for decryp binary


    //this.messageForDecrypt = this.openpgp.message.readArmored(base64String);
    console.log('message readed');
    //this.messageForDecrypt = this.openpgp.message.fromBinary(bytes, 'unoPrueba.txt.cfei');
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
    const _schema = cmsEncapsulatedSimpl.toSchema();
    console.log('_schema: ', _schema);

    let offset = 0;
    //const bytesContent = new Uint8Array(cmsEncapsulatedSimpl.eContent.valueBlock.valueHex, offset, ((offset + 65536) > cmsEncapsulatedSimpl.eContent.valueBlock.valueHex.byteLength) ? (cmsEncapsulatedSimpl.eContent.valueBlock.valueHex.byteLength - offset) : 65536);
    //const bytesContent = new Uint8Array(cmsEncapsulatedSimpl.eContent.valueBlock.valueHex, offset, ((offset + 65536) > cmsEncapsulatedSimpl.eContent.valueBlock.valueHex.byteLength) ? (cmsEncapsulatedSimpl.eContent.valueBlock.valueHex.byteLength - offset) : 65536);
    const bytesContent = new Uint8Array(cmsEncapsulatedSimpl.eContent.valueBlock.value[0].valueBlock.valueHex, offset, ((offset + 65536) > cmsEncapsulatedSimpl.eContent.valueBlock.value[0].valueBlock.valueHex.byteLength)
      ? (cmsEncapsulatedSimpl.eContent.valueBlock.value[0].valueBlock.valueHex.byteLength - offset)
      : 65536);
    console.log('bytesContent: ', bytesContent);

    // for(let x = 0, len = cmsEncapsulatedSimpl.eContent.valueBlock.value.length; x < len; x++){
    //
    // }
    let bytesItem;
    let arrBytes = cmsEncapsulatedSimpl.eContent.valueBlock.value.map((item) => {
      //item.valueBlock.valueHex;
      bytesItem = new Uint8Array(item.valueBlock.valueHex, offset, ((offset + 65536) > item.valueBlock.valueHex.byteLength)
        ? (item.valueBlock.valueHex.byteLength - offset)
        : 65536);
      return bytesItem;
    });

    //let blobfile = new Blob([bytesContent], {type: this.dataFileForDecrypt.type});
    let blobfile = new Blob(arrBytes, {type: this.dataFileForDecrypt.type});
    console.log('arr blob: ', blobfile);

    let FileSaver = require('file-saver');
    FileSaver.saveAs(blobfile, this.dataFileForDecrypt.name);

    //const cmsEnvelopedSimp = new EnvelopedData({ schema: cmsContentSimpl.content });
    //const cmsSafeContents = new SafeContents({ schema: cmsContentSimpl.content });
    //const cmsEnvelopedSimp = new EnvelopedData({ schema: cmsContentSimpl.content });
    // console.log('cmsEnvelopedSimp: ', cmsEnvelopedSimp);

    // const decryptResult = cmsEnvelopedSimp.decrypt(0, {preDefinedData: data });
    // console.log('decryptResult: ', decryptResult);

    // let pem = forge.pkcs7.messageToPem(data);
    // let dataPEM = btoa(data);
    // console.log('dataPEM: ', dataPEM);
    //
    // const bytes = new Uint8Array(data);
    // console.log('after Unit8Array: ', bytes);
    // data = this.openpgp.armor.encode(this.openpgp.enums.armor.message, bytes);
    // console.log('afer armor: ', data);
    // const p7 = forge.pkcs7.messageFromPem(data);
    // //const p7 = forge.pkcs7.messageFromPem(btoa(data));
    // console.log('p7: ', p7);
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

  handleFileForDecryptText(e){
    let file = e.target.files[0];
    const reader = new FileReader();
    reader.onload = (event) => this.loadFileForDecrypt(event.target.result);
    reader.readAsText(file);
    this.setDataFileForDecrypt(file.name);
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
        <label>
          decrypt file text
          <input type="file" onChange={this.handleFileForDecryptText.bind(this)}></input>
        </label>
        <br></br>
        <label>
          text
          <input type="text" onChange={this.handlePassPhrase.bind(this)} value={this.state.passPhrase}></input>
        </label>
        <br></br>
        <button onClick={this.handleEncrypt.bind(this)}>Encrypt</button>
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
