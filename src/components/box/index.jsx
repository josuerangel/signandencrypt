import React from 'react';
//import openpgp from 'openpgp';

class Box extends React.Component {
  constructor() {
    super();
    this.state = {
      data: ''
    }
  }

  open_ascii_keyfile(e) {
    let file = e.target.files[0];
    this.read_file(file, this.parse_ascii_keyfile.bind(this));
  }

  read_file(file, callback) {
    var reader = new FileReader();
    reader.onload = function(evt) {
        var binary = evt.target.result;
        callback(binary);
    };
    //reader.readAsBinaryString(file);
    //reader.readAsArrayBuffer(file);
    reader.readAsText(file);
  }
  binarytoString(str) {
    return str.split(/\s/).map(function (val){
      return String.fromCharCode(parseInt(val, 2));
    }).join("");
  }

  uintToString(uintArray) {
    var encodedString = String.fromCharCode.apply(null, uintArray),
        decodedString = decodeURIComponent(escape(encodedString));
    return decodedString;
  }

  utf8to16(str) {
    var out, i, len, c;
    var char2, char3;

    out = "";
    len = str.length;
    i = 0;
    while(i < len) {
	c = str.charCodeAt(i++);
	switch(c >> 4)
	{
	  case 0: case 1: case 2: case 3: case 4: case 5: case 6: case 7:
	    // 0xxxxxxx
	    out += str.charAt(i-1);
	    break;
	  case 12: case 13:
	    // 110x xxxx   10xx xxxx
	    char2 = str.charCodeAt(i++);
	    out += String.fromCharCode(((c & 0x1F) << 6) | (char2 & 0x3F));
	    break;
	  case 14:
	    // 1110 xxxx  10xx xxxx  10xx xxxx
	    char2 = str.charCodeAt(i++);
	    char3 = str.charCodeAt(i++);
	    out += String.fromCharCode(((c & 0x0F) << 12) |
					   ((char2 & 0x3F) << 6) |
					   ((char3 & 0x3F) << 0));
	    break;
	}
    }

    return out;
}
  parse_ascii_keyfile(data) {
    //crypto.subtle.importKey("raw", data, "AES-CTR", true, "encrypt");

    // console.log('parse_ascii_keyfile: ', data);
    // console.log('btoa: ', btoa(data));

    // let testArray1 = String.fromCharCode.apply(null, new Uint16Array(data));
    // const TextEncoder = require('text-encoding').TextEncoder;
    // let encryptedUint8_1 = new TextEncoder().encode(testArray1);
    // let string_1 = new TextDecoder('utf-8').decode(encryptedUint8_1);
    // console.log('decode: ', string_1);

    // const base64js = require('base64-js');
    // let arr = base64js.toByteArray(data);
    //let str = map(arr, function (byte) { return String.fromCharCode(byte) }).join('');
    //console.log(str);

    //let pgp = new openpgp();
    let openpgp = require('openpgp');
    //openpgp.initWorker({ path:'openpgp.worker.js' }) // set the relative web worker path
    //openpgp.config.aead_protect = true // activate fast AES-GCM mode (not yet OpenPGP standard)

    let encryptedData = data;
    let encryptedMessage;
    if (encryptedData.startsWith('-----BEGIN PGP PUBLIC KEY BLOCK-----')){
      console.log('normal');
      encryptedMessage = openpgp.key.readArmored(encryptedData).keys;
    }
    else {
      console.log('decode');
      let test = this.binarytoString(data);
      console.log('test: ', test);
      const TextEncoder = require('text-encoding').TextEncoder;
      console.log('TextEncoder: ', TextEncoder);
      let encryptedUint8 = new TextEncoder().encode(encryptedData);
      console.log('after:', encryptedUint8);
      let result = crypto.subtle.importKey("raw", encryptedUint8, "AES-CTR", true, ["encrypt"]);
      console.log('result: ', result);

      let armorKey = openpgp.armor.encode(openpgp.enums.armor.public_key, data);
      console.log('armorKey: ', armorKey);

      let test2 = this.uintToString(encryptedUint8);
      console.log('test2: ', test2);
      let test3 = this.utf8to16(data);
      console.log('test3: ', test3);
      let string = new TextDecoder('utf-8').decode(encryptedUint8);
      console.log('decode: ', string);
      //encryptedMessage = openpgp.message.read(encryptedUint8);
      //encryptedMessage = openpgp.key.readArmored(encryptedData).keys;
      encryptedMessage = openpgp.message.fromBinary(encryptedUint8);
      //console.log('othermessage: ', othermessage);
    }

    console.log(encryptedMessage);
    // let utfstring = unescape(encodeURIComponent(data));
    // console.log(utfstring);
    // let fixedstring = decodeURIComponent(escape(utfstring));
    // console.log(fixedstring);
    // ... ACTUALLY DECODE THE FILE HERE ...
    let body_begin_index	= data.search(/^(\r\n|\n|\r)/m) + 1;

   // Our data ends right before the checksum line which starts with an "="
   let body_end_index		= data.search(/^\=/m);

   // Both of these indexes need to exist for the file to be readable.
   if (body_begin_index == -1 || body_end_index == -1)	{
       alert('This is not a valid ASCII-Armored OpenPGP export file.');
       return false;
   }

   // Pull the body out of the data and strip all newlines from it
   let body		= data.substring(body_begin_index, body_end_index);
   body		= body.replace(/(\r\n|\n|\r)/gm, '');

   // Grab the checksum while we're at it...
   let body_checksum	= data.substr(body_end_index + 1, 4);

   let base_64 = {
    chars: 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/',

    encode: function(data) {
        var output = '';
        for (i=0, c=data.length; i<c; i += 3)
        {
            var char1 = data.charCodeAt(i) >> 2;
            var char2 = ((data.charCodeAt(i) & 3) << 4) | data.charCodeAt(i+1) >> 4;
            var char3 = ((data.charCodeAt(i+1) & 15) << 2) | data.charCodeAt(i+2) >> 6;
            var char4 = data.charCodeAt(i+2) & 63;

            output 	+= 	this.chars.charAt(char1)
                        + 	this.chars.charAt(char2)
                        +	this.chars.charAt(char3)
                        +	this.chars.charAt(char4);
        }
        if (c % 3 == 1)
            output = output.substr(0, output.length - 2) + '==';
        else if (c % 3 == 2)
            output = output.substr(0, output.length - 1) + '=';

        return output;
    },

    decode: function(str) {
        var data = '';

        for (i=0, c=str.length; i<c; i += 4)
        {
            var char1 = this.chars.indexOf(str.charAt(i));
            var char2 = this.chars.indexOf(str.charAt(i+1));
            var char3 = this.chars.indexOf(str.charAt(i+2));
            var char4 = this.chars.indexOf(str.charAt(i+3));

            data += String.fromCharCode(char1 << 2 | char2 >> 4);
            if (char3 != -1)
                data += String.fromCharCode((char2 & 15) << 4 | char3 >> 2)
            if (char4 != -1)
                data += String.fromCharCode((char3 & 3) << 6 | char4);
        }
        return data;
    }
    }
  }

  handleEncrypt(e){
    e.preventDefault();

  }
  render(){
    return (
      <div>
        Encrypt
        <br></br>
        <label>
          public key
          <input type="file" onChange={this.open_ascii_keyfile.bind(this)}></input>
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
        <textare>

        </textare>
      </div>
    )
  }
}

module.exports = Box;
