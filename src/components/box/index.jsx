import React from 'react';

class Box extends React.Component {
  constructor(props) {
    super(props);
    this.privateKey1;
    this.privateKey2;
    this.messageForDecrypt;
    this.inputPrivateKey1;
    this.openpgp = require('openpgp');
    this.state = {
      passPhrase: ''
    }
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
    if (data.startsWith == undefined){
      //if (!data.startsWith('-----BEGIN PGP PUBLIC KEY BLOCK-----')) {
        const bytes = new Uint8Array(data);
        data = this.openpgp.armor.encode(this.openpgp.enums.armor.public_key, bytes);
      //}
    }
    readKey = this.openpgp.key.readArmored(data);
    console.log(readKey);
    let privKeyObj = this.openpgp.key.readArmored(data).keys[0];
    privKeyObj.decrypt(this.state.passPhrase);
    console.log(privKeyObj);

    if (nameKey == "privateKey1")
      this.privateKey1 = privKeyObj;

    if (nameKey == "privateKey2")
      this.privateKey2 = privKeyObj;
  }

  handleDecrypt(e) {
    e.preventDefault();
    // console.log(this.inputPrivateKey1);
    // let key1 = this.inputPrivateKey1.onchange().bind(this);
    // console.log('key1', key1);
    console.log('key1',this.privateKey1);
    console.log('key2',this.privateKey2);
    console.log('message',this.messageForDecrypt);

    let options = {
      message: this.messageForDecrypt,     // parse armored message
      //publicKeys: openpgp.key.readArmored(pubkey).keys,    // for verification (optional)
      privateKey: this.privateKey1 // for decryption
    };

    this.openpgp.decrypt(options).then(function(plaintext) {
      console.log(plaintext); // 'Hello, World!'
    });
  }

  handleFileForDecrypt(e){
    let file = e.target.files[0];
    const reader = new FileReader();
    reader.onload = (event) => this.loadFileForDecrypt(event.target.result);
    reader.readAsArrayBuffer(file);
  }

  loadFileForDecrypt(data){
    const bytes = new Uint8Array(data);
    data = this.openpgp.armor.encode(this.openpgp.enums.armor.message, bytes);
    let encryptedMessage = this.openpgp.message.readArmored(data);
    console.log(encryptedMessage);
    this.messageForDecrypt = encryptedMessage;
  }

  handlePassPhrase(e){
    e.preventDefault();
    this.setState({ passPhrase: e.value });
  }

  render() {
    return (
      <div>
        Decrypt
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
            <input type="file" onChange={this.handleFileForDecrypt.bind(this)}></input>
          </label>
          <br></br>
        <label>
          text
          <input type="text" onChange={this.handlePassPhrase.bind(this)}></input>
        </label>
        <br></br>
        <button onClick={this.handleDecrypt.bind(this)}>Decrypt</button>
        <br></br>
        <br></br>
        <textare></textare>
      </div>
    )
  }
}

module.exports = Box;
