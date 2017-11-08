import React from 'react';
import PropTypes from 'prop-types';
import mime from 'mime-types';
import Utils from '../../sindejs/utils.js';
import sindejs from '../../sindejs/sindejs.js';
import * as FileSaver from 'file-saver';
import pdfMake from "pdfmake/build/pdfmake";
import pdfFonts from "pdfmake/build/vfs_fonts";
pdfMake.vfs = pdfFonts.pdfMake.vfs;

import FormGroup from 'react-bootstrap/lib/FormGroup';
import ControlLabel from 'react-bootstrap/lib/ControlLabel';
import FormControl from 'react-bootstrap/lib/FormControl';
import HelpBlock from 'react-bootstrap/lib/HelpBlock';
import Button from 'react-bootstrap/lib/Button';
import Alert from 'react-bootstrap/lib/Alert';
import Collapse from 'react-bootstrap/lib/Collapse';

import InputFile from '../input-file/index.jsx';

/**
 * Props:
 * 	keys = Object
 * 	keys.public.key1  = url for load public key 1
 * 	keys.public.key2  = url for load public key 2
 */
class BoxDecrypt extends React.Component{
	constructor(props){
		super(props);

		/**
		 * Object parsed with data for decrypt and type.
		 * this.dataFileForDecrypt.data = GPG message ready for decrypt
		 * this.dataFileForDecrypt.type = 'ascii' new way to encrypt, 'binary' encrypted with old tool (applet)
		 * @type {Object}
		 */
		this.dataFileForDecrypt = {};
		this.privateKeys = {};
		this.publicKeys = {};
		this.lng = this.props.language;

		this.state = {
			selectedFile: false,
			selectedKey1: false,
			selectedKey2: false,
			passPhraseKey1: '',
			passPhraseKey2: '',
			showProcessMessages: false,
		}
	}

  componentDidMount(){
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
  }

  makeFiles(dataB64, certificate){
  	console.log(typeof dataB64);
  	const nameFile = this.dataFileForDecrypt.originalName + "." + this.dataFileForDecrypt.encryptExtension;
  	let blobfile;
  	if (typeof dataB64 === 'string')
			blobfile = Utils.b64toBlob(dataB64, this.dataFileForDecrypt.typeFile);
		else
			blobfile = new Blob(dataB64, {type: this.dataFileForDecrypt.typeFile});
		console.log('makeFiles blobfile: ', blobfile);
	  const dataFilesPDF = {
	  	certInfo: certificate,
	  	encryptionExtension: this.dataFileForDecrypt.encryptExtension,
	    originalName: nameFile,
	    originalMD5: this.dataFileForDecrypt.MD5,
	    originalSize: this.dataFileForDecrypt.sizeOriginalFile,
	    name: this.dataFileForDecrypt.originalName,
	    MD5: Utils.getMD5(dataB64),
	    size: blobfile.size
	  }
	  pdfMake.createPdf(sindejs.getPdfDefinition(this.publicKeys, dataFilesPDF, this.props.language, 'decrypt')).download(nameFile + '.acuseDesencriptacion.pdf');
		FileSaver.saveAs(blobfile, this.dataFileForDecrypt.originalName);
  }

	handleDecrypt(){
		console.log('handleDecrypt init');
		const _decrypt = sindejs.decrypt(this.dataFileForDecrypt.data, this.dataFileForDecrypt.type, this.publicKeys, this.privateKeys);
		_decrypt.then(
			(cms) => {
				console.log('cms after decrypt');
				console.log(cms);
				if (this.dataFileForDecrypt.encryptExtension == 'cfe') {
					const _value = sindejs.getSignedData(cms);
					_value.then(
						(data) => {
							console.log('handleDecrypt getSignedData then: ', data);
							this.makeFiles(data.messageB64, data.certInfo);
						},
						(error) => {
							console.log(error);
						}
						);
				}
				else {
					this.makeFiles(cms.data);
				}
			},
			(error) => {
				console.log(error);
			}
		);
	}

