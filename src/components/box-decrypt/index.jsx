import React from 'react';
import PropTypes from 'prop-types';
import mime from 'mime-types';
import Utils from '../../sindejs/utils.js';
import sindejs from '../../sindejs/sindejs.js';
import * as FileSaver from 'file-saver';
import pdfMake from "pdfmake/build/pdfmake";
import pdfFonts from "pdfmake/build/vfs_fonts";
pdfMake.vfs = pdfFonts.pdfMake.vfs;
import ReactHtmlParser, { processNodes, convertNodeToElement, htmlparser2 } from 'react-html-parser';

import FormGroup from 'react-bootstrap/lib/FormGroup';
import ControlLabel from 'react-bootstrap/lib/ControlLabel';
import FormControl from 'react-bootstrap/lib/FormControl';
import HelpBlock from 'react-bootstrap/lib/HelpBlock';
import Button from 'react-bootstrap/lib/Button';
import Alert from 'react-bootstrap/lib/Alert';
import Collapse from 'react-bootstrap/lib/Collapse';

import InputFile from '../input-file/index.jsx';
import Loader from 'halogen/RingLoader';

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
			passPhraseKeyCorrect1: true,
			passPhraseKey2: '',
			passPhraseKeyCorrect2: true,
			processMessages: [],
			processRunning: false,
			processState: null,
			showProcessMessages: false,
			resetInputs: '',
      loadingPublicKeys: false,
      loadingPublicKeysState: 'info',
      loadingPublicKeysMessage: '',			
		}
	}

  componentDidMount(){
    this.loadPublicKeys();
  }

  loadPublicKeys(){
    const _loadkeys = sindejs.getPublicKeys(this.props.publicKeysURL, this.props.publicKeysURLBase);
    _loadkeys.then(
      (keys) => {
        console.log('componentDidMount _loadkeys keys: ', keys);
        this.publicKeys.key1 = keys[0];
        this.publicKeys.key2 = keys[1];
      },
      (error) => {
        console.log('componentDidMount _loadkeys error: ', error);
        const _errormessage = (error.message === 'dontReadPublicKey')
          ? this.lng.publicKey.error
          : error.message;
        this.setState({ processRunning: true, loadingPublicKeys: true, loadingPublicKeysState: 'danger', loadingPublicKeysMessage: _errormessage });        
      }
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
	  pdfMake.createPdf(sindejs.getPdfDefinition(this.publicKeys, dataFilesPDF, this.lng.language, 'decrypt')).download(nameFile + '.acuseDesencriptacion.pdf');
		FileSaver.saveAs(blobfile, this.dataFileForDecrypt.originalName);
		this.setState({ 
			processRunning: false, 
			passPhraseKey1: '',
			passPhraseKey2: '',
			resetInputs: Math.random().toString(36).substring(7),  
		});
  }

  decrypt(){
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
				console.log('handleDecrypt reject: ', error);
				let _msg = this.lng.process.error;
				switch(error.message){
					case 'firstKeyInvalidForDecrypt':
						_msg = this.lng.privateKey1.invalidForDecrypt;
						break;
					case 'secondKeyInvalidForDecrypt':
						_msg = this.lng.privateKey2.invalidForDecrypt;
						break;						
					default:
						_msg = this.lng.process.error;
				}
				let _processMessages = this.state.processMessages.concat(_msg);
				this.setState({ 
					processRunning: false, 
					processMessages: _processMessages, 
					showProcessMessages: true, 
					processState: 'danger' 
				});
			}
		);  	
  }

	handleDecrypt(){
		console.log('handleDecrypt init');
		this.setState(
			{ processRunning: true, processMessages: [], showProcessMessages: false }, 
			() => { 
				setTimeout(() => { this.decrypt(); }, 1500);
		});
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
	      console.log('loadFileForDecrypt', error);
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
					let _msg = '';
					switch(error.message){
						case 'dontReadPrivateKey':
							_msg = this.lng.privateKey1.invalidPassphrase;
							this.setState({ passPhraseKeyCorrect1: false });
							break;
						default:
							_msg = this.lng.privateKey1.error;
					}
					reject({ message: _msg });
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
					let _msg = '';
					switch(error.message){
						case 'dontReadPrivateKey':
							_msg = this.lng.privateKey2.invalidPassphrase;
							this.setState({ passPhraseKeyCorrect2: false });
							break;
						default:
							_msg = this.lng.privateKey2.error;
					}					
					reject({ message: _msg });
				});
		});
	}

	render(){
    const _spinnerButton =
      <div className="spinnerContainer">
        <Loader color="#F7FDFA" size="32px" margin="4px"/>
      </div>;

    const _buttonDecrypting = (this.state.loadingPublicKeysState !== 'danger')
      ? <Button bsStyle="primary" disabled>
        	<div className="box-encrypt-text-encripting">
          	{ this.lng.buttonProcess.labelDecrypt }
        	</div>
        	{_spinnerButton}
      	</Button>
      : null;

    const _buttonDecrypt = (this.state.selectedFile && this.state.selectedKey1 && this.state.selectedKey2) 
      ? <Button bsStyle="primary" onClick={this.handleDecrypt.bind(this)}>{this.lng.buttonDecrypt.label}</Button>
      : <Button bsStyle="primary" disabled onClick={this.handleDecrypt.bind(this)}>{this.lng.buttonDecrypt.label}</Button>;

   	const _finalButton = (this.state.processRunning) ? _buttonDecrypting : _buttonDecrypt;

    const _passPhraseKeyState1 = (!this.state.passPhraseKeyCorrect1)
      ? 'error'
      : (this.state.passPhraseKey1.length > 0)
        ? 'success'
        : null;

    const _passPhraseKeyMessage1 = (_passPhraseKeyState1 === 'success')
      ? this.lng.passPhraseKey1.success
      : (_passPhraseKeyState1 === 'error')
        ? this.lng.passPhraseKey1.error
        : this.lng.passPhraseKey1.help;

		const _passPhraseKey1 = (!this.state.processRunning)
			? <FormGroup validationState={ _passPhraseKeyState1 } >
          <ControlLabel>{this.lng.passPhraseKey1.label}</ControlLabel>
          <FormControl
            type="text"
            value={this.state.passPhraseKey1}
            placeholder={this.lng.passPhraseKey1.placeholder}
            onChange={ event => { this.setState({ passPhraseKey1: event.target.value.trim(), passPhraseKeyCorrect1: true }) }}
          />
          <FormControl.Feedback />
          <HelpBlock className="helpMessage">{ _passPhraseKeyMessage1 }</HelpBlock>
        </FormGroup>
      : <FormGroup validationState={ _passPhraseKeyState1 } >
          <ControlLabel>{this.lng.passPhraseKey1.label}</ControlLabel>
          <FormControl
          	disabled
            type="text"
            value={this.state.passPhraseKey1}
            placeholder={this.lng.passPhraseKey1.placeholder}
            onChange={ event => { this.setState({ passPhraseKey1: event.target.value.trim(), passPhraseKeyCorrect1: true }) }}
          />
          <FormControl.Feedback />
          <HelpBlock className="helpMessage">{ _passPhraseKeyMessage1 }</HelpBlock>          
        </FormGroup>;

    const _inputKey1 = <InputFile accept=".gpg" lng={this.lng.privateKey1} 
    	enabled={((this.state.passPhraseKey1.length > 0) ? true : false) && !this.state.processRunning } 
    	reset={this.state.passPhraseKey1} 
    	process={this.loadPrivateKey1.bind(this)} valid={ (state) => { this.setState({ selectedKey1 : state }) }} />

    const _passPhraseKeyState2 = (!this.state.passPhraseKeyCorrect2)
      ? 'error'
      : (this.state.passPhraseKey2.length > 0)
        ? 'success'
        : null;

    const _passPhraseKeyMessage2 = (_passPhraseKeyState2 === 'success')
      ? this.lng.passPhraseKey2.success
      : (_passPhraseKeyState2 === 'error')
        ? this.lng.passPhraseKey2.error
        : this.lng.passPhraseKey2.help;

		const _passPhraseKey2 = (!this.state.processRunning)
			? <FormGroup validationState={ _passPhraseKeyState2 } >
          <ControlLabel>{this.lng.passPhraseKey2.label}</ControlLabel>
          <FormControl
            type="text"
            value={this.state.passPhraseKey2}
            placeholder={this.lng.passPhraseKey2.placeholder}
            onChange={ event => { this.setState({ passPhraseKey2: event.target.value.trim(), passPhraseKeyCorrect2: true }) }}
          />
          <FormControl.Feedback />
          <HelpBlock className="helpMessage">{ _passPhraseKeyMessage2 }</HelpBlock>          
        </FormGroup>
      : <FormGroup validationState={ _passPhraseKeyState2 } >
          <ControlLabel>{this.lng.passPhraseKey2.label}</ControlLabel>
          <FormControl
          	disabled
            type="text"
            value={this.state.passPhraseKey2}
            placeholder={this.lng.passPhraseKey2.placeholder}
            onChange={ event => { this.setState({ passPhraseKey2: event.target.value.trim(), passPhraseKeyCorrect2: true }) }}
          />
          <FormControl.Feedback />
          <HelpBlock className="helpMessage">{ _passPhraseKeyMessage2 }</HelpBlock>          
        </FormGroup>;

    const _inputKey2 = <InputFile accept=".gpg" lng={this.lng.privateKey2} reset={this.state.passPhraseKey2} 
    	enabled={((this.state.passPhraseKey2.length > 0) ? true : false) && !this.state.processRunning } 
    	process={this.loadPrivateKey2.bind(this)} valid={ (state) => { this.setState({ selectedKey2 : state }) }} />

    const _processMessages = this.state.processMessages.map((message, index) => {
      return <li key={"pmKey" + index }>{message}</li>;
    });

    const _spinner = 
      <div className="spinnerContainer">
        <Loader color="#428BCA" size="32px" margin="4px"/>
      </div>;

    const _publicKeys = (this.state.loadingPublicKeys && this.state.loadingPublicKeysState == 'info')
      ? <li>
          <div className="box-encrypt-text-loading-public-keys">{this.state.loadingPublicKeysMessage}</div>
          <div className="box-encrypt-spinner-loading-public-keys">
          {_spinner}
          </div>
        </li>
      : <li>
          {this.state.loadingPublicKeysMessage}
        </li>;

		return (
			<form>
				<InputFile accept=".cfe, .cfei" lng={this.lng.fileToDecrypt} 
					reset={this.state.resetInputs} 
					enabled={!this.state.processRunning}
					process={this.loadFileForDecrypt.bind(this)} 
					valid={ (state) => { this.setState({ selectedFile : state }) }} />
				{_passPhraseKey1}
        {_inputKey1}
        {_passPhraseKey2}
        {_inputKey2}       
        <div className="box-encrypt-footer">
          <hr />
          <div className="containerButton">
        		{_finalButton}
            <br />
            <br />
            <Collapse in={this.state.showProcessMessages}>
              <Alert bsStyle={this.state.processState}>
                <ul>{_processMessages}</ul>
              </Alert>
            </Collapse>
            <Collapse in={this.state.loadingPublicKeys}>
              <Alert bsStyle={this.state.loadingPublicKeysState}>
                <ul>
                  {_publicKeys}
                </ul>
              </Alert>
            </Collapse>                                         
            <p className="box-encrypt-footer-message">{this.lng.modal.footerMessage}
              <strong className="box-encrypt-footer-message-number">
                {this.lng.modal.footerMessageNumber}
              </strong>
            </p>
          </div>
        </div>        
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