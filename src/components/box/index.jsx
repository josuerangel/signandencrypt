import React from 'react';

class Box extends React.Component {
  constructor() {
    super();
    this.state = {
      data: ''
    }
  }

  handlePrivateKey(e) {
    let file = e.target.files[0];
    const reader = new FileReader();
    reader.onload = (event) => this.loadPrivateKey(event.target.result);
    reader.readAsArrayBuffer(file);
  }

  loadPrivateKey(data) {
    console.log(data);
    let readKey;
    let openpgp = require('openpgp');
    console.log(data.startsWith);
    if (data.startsWith == undefined){
      //if (!data.startsWith('-----BEGIN PGP PUBLIC KEY BLOCK-----')) {
        const bytes = new Uint8Array(data);
        data = openpgp.armor.encode(openpgp.enums.armor.public_key, bytes);
        // encryptedMessage = openpgp.message.fromBinary(encryptedUint8);
      //}
    }
    readKey = openpgp.key.readArmored(data);
    console.log(readKey);
  }

  handleEncrypt(e) {
    e.preventDefault();

  }
  render() {
    return (
      <div>
        Decrypt
        <br></br>
        <label>
          public key
          <input type="file" onChange={this.handlePrivateKey.bind(this)}></input>
        </label>
        <br></br>
        <label>
          text
          <input type="text"></input>
        </label>
        <br></br>
        <button onClick={this.handleEncrypt.bind(this)}>encrypt</button>
        <br></br>
        <br></br>
        <textare></textare>
      </div>
    )
  }
}

module.exports = Box;
