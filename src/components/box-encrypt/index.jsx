import React from 'react';
import PropTypes from 'prop-types';
import sindejs from '../sindejs/sindejs.js';
import Utils from '../sindejs/utils.js';
import UtilsFIEL from '../sindejs/utils_fiel.js';
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
import Well from 'react-bootstrap/lib/Well';
import ListGroup from 'react-bootstrap/lib/ListGroup';
import ListGroupItem from 'react-bootstrap/lib/ListGroupItem';

import Loader from 'halogen/RingLoader';
import '../css/spinner.styl';

import InputFile from '../input-file/index.jsx';

class BoxEncrypt extends React.Component {
  constructor(props) {
    super(props);

    this.messageForEncryptB64;
    this.dataFileForEncrypt = {};
    this.publicKeys = {};
    this.privateKeys = {};
    this.CA = [];
    this.FIEL = {};
    this.lng = Utils.getMessages(this.props.language);

    this.inputKey;

    this.state = {
      passPhrase: '',
      selectedFile: false,
      selectedFileValidation: null,
      selectedFileMessage: this.lng.fileToEncrypt.help,
      selectedFileRunning: false,
      selectedCert: false,
      selectedCertValidation: null,
      selectedCertMessage: this.lng.cert.help,
      selectedCertRunning: false,
      selectedKey: false,
      selectedKeyValidation: null,
      selectedKeyMessage: this.lng.key.help,
      selectedKeyRunning: false,
      nameFileToDecrypt: '',
      showProcessMessages: false,
      processRuning: false,
      processState: 'info',
      processMessages: [],
      test: [],
      signedProcess: null,
      encryptionProcess: null,
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

    // load CA certificates
    if (this.props.fiel) this.loadCertificatesCA();
  }

  loadCertificatesCA(){
    this.FIEL.CA = [];
    for(let x = 0; x < this.props.CA.length; x++){
      this.FIEL.CA[x] = {};
      const _loadCA = UtilsFIEL.readCertificateFromURL(this.props.CA[x]);
      _loadCA.then(
        (cert) => {
          this.FIEL.CA[x].cert = cert;
        },
        (error) => {
          console.log(error);
        }
      );
    }    
  }
 
  handlePassPhrase(event) {
    event.preventDefault();
    console.log(event.target.value);
    this.setState({passPhrase: event.target.value});
  }

  encryption(message, extension, certificate){
    console.log('start Encrypt');
    this.setState({ processMessages: [...this.state.processMessages, this.lng.encrypt.running]}, 
    () => {


    const encryptProcess = sindejs.encrypt(message, this.publicKeys);
    encryptProcess.then(
      (messageEncrypted) => {
        console.log('message encrypted');
        console.log(messageEncrypted);
        const nameFile = this.dataFileForEncrypt.originalName + "." + extension;
        const blobfile = new Blob([messageEncrypted], {type: "text/plain;charset=utf-8"});
        const dataFilesPDF = {
          certInfo: certificate,
          encryptionExtension: extension,
          originalName: this.dataFileForEncrypt.originalName,
          originalMD5: this.dataFileForEncrypt.md5,
          originalSize: this.dataFileForEncrypt.sizeOriginalFile,
          name: nameFile,
          MD5: Utils.getMD5(messageEncrypted),
          size: blobfile.size + 3
        }
        pdfMake.createPdf(sindejs.getPdfDefinition(this.publicKeys, dataFilesPDF, this.props.language)).download(nameFile + '.acuseGeneracion.pdf');
        FileSaver.saveAs(blobfile, nameFile);     
        this.setState({ 
          processRuning: false,
          processState: 'success',
          processMessages: [...this.state.processMessages, this.lng.encrypt.success],
        });
      }, 
      (error) => { 
        this.setState({ 
          processRuning: false,
          processState: 'error',
          processMessages: [...this.state.processMessages, this.lng.encrypt.error + '\n\n' + error],
        });
        console.log(error);
      }
    ); 


    });   
  }

  encrypt(){
    this.encryption(this.messageForEncryptB64, "cfei");
  }

  signEncrypt(){
    console.log('start SingEncrypt');
    this.setState({ processMessages: [...this.state.processMessages, this.lng.sign.running] });
    const singProcess = sindejs.sing(this.messageForEncryptB64, this.FIEL.certificatePem, this.FIEL.keyPEM);
    singProcess.then(
      (messageSigned)=> {
        console.log('messageSigned');
        console.log(messageSigned);
        console.log('certinfo\n', sindejs.getCertInfo(this.FIEL.certificatePem));
        this.setState({ processMessages: [...this.state.processMessages, this.lng.sign.success] });
        this.encryption(messageSigned, "cfe", sindejs.getCertInfo(this.FIEL.certificatePem));
      }, 
      (error) => { 
        console.log(error); 
        this.setState({ 
          processRuning: false,
          processState: 'error',
          processMessages: [...this.state.processMessages, this.lng.sign.error + '\n\n' + error],
        });
      }
    );
  }

  handleProcess(event, process){
    console.log('handleProcess process: ', process);
    this.setState({
      showProcessMessages: true,
      processRuning: true,
      processState: 'info',
      processMessages: [this.lng.process.running],
    }, () => {
      setTimeout(() => {
        if (process == 'encrypt') this.encrypt();
        else this.signEncrypt();        
      }, 1500);
    });
  }

  validateFileForEncrypt(){
    console.log('validateFileForEncrypt this.dataFileForEncrypt: ', this.dataFileForEncrypt);
    let _messageValidate = '';

    // validate extensions
    const _badExtension = this.props.blockedExtensions.includes(this.dataFileForEncrypt.encryptExtension);
    if (_badExtension) 
      _messageValidate = this.lng.fileToEncrypt.validateExtensions + this.props.blockedExtensions.join(',');

    // validate max size
    if (this.props.maxSize != 0) {
      const _maxSize = this.props.maxSize * 1024 * 1024;
      if (this.dataFileForEncrypt.sizeOriginalFile > _maxSize) {
        _messageValidate = (this.props.language == 'sp')
            ? 'El archivo ' + this.dataFileForEncrypt.originalName + ' supera el tamaño límite de ' + this.props.maxSize + ' MB'
            : 'The file ' + this.dataFileForEncrypt.originalName + ' exceeds the limit size of ' + this.props.maxSize + ' MB';
        return;
      }
    }

    if (_messageValidate.length > 0) {
      this.setState({
        selectedFile: false,
        selectedFileValidation: 'error',
        selectedFileMessage: _messageValidate,
        selectedFileRunning: false,
      });
      return false;
    }
    else return true;
  }

  loadFileForEncrypt(file){
    console.log('loadFileForEncrypt');
    this.setState({ 
      showProcessMessages: false,
      selectedFileRunning: true,
      selectedFileMessage: this.lng.fileToEncrypt.readRunning,
      selectedFileValidation: null,
    });

    Object.assign(this.dataFileForEncrypt, Utils.getOriginalDataFromName(file.name));
    this.dataFileForEncrypt.sizeOriginalFile = file.size;

    if (!this.validateFileForEncrypt()) return;

    // necesary setTimeout for don't block UI whith long files seleted
    setTimeout(() => {
      console.log('loadFileForEncrypt read process');
      // read file for convert to B64 
      const readFile = Utils.readFileToB64(file);
      readFile.then((data) => {      
        this.messageForEncryptB64 = data;
        console.log('loaded file for encrypt to B64: ', this.messageForEncryptB64);

        this.dataFileForEncrypt.md5 = Utils.getMD5(this.messageForEncryptB64);
        console.log('this.dataFileForEncrypt: ',this.dataFileForEncrypt);

        this.setState({
          selectedFile: true,
          selectedFileValidation: 'success',
          selectedFileMessage: this.lng.fileToEncrypt.valid,
          selectedFileRunning: false,
        });
      }, (error) => {
        this.setState({
          selectedFile: false,
          selectedFileValidation: 'error',
          selectedFileMessage: this.lng.fileToEncrypt.error + '\n\n' + error,
          selectedFileRunning: false,
        });
        console.log('error in loading file for encrypt: ', error);
      });
    }, 1500);
  }

  loadCertificate(file){
    console.log('loadCertificate');
    this.setState({ 
      showProcessMessages: false,
      selectedCertRunning: true,
      selectedCertMessage: this.lng.cert.readRunning,
      selectedCertValidation: null,
    });

    setTimeout(() => {
      const _cert = sindejs.readAndValidateCertificate(file, this.FIEL.CA);
      _cert.then(
        (cert) => { 
          this.FIEL.certificatePem = cert;
          this.setState({ 
            selectedCert: true,
            selectedCertRunning: false,
            selectedCertMessage: this.lng.cert.valid,
            selectedCertValidation: 'success',
          });
        },
        (error) => { 
          console.log('error in loading certificate: ', error);
          this.setState({ 
            selectedCert: false,
            selectedCertRunning: false,
            selectedCertMessage: this.lng.cert.error + '\n\n' + error.message,
            selectedCertValidation: 'error',
          });
        }
      );
    }, 1500);
  }

  loadKeyFIEL(file){
    this.setState({ 
      showProcessMessages: false,
      selectedKeyRunning: true,
      selectedKeyMessage: this.lng.key.readRunning,
      selectedKeyValidation: null,
    }, () => {
      setTimeout(() => {
        const readFile = UtilsFIEL.readKeyFIELToPEM(file, this.state.passPhrase);
        readFile.then((data) => {
          this.FIEL.keyPEM = data;
          console.log('loaded key fiel: ');
          console.log(this.FIEL.keyPEM);
          this.setState({
            selectedKey: true,
            selectedKeyRunning: false,
            selectedKeyMessage: this.lng.key.valid,
            selectedKeyValidation: 'success',
          });      
        }, (error) => {
          console.log('error in loading key fiel: ', error);      
          this.setState({
            selectedKey: false,
            selectedKeyRunning: false,
            selectedKeyMessage: this.lng.key.error + '      --     ' + error.message,
            selectedKeyValidation: 'error',
          });
          this.inputKey.value = "";
        });

      }, 1500);
    });
  }

  handleLoadFile(event, type){
    console.log('handleLoadFile');
    event.preventDefault();
    let file = event.target.files[0];
    console.log('handleLoadFile set file to var');
    switch (type) {
      case 'fileForEncrypt':
        this.loadFileForEncrypt(file);
        break;
      case 'certificate':
        this.loadCertificate(file);
        break;
      case 'keyFIEL':
        this.loadKeyFIEL(file);
        break;
      default:
        console.log('Do not exist that type for load file');
    }
  }

  render() {
    const _spinnerBlockHelp = 
      <div className="spinnerContainer">
        <Loader color="#48A0DC" size="32px" margin="4px"/>
      </div>;

    const _buttonEncrypt = (this.state.selectedFile && !this.state.processRuning) 
      ? <Button bsStyle="primary" onClick={ event => { this.handleProcess(event, 'encrypt') } }>{this.lng.buttonEncrypt.label}</Button>
      : <Button bsStyle="primary" disabled onClick={ event => { this.handleProcess(event, 'encrypt') } }>{this.lng.buttonEncrypt.label}</Button>;

    const _buttonSingEncrypt = (this.state.selectedFile && this.state.selectedCert 
      && this.state.selectedKey && this.state.passPhrase != '' && !this.state.processRuning)
      ? <Button bsStyle="primary" onClick={ event => { this.handleProcess(event, 'singandencrypt') } }>Firmar y Encriptar</Button>
      : <Button bsStyle="primary" disabled onClick={ event => { this.handleProcess(event, 'singandencrypt') } }>Firmar y Encriptar</Button>;
    
    const _button = (this.props.fiel) ? _buttonSingEncrypt : _buttonEncrypt;

    const _fielCertificate = (this.props.fiel) 
      ? <FormGroup controlId="formCert" validationState={this.state.selectedCertValidation} >
          <ControlLabel>{this.lng.cert.label}</ControlLabel>
          <FormControl type="file" accept=".cer" onChange={ event => { this.handleLoadFile(event, 'certificate') } } />
          <FormControl.Feedback />
          <HelpBlock className="HelpBlockSpinner">
            <div className={(this.state.selectedCertRunning) ? "helpMessageSpinner" : "helpMessage"}>
              {this.state.selectedCertMessage}
            </div>
            {(this.state.selectedCertRunning) ? _spinnerBlockHelp : null}
          </HelpBlock>
        </FormGroup>
      : null;

    const _fielPassPhrase = (this.props.fiel)
      ? <FormGroup
          validationState={(this.state.passPhrase.length) ? 'success' : null }
        >
          <ControlLabel>{this.lng.passPhrase.label}</ControlLabel>
          <FormControl
            type="text"
            value={this.state.passPhrase}
            placeholder={this.state.passPhrase.placeholder}
            onChange={this.handlePassPhrase.bind(this)}
          />
          <FormControl.Feedback />
          <HelpBlock>{this.lng.passPhrase.help}</HelpBlock>          
        </FormGroup>
      : null;

    let _fielKey = null;
    if (this.props.fiel){
      _fielKey = (this.state.passPhrase.length > 0)
        ?
          <FormGroup controlId="formKey" validationState={ this.state.selectedKeyValidation }>
            <ControlLabel>{this.lng.key.label}</ControlLabel>
            <FormControl type="file" accept=".key" onChange={ event => { this.handleLoadFile(event, 'keyFIEL') }}
              ref={(input) => this.inputKey = input } />
            <FormControl.Feedback />
            <HelpBlock className="HelpBlockSpinner">
              <div className={(this.state.selectedKeyRunning) ? "helpMessageSpinner" : "helpMessage"}>
                {this.state.selectedKeyMessage}
              </div>
              {(this.state.selectedKeyRunning) ? _spinnerBlockHelp : null}
            </HelpBlock>
          </FormGroup>
        :
          <FormGroup controlId="formKey" validationState={ this.state.selectedKeyValidation }>
            <ControlLabel>{this.lng.key.label}</ControlLabel>
            <FormControl disabled type="file" accept=".key" onChange={ event => { this.handleLoadFile(event, 'keyFIEL') }} />
            <FormControl.Feedback />
            <HelpBlock className="HelpBlockSpinner">
              <div className={(this.state.selectedKeyRunning) ? "helpMessageSpinner" : "helpMessage"}>
                {this.state.selectedKeyMessage}
              </div>
              {(this.state.selectedKeyRunning) ? _spinnerBlockHelp : null}
            </HelpBlock>
          </FormGroup>

    }

    const _processMessages = this.state.processMessages.map((message, index) => { 
      return <li key={"pmKey" + index }>{message}</li>;
    });

    const _alert = (this.state.processRuning) 
      ? <Alert bsStyle={this.state.processState}>
          <ul>{_processMessages}</ul>
        </Alert>
      : <Alert bsStyle={this.state.processState}>
          <ul>{_processMessages}</ul>
        </Alert>;

    return (
      <form>
        <InputFile lng={this.lng.inputFile} />
        <FormGroup controlId="formFileEncrypt" validationState={this.state.selectedFileValidation}>
          <ControlLabel>{this.lng.fileToEncrypt.label}</ControlLabel>
          <FormControl type="file" onChange={ event => { this.handleLoadFile(event, 'fileForEncrypt') } } />
          <FormControl.Feedback />
          <HelpBlock className="HelpBlockSpinner">
            <div className={(this.state.selectedFileRunning) ? "helpMessageSpinner" : "helpMessage"}>
              {this.state.selectedFileMessage}
            </div>
            {(this.state.selectedFileRunning) ? _spinnerBlockHelp : null}
          </HelpBlock>
        </FormGroup>
        {_fielCertificate}
        {_fielPassPhrase}
        {_fielKey}
        {_button}
        <br />
        <br />
        <Collapse in={this.state.showProcessMessages}>
          <Alert bsStyle={this.state.processState}>
            <ul>{_processMessages}</ul>
          </Alert>
        </Collapse>
      </form>

    )
  }
};

BoxEncrypt.defaultProps = {
  fiel: true,
  language: 'en',
  blockedExtensions: [],
  maxSize: 0,
};

BoxEncrypt.propTypes = {
  publicKey1: PropTypes.string.isRequired,
  publicKey2: PropTypes.string.isRequired,
  fiel: PropTypes.bool,
  CA: PropTypes.array,
  OSCP: PropTypes.array,
  language: PropTypes.string,
  blockedExtensions: PropTypes.array,
  maxSize: PropTypes.number,
};

module.exports = BoxEncrypt;
