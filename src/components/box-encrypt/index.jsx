import React from 'react';
import PropTypes from 'prop-types';
import sindejs from '../../sindejs/sindejs.js';
import Utils from '../../sindejs/utils.js';
import UtilsFIEL from '../../sindejs/utils_fiel.js';
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

class BoxEncrypt extends React.Component {
  constructor(props) {
    super(props);

    this.messageForEncryptB64 = null;
    this.dataFileForEncrypt = {};
    this.publicKeys = {};
    this.privateKeys = {};
    this.CA = [];
    this.FIEL = {};
    this.lng = this.props.language;

    this.inputKey = null;

    this.state = {
      passPhrase: '',
      selectedFile: false,
      selectedCert: false,
      selectedKey: false,
      nameFileToDecrypt: '',
      showProcessMessages: false,
      processRuning: false,
      processState: 'info',
      processMessages: [],
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
    this.setState({ passPhrase: event.target.value });
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

  getMessageValidations(){
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
      }
    }

    return _messageValidate;
  }

  loadFileForEncrypt(file){
    return new Promise((resolve, reject) => {
      Object.assign(this.dataFileForEncrypt, Utils.getOriginalDataFromName(file.name), { sizeOriginalFile: file.size });
      const _msgValidations = this.getMessageValidations();
      if (_msgValidations.length > 0) {
        reject({ message: _msgValidations });
        return;
      }

      // read file for convert to B64
      const readFile = Utils.readFileToB64(file);
      readFile.then((data) => {
        this.messageForEncryptB64 = data;
        this.dataFileForEncrypt.md5 = Utils.getMD5(this.messageForEncryptB64);
        resolve({});
      }, (error) => {
        reject({ message: error });
      });
    });
  }

  beforeLoadCertificate(file){
    this.setState({ passPhrase: '' });
  }

  loadCertificate(file){
    return new Promise((resolve, reject) => {
      console.log('loadCertificate');
        console.log(this.props);
        let rejectMessage = this.lng.cert.error;
        const _cert = sindejs.readAndValidateCertificate(file, this.FIEL.CA, this.props.OSCPUrl);
        _cert.then(
          (cert) => {
            this.FIEL.certificatePem = cert;
            resolve();
          },
          (error) => {
            console.log('error in loading certificate message: ', error.message);
            switch(error.message){
              case 'notValid':
                rejectMessage = this.lng.cert.notValid;
                break;
              case 'invalidSession':
                rejectMessage = this.lng.cert.invalidSession;
                break;
              default:
                rejectMessage = this.lng.cert.error;
            }
            reject({ message: rejectMessage });
          }
        );
    });
  }

  loadKeyFIEL(file){
    return new Promise((resolve, reject) => {
      const readFile = UtilsFIEL.readKeyFIELToPEM(file, this.state.passPhrase, this.FIEL.certificatePem);
      readFile.then((data) => {
        this.FIEL.keyPEM = data;
        console.log('loaded key fiel: ');
        console.log(this.FIEL.keyPEM);
        resolve();
      }, (error) => {
        console.log('error in loading key fiel: ', error);
        reject({ message: error.message });
      });
    });
  }

  render() {
    const _cert = (this.props.fiel)
      ? <InputFile  accept="application/pkix-cert" lng={this.lng.cert} beforeProcess={ this.beforeLoadCertificate.bind(this) } process={this.loadCertificate.bind(this)} valid={ (state) => { this.setState({ selectedCert : state }) }} />
      : null;

    const _passPhrase = (this.state.selectedCert)
      ? <FormGroup validationState={(this.state.passPhrase.length) ? 'success' : null } >
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
      : <FormGroup validationState={(this.state.passPhrase.length) ? 'success' : null } >
          <ControlLabel>{this.lng.passPhrase.label}</ControlLabel>
            <FormControl
              disabled
              type="text"
              value={this.state.passPhrase}
              placeholder={this.state.passPhrase.placeholder}
              onChange={this.handlePassPhrase.bind(this)}
            />
            <FormControl.Feedback />
          <HelpBlock>{this.lng.passPhrase.help}</HelpBlock>
        </FormGroup>;

    const _fielPassPhrase = (this.props.fiel)
      ? _passPhrase
      : null;

    const _key = (this.props.fiel)
      ? <InputFile accept=".key" lng={this.lng.key} reset={this.state.passPhrase} enabled={(this.state.passPhrase.length > 0) ? true : false } process={this.loadKeyFIEL.bind(this)} valid={ (state) => { this.setState({ selectedKey : state }) }} />
      : null;

    const _buttonEncrypt = (this.state.selectedFile && !this.state.processRuning)
      ? <Button bsStyle="primary" onClick={ event => { this.handleProcess(event, 'encrypt') } }>{this.lng.buttonEncrypt.label}</Button>
      : <Button bsStyle="primary" disabled onClick={ event => { this.handleProcess(event, 'encrypt') } }>{this.lng.buttonEncrypt.label}</Button>;

    const _buttonSingEncrypt = (this.state.selectedFile && this.state.selectedCert
      && this.state.selectedKey && this.state.passPhrase != '' && !this.state.processRuning)
      ? <Button bsStyle="primary" onClick={ event => { this.handleProcess(event, 'singandencrypt') } }>Firmar y Encriptar</Button>
      : <Button bsStyle="primary" disabled onClick={ event => { this.handleProcess(event, 'singandencrypt') } }>Firmar y Encriptar</Button>;

    const _button = (this.props.fiel) ? _buttonSingEncrypt : _buttonEncrypt;

    const _processMessages = this.state.processMessages.map((message, index) => {
      return <li key={"pmKey" + index }>{message}</li>;
    });

    return (
      <form>
        <InputFile lng={this.lng.fileToEncrypt} process={this.loadFileForEncrypt.bind(this)} valid={ (state) => { this.setState({ selectedFile : state }) }} />
        {_cert}
        {_fielPassPhrase}
        {_key}
        <div className="box-encrypt-footer">
          <hr />
          <div className="containerButton">
            {_button}
            <br />
            <br />
            <Collapse in={this.state.showProcessMessages}>
              <Alert bsStyle={this.state.processState}>
                <ul>{_processMessages}</ul>
              </Alert>
            </Collapse>            
            <p className="box-encrypt-footer-message">{this.lng.modal.footerMessage}<strong className="box-encrypt-footer-message-number">{this.lng.modal.footerMessageNumber}</strong></p>
          </div>
        </div>
      </form>

    )
  }
};

BoxEncrypt.defaultProps = {
  fiel: true,
  blockedExtensions: [],
  maxSize: 0,
};

BoxEncrypt.propTypes = {
  publicKey1: PropTypes.string.isRequired,
  publicKey2: PropTypes.string.isRequired,
  fiel: PropTypes.bool,
  CA: PropTypes.arrayOf(PropTypes.string),
  language: PropTypes.object.isRequired,
  blockedExtensions: PropTypes.arrayOf(PropTypes.string),
  maxSize: PropTypes.number,
};

module.exports = BoxEncrypt;
