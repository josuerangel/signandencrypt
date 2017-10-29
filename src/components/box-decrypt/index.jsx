import React from 'react';
import mime from 'mime-types';
import Utils from '../sindejs/utils.js';
import sindejs from '../sindejs/sindejs.js';
import * as FileSaver from 'file-saver';
import pdfMake from "pdfmake/build/pdfmake";
import pdfFonts from "pdfmake/build/vfs_fonts";
pdfMake.vfs = pdfFonts.pdfMake.vfs;

import '../css/styles.min.css';
import { Row, Col, FormRow, FormField, FormInput, FileUpload, Button, Spinner } from 'elemental';
import PropTypes from 'prop-types';

/**
 * Props:
 * 	keys = Object
 * 	keys.public.key1  = url for load public key 1
 * 	keys.public.key2  = url for load public key 2
 */
class BoxDecrypt extends React.Component{
	constructor(props){
		super(props);

		this.state = {
			selectedFile: false,
			selectedKey1: false,
			selectedKey2: false,
			passPhraseKey1: '',
			passPhraseKey2: ''
		}
		/**
		 * Object parsed with data for decrypt and type.
		 * this.dataFileForDecrypt.data = GPG message ready for decrypt
		 * this.dataFileForDecrypt.type = 'ascii' new way to encrypt, 'binary' encrypted with old tool (applet)
		 * @type {Object}
		 */
		this.dataFileForDecrypt = {};
		this.privateKeys = {};
		this.publicKeys = {};
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
    Object.assign(this.dataFileForDecrypt, Utils.getOriginalDataFromName(file.name));
    console.log('this.dataFileForDecrypt: ', this.dataFileForDecrypt);
    this.dataFileForDecrypt.sizeOriginalFile = file.size;
    const readFile = Utils.readFileForDecrypt(file);
    readFile.then((value) => {
      Object.assign(this.dataFileForDecrypt, value);
      this.dataFileForDecrypt.MD5 = Utils.getMD5(this.dataFileForDecrypt.dataUTF8);
      console.log('loaded and parse file for decrypt: ', this.dataFileForDecrypt);
      this.setState({ selectedFile: true });
    }, (error) => {
      console.log(error);
    });
	}

	loadPrivateKey(file, number){
		const _passPhrase = (number == 1) ? this.state.passPhraseKey1 : this.state.passPhraseKey2;
		const _prvKey = Utils.readKeyPGP(file, _passPhrase);
		_prvKey.then(
			(key) => {
				if (number == 1) this.privateKeys.key1 = key
				else this.privateKeys.key2 = key;
				console.log('loaded key ' + number);
				console.log(this.privateKeys);	
				if (number == 1) this.setState({ selectedKey1: true });
				if (number == 2) this.setState({ selectedKey2: true });
			}, 
			(error) => { console.log(error); });
	}

  handleLoadFile(event, type){
    event.preventDefault();
    let file = event.target.files[0];
    switch (type) {
      case 'fileForDecrypt':
        this.loadFileForDecrypt(file);
        break;
      case 'privateKey1':
      	this.loadPrivateKey(file, 1);
      	break;
      case 'privateKey2':
      	this.loadPrivateKey(file, 2);
      	break;      	
      default:
        console.log('Do not exist that type for load file');
    }
  }

  handlePassPhrase(event, number) {
    event.preventDefault();
    if (number == 1)
    	this.setState( { passPhraseKey1: event.target.value} );
    else
    	this.setState( { passPhraseKey2: event.target.value} );
  }

	render(){
    const _buttonDecrypt = (this.state.selectedFile && this.state.selectedKey1 && this.state.selectedKey2) 
      ? <Button type="primary" onClick={this.handleDecrypt.bind(this)}>Desencryptar</Button>
      : <Button type="primary" disabled onClick={this.handleDecrypt.bind(this)}>Desencryptar</Button>;

    const _inputKey1 = (this.state.passPhraseKey1 == '')
    	? <FormInput type="file" disabled accept=".gpg" onChange={ event => { this.handleLoadFile(event, 'privateKey1') } }></FormInput>
    	: <FormInput type="file" accept=".gpg" onChange={ event => { this.handleLoadFile(event, 'privateKey1') } }></FormInput>;
		
		const _inputKey2 = (this.state.passPhraseKey2 == '')
			? <FormInput type="file" disabled accept=".gpg" onChange={ event => { this.handleLoadFile(event, 'privateKey2') } }></FormInput>
			: <FormInput type="file" accept=".gpg" onChange={ event => { this.handleLoadFile(event, 'privateKey2') } }></FormInput>;
		
		return (
			<div>
				<Row>
	        <Col sm="2/4">
	          <FormRow>
	            <FormField label="Archivo a desencriptar">
	            	<FormInput type="file" accept=".cfe, .cfei" onChange={ event => { this.handleLoadFile(event, 'fileForDecrypt') } }></FormInput>
	            </FormField>
	          </FormRow>
	          <FormRow>
	          	<FormField label="Llave privada 1">
	          		<FormInput type="text" placeholder="Clave para la llave privada 1" onChange={ event => { this.handlePassPhrase(event, 1) }} value={ this.state.passPhraseKey1 } ></FormInput>
	          		{_inputKey1}
	          	</FormField>
	          </FormRow>
	          <FormRow>
	          	<FormField label="Llave privada 2">
	          		<FormInput type="text" placeholder="Clave para la llave privada 2" onChange={ event => { this.handlePassPhrase(event, 2) }} value={ this.state.passPhraseKey2 } ></FormInput>
	          		{_inputKey2}
	          	</FormField>
	          </FormRow>
	          <FormRow>
	            {_buttonDecrypt}
	        	</FormRow>	          
	        </Col>
	      </Row>
				</div>
				)
		}
};

BoxDecrypt.defaultProps = {
	language: 'en'
};

BoxDecrypt.propTypes = {
	publicKey1: PropTypes.string.isRequired,
	publicKey2: PropTypes.string.isRequired,
	language: PropTypes.string
}

module.exports = BoxDecrypt;