import React from 'react';
import PropTypes from 'prop-types';
import mime from 'mime-types';
import Utils from '../sindejs/utils.js';
import sindejs from '../sindejs/sindejs.js';
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
import ListGroup from 'react-bootstrap/lib/ListGroup';
import ListGroupItem from 'react-bootstrap/lib/ListGroupItem';

import Loader from 'halogen/RingLoader';
import '../css/spinner.styl';


// import '../css/styles.min.css';
// import { Row, Col, FormRow, FormField, FormInput, FileUpload, Button, Spinner } from 'elemental';

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
		this.lng = Utils.getMessages(this.props.language);

		this.state = {
			selectedFile: false,
			selectedFileValidation: null,
			selectedFileMessage: this.lng.fileToDecrypt.help,
			selectedKey1: false,
			selectedKey1Message: this.lng.keyGPG.help,
			selectedKey1Validation: null,
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

	loadPrivateKey1(file){
		this.setState({
			selectedKey1: false,
      selectedKey1Running: true,
      selectedKey1Message: this.lng.keyGPG.readRunning,
      selectedKey1Validation: null,
		},
		() => {
			setTimeout(() => {
				const _prvKey = Utils.readKeyPGP(file, this.state.passPhraseKey1);
				_prvKey.then(
					(key) => {
						this.privateKeys.key1 = key
						console.log('loaded key 1');
						console.log(this.privateKeys);	
						this.setState({
							selectedKey1: true,
				      selectedKey1Running: false,
				      selectedKey1Message: this.lng.keyGPG.readRunning,
				      selectedKey1Validation: 'success',							
						});
					}, 
					(error) => { 
						console.log('loadPrivateKey1 error: ', error);
						this.setState({
							selectedKey1: false,
				      selectedKey1Running: false,
				      selectedKey1Message: this.lng.keyGPG.error + '\n\n' + error,
				      selectedKey1Validation: 'error',
						});
					});
			}, 1500);
		});
	}

  handleLoadFile(event, type){
    event.preventDefault();
    let file = event.target.files[0];
    switch (type) {
      case 'fileForDecrypt':
        this.loadFileForDecrypt(file);
        break;
      case 'privateKey1':
      	this.loadPrivateKey1(file);
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
    const _spinnerBlockHelp = 
      <div className="spinnerContainer">
        <Loader color="#48A0DC" size="32px" margin="4px"/>
      </div>;

    const _buttonDecrypt = (this.state.selectedFile && this.state.selectedKey1 && this.state.selectedKey2) 
      ? <Button bsStyle="primary" onClick={this.handleDecrypt.bind(this)}>{this.lng.buttonDecrypt.label}</Button>
      : <Button bsStyle="primary" disabled onClick={this.handleDecrypt.bind(this)}>{this.lng.buttonDecrypt.label}</Button>;

  //   const _inputKey1 = (this.state.passPhraseKey1 == '')
  //   	? <FormInput type="file" disabled accept=".gpg" onChange={ event => { this.handleLoadFile(event, 'privateKey1') } }></FormInput>
  //   	: <FormInput type="file" accept=".gpg" onChange={ event => { this.handleLoadFile(event, 'privateKey1') } }></FormInput>;
		const _inputKey1 = (this.state.passPhraseKey1.length > 0)
			? <FormGroup controlId="formKey1" validationState={ this.state.selectedKey1Validation }>
          <ControlLabel>{this.lng.keyGPG.label + " 1"}</ControlLabel>
          <FormControl type="file" accept=".gpg" onChange={ event => { this.handleLoadFile(event, 'privateKey1') }} />
          <FormControl.Feedback />
          <HelpBlock className="HelpBlockSpinner">
            <div className={(this.state.selectedKeyRunning) ? "helpMessageSpinner" : "helpMessage"}>
              {this.state.selectedKey1Message}
            </div>
            {(this.state.selectedKey1Running) ? _spinnerBlockHelp : null}
          </HelpBlock>
        </FormGroup>
      : <FormGroup controlId="formKey1" validationState={ this.state.selectedKey1Validation }>
          <ControlLabel>{this.lng.keyGPG.label + " 1"}</ControlLabel>
          <FormControl disabled type="file" accept=".gpg" onChange={ event => { this.handleLoadFile(event, 'privateKey1') }} />
          <FormControl.Feedback />
          <HelpBlock className="HelpBlockSpinner">
            <div className={(this.state.selectedKeyRunning) ? "helpMessageSpinner" : "helpMessage"}>
              {this.state.selectedKey1Message}
            </div>
            {(this.state.selectedKey1Running) ? _spinnerBlockHelp : null}
          </HelpBlock>
        </FormGroup>;

		// const _inputKey2 = (this.state.passPhraseKey2 == '')
		// 	? <FormInput type="file" disabled accept=".gpg" onChange={ event => { this.handleLoadFile(event, 'privateKey2') } }></FormInput>
		// 	: <FormInput type="file" accept=".gpg" onChange={ event => { this.handleLoadFile(event, 'privateKey2') } }></FormInput>;

		return (
			<form>
        <FormGroup controlId="formFileDecrypt" validationState={this.state.selectedFileValidation}>
          <ControlLabel>{this.lng.fileToDecrypt.label}</ControlLabel>
          <FormControl type="file" accept=".cfe, .cfei" onChange={ event => { this.handleLoadFile(event, 'fileForDecrypt') } } />
          <FormControl.Feedback />
          <HelpBlock className="HelpBlockSpinner">
            <div className={(this.state.selectedFileRunning) ? "helpMessageSpinner" : "helpMessage"}>
              {this.state.selectedFileMessage}
            </div>
            {(this.state.selectedFileRunning) ? _spinnerBlockHelp : null}
          </HelpBlock>
        </FormGroup>
				<FormGroup validationState={(this.state.passPhraseKey1.length) ? 'success' : null } >
          <ControlLabel>{this.lng.passPhraseDecrypt.label + " 1"}</ControlLabel>
          <FormControl
            type="text"
            value={this.state.passPhraseKey1}
            placeholder={this.lng.passPhraseDecrypt.placeholder + " 1"}
            onChange={ event => { this.handlePassPhrase(event, 1) }}
          />
          <FormControl.Feedback />
          <HelpBlock>{this.lng.passPhraseDecrypt.help}</HelpBlock>          
        </FormGroup> 
        {_inputKey1}       
        {_buttonDecrypt}
			</form>
		)
	}
};

BoxDecrypt.defaultProps = {
	language: 'sp'
};

BoxDecrypt.propTypes = {
	publicKey1: PropTypes.string.isRequired,
	publicKey2: PropTypes.string.isRequired,
	language: PropTypes.string
}

module.exports = BoxDecrypt;