	loadFileForDecrypt(file){
		return new Promise((resolve, reject) => {
	    Object.assign(this.dataFileForDecrypt, Utils.getOriginalDataFromName(file.name));
	    console.log('this.dataFileForDecrypt: ', this.dataFileForDecrypt);
	    this.dataFileForDecrypt.sizeOriginalFile = file.size;
	    const readFile = Utils.readFileForDecrypt(file);
	    readFile.then((value) => {
	      Object.assign(this.dataFileForDecrypt, value);
	      this.dataFileForDecrypt.MD5 = Utils.getMD5(this.dataFileForDecrypt.dataUTF8);
	      console.log('loaded and parse file for decrypt: ', this.dataFileForDecrypt);
	      resolve();
	    }, (error) => {
	      console.log(error);
	      reject({ message: error });
	    });
  	});
	}

	loadPrivateKey1(file){
		return new Promise((resolve, reject) => {
			const _prvKey = Utils.readKeyPGP(file, this.state.passPhraseKey1);
			_prvKey.then(
				(key) => {
					this.privateKeys.key1 = key
					console.log('loaded key 1');
					console.log(this.privateKeys);	
					resolve();
				}, 
				(error) => { 
					console.log('loadPrivateKey1 error: ', error);
					reject({ message: error.message });
				});
		});
	}

	loadPrivateKey2(file){
		return new Promise((resolve, reject) => {
			const _prvKey = Utils.readKeyPGP(file, this.state.passPhraseKey2);
			_prvKey.then(
				(key) => {
					this.privateKeys.key2 = key
					console.log('loaded key 2');
					console.log(this.privateKeys);	
					resolve();
				}, 
				(error) => { 
					console.log('loadPrivateKey2 error: ', error);
					reject({ message: error.message });
				});
		});
	}

	render(){
    const _buttonDecrypt = (this.state.selectedFile && this.state.selectedKey1 && this.state.selectedKey2) 
      ? <Button bsStyle="primary" onClick={this.handleDecrypt.bind(this)}>{this.lng.buttonDecrypt.label}</Button>
      : <Button bsStyle="primary" disabled onClick={this.handleDecrypt.bind(this)}>{this.lng.buttonDecrypt.label}</Button>;

		const _passPhraseKey1 = 
			<FormGroup validationState={(this.state.passPhraseKey1.length) ? 'success' : null } >
          <ControlLabel>{this.lng.passPhraseDecrypt.label + " 1"}</ControlLabel>
          <FormControl
            type="text"
            value={this.state.passPhraseKey1}
            placeholder={this.lng.passPhraseDecrypt.placeholder + " 1"}
            onChange={ event => { this.setState({ passPhraseKey1: event.target.value }) }}
          />
          <FormControl.Feedback />
          <HelpBlock>{this.lng.passPhraseDecrypt.help}</HelpBlock>          
        </FormGroup>;

    const _inputKey1 = <InputFile accept=".gpg" lng={this.lng.privateKey1} enabled={(this.state.passPhraseKey1.length > 0) ? true : false } process={this.loadPrivateKey1.bind(this)} valid={ (state) => { this.setState({ selectedKey1 : state }) }} />

		const _passPhraseKey2 = 
			<FormGroup validationState={(this.state.passPhraseKey2.length) ? 'success' : null } >
          <ControlLabel>{this.lng.passPhraseDecrypt.label + " 2"}</ControlLabel>
          <FormControl
            type="text"
            value={this.state.passPhraseKey2}
            placeholder={this.lng.passPhraseDecrypt.placeholder + " 2"}
            onChange={ event => { this.setState({ passPhraseKey2: event.target.value }) }}
          />
          <FormControl.Feedback />
          <HelpBlock>{this.lng.passPhraseDecrypt.help}</HelpBlock>          
        </FormGroup>;

    const _inputKey2 = <InputFile accept=".gpg" lng={this.lng.privateKey2} enabled={(this.state.passPhraseKey2.length > 0) ? true : false } process={this.loadPrivateKey2.bind(this)} valid={ (state) => { this.setState({ selectedKey2 : state }) }} />

		return (
			<form>
				<InputFile accept=".cfe, .cfei" lng={this.lng.fileToDecrypt} process={this.loadFileForDecrypt.bind(this)} valid={ (state) => { this.setState({ selectedFile : state }) }} />
				{_passPhraseKey1}
        {_inputKey1}
        {_passPhraseKey2}
        {_inputKey2}       
        {_buttonDecrypt}
			</form>
		)
	}
};

BoxDecrypt.propTypes = {
	publicKey1: PropTypes.string.isRequired,
	publicKey2: PropTypes.string.isRequired,
	language: PropTypes.object.isRequired
}

module.exports = BoxDecrypt;