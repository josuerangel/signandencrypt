import React from 'react';
import PropTypes from 'prop-types';
import sindejs from '../../sindejs/sindejs.js';
import Utils, {fetchCheckText, jsonParse} from '../../sindejs/utils.js';
import UtilsFIEL from '../../sindejs/utils_fiel.js';
import * as FileSaver from 'file-saver';
import pdfMake from "pdfmake/build/pdfmake";
import pdfFonts from "pdfmake/build/vfs_fonts";
pdfMake.vfs = pdfFonts.pdfMake.vfs;
import format from 'string-template';
import ReactHtmlParser, { processNodes, convertNodeToElement, htmlparser2 } from 'react-html-parser';
import JSZip from "jszip"
import LZ4 from 'lz4';
import LZString from 'lz-string';

import FormGroup from 'react-bootstrap/lib/FormGroup';
import ControlLabel from 'react-bootstrap/lib/ControlLabel';
import FormControl from 'react-bootstrap/lib/FormControl';
import HelpBlock from 'react-bootstrap/lib/HelpBlock';
import Button from 'react-bootstrap/lib/Button';
import Alert from 'react-bootstrap/lib/Alert';
import Collapse from 'react-bootstrap/lib/Collapse';

import InputFile from '../input-file/index.jsx';
import Loader from 'halogen/RingLoader';

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
    this.inputPassphrase;

    this.state = {
      passPhrase: '',
      passPhraseCorrect: true,
      selectedFile: false,
      selectedCert: false,
      selectedKey: false,
      nameFileToDecrypt: '',
      showProcessMessages: false,
      processRunning: false,
      processState: 'info',
      processMessages: [],
      signedProcess: null,
      encryptionProcess: null,
      resetInputs: '',
      loadingPublicKeys: false,
      loadingPublicKeysState: 'info',
      loadingPublicKeysMessage: '',
      validatingSession: false,
    }
  }

  componentDidMount(){
    this.loadPublicKeys();
    if (this.props.fiel) this.loadCertificatesCA();
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

  loadCertificatesCA(urlKeys){
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
    this.setState({ passPhrase: event.target.value.trim(), passPhraseCorrect: true, selectedKey: false });
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

          console.log("Size of messageEncrypted is: " + messageEncrypted.length);
          var compressedMessage = LZString.compress(messageEncrypted);
          console.log("Size of compressedMessage sample is: " + compressedMessage.length);

          const nameFile = this.dataFileForEncrypt.originalName + "." + extension;
          const blobfile = new Blob([messageEncrypted], {type: "text/plain;charset=utf-8"});
          // const blobfile = new Blob([compressedMessage]);
          // const blobfile = new Blob([messageEncrypted]);
          console.log('blobfile: ', blobfile);


          // const string = LZString.decompress(compressed);
          // console.log("Sample is: " + string);

          // const input = new Buffer(messageEncrypted);
          // console.log('encryption buffer');
          // let output = new Buffer( LZ4.encodeBound(input.length) );
          // console.log('encryption encodeBound');
          // const compressedSize = LZ4.encodeBlock(input, output)
          // // remove unnecessary bytes
          // output = output.slice(0, compressedSize)

          // console.log( "compressed data", output )

          // const blobfile2 = new Blob([output], {type: "text/plain;charset=utf-8"});
          // FileSaver.saveAs(blobfile2, nameFile);


          // let zipFile = new JSZip();
          // console.log('encryption before jszip.file');
          // zipFile.file("tempZipfile.txt", messageEncrypted);
          // console.log('encryption after jszip.file');
          // zipFile.generateAsync({type: "blob"})
          // .then(function (blob) {
          //   console.log('zipFile blob: ', blob);
          //     // saveAs(blob, nameFile);
          //     // FileSaver.saveAs(blob, nameFile);
          // });

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

          console.log('encryption this.props.language: ', this.lng.language);
          pdfMake.createPdf(sindejs.getPdfDefinition(this.publicKeys, dataFilesPDF, this.lng.language)).download(nameFile + '.acuseGeneracion.pdf');
          FileSaver.saveAs(blobfile, nameFile);
          this.setState({
            processRunning: false,
            processState: 'success',
            processMessages: [...this.state.processMessages, this.lng.encrypt.success],
            selectedFile: false,
            selectedCert: false, 
            passPhrase: '', 
            selectedKey: false,
            resetInputs: Math.random().toString(36).substring(7),
          });
        },
        (error) => {
          this.setState({
            processRunning: false,
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
          processRunning: false,
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
      processRunning: true,
      processState: 'info',
      processMessages: [this.lng.process.running],
    }, () => {
      fetch(this.props.validateSessionUrl, { method: 'GET', credentials: 'same-origin'})
        .then(fetchCheckText).then(jsonParse).then(response => {
          console.log('handleProcess fetch response: ', response);
          if (response.ResponseError !== undefined){
            // reject(Error(response.ResponseError[0].ErrorMessage));
            this.setState({ 
              validatingSession: true,
              processState: 'danger',
              processMessages: [ReactHtmlParser(response.ResponseError[0].ErrorMessage)],
            });
            return;
          }

          setTimeout(() => {
            if (process == 'encrypt') this.encrypt();
            else this.signEncrypt();
          }, 1500);


        });
    });
  }

  getMessageValidations(){
    console.log('getMessageValidations dataFileForEncrypt: ', this.dataFileForEncrypt);
    let _messageValidate = '';

    // validate extensions
    const _badExtension = this.props.blockedExtensions.includes(this.dataFileForEncrypt.encryptExtension);
    if (_badExtension)
      _messageValidate = this.lng.fileToEncrypt.invalidExtension.map(msg => { return format(msg, this.dataFileForEncrypt) });

    // validate max size
    if (this.props.maxSize != 0) {
      const _maxSize = this.props.maxSize * 1024 * 1024;
      if (this.dataFileForEncrypt.sizeOriginalFile > _maxSize) {
        _messageValidate = format(this.lng.fileToEncrypt.invalidSize, this.dataFileForEncrypt);
      }
    }

    return _messageValidate;
  }

  beforeLoadFileForEncrypt(){
    this.setState({ showProcessMessages: false, processMessages: []});
  }

  loadFileForEncrypt(file){
    return new Promise((resolve, reject) => {
      Object.assign(this.dataFileForEncrypt, 
        Utils.getOriginalDataFromName(file.name), 
        { sizeOriginalFile: file.size, sizeMax: this.props.maxSize, blockedExtensions: this.props.blockedExtensions.join(', ') }
      );
      const _msgValidations = this.getMessageValidations();
      if (_msgValidations.length > 0) {
        reject({ message: _msgValidations });
        return;
      }

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
    this.setState({ selectedCert: false, passPhrase: '', selectedKey: false, showProcessMessages: false, processMessages: [] });
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
            this.inputPassphrase.focus();
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
      let rejectMessage = this.lng.key.error;
      const readFile = UtilsFIEL.readKeyFIELToPEM(file, this.state.passPhrase, this.FIEL.certificatePem);
      readFile.then((data) => {
        this.FIEL.keyPEM = data;
        console.log('loaded key fiel: ');
        console.log(this.FIEL.keyPEM);
        resolve();
      }, (error) => {
        console.log('error in loading key fiel: ', error);
        switch(error.message){
          case 'notMatchKeyWithCert':
            rejectMessage = this.lng.key.notMatchKeyWithCert;
            break;
          case 'invalidPassphrase':
            rejectMessage = this.lng.key.invalidPassphrase;
            this.setState({ passPhraseCorrect: false });
            break;
          default:
            rejectMessage = this.lng.key.error;
        }
        reject({ message: rejectMessage });
      });
    });
  }

  render() {
    const _spinnerButton =
      <div className="spinnerContainer">
        <Loader color="#F7FDFA" size="32px" margin="4px"/>
      </div>;

    const _whiteSpinner = 
      <div className="spinnerContainer">
        <Loader color="#428BCA" size="32px" margin="4px"/>
      </div>;

    const _cert = (this.props.fiel)
      ? <InputFile reset={this.state.resetInputs} enabled={!this.state.processRunning}  accept=".cer" 
          lng={this.lng.cert} beforeProcess={ this.beforeLoadCertificate.bind(this) } 
          process={this.loadCertificate.bind(this)} valid={ (state) => { this.setState({ selectedCert : state }) }} />
      : null;

    const _passPhraseState = (!this.state.passPhraseCorrect)
      ? 'error'
      : (this.state.passPhrase.length > 0)
        ? 'success'
        : null;

    const _passPhraseMessage = (_passPhraseState === 'success')
      ? this.lng.passPhrase.success
      : (_passPhraseState === 'error')
        ? this.lng.passPhrase.error
        : this.lng.passPhrase.help;

    const _passPhrase = (this.state.selectedCert && !this.state.processRunning)
      ? <FormGroup validationState={_passPhraseState} >
          <ControlLabel>{this.lng.passPhrase.label}</ControlLabel>
            <FormControl
              inputRef={ ref => this.inputPassphrase = ref }
              type="text"
              value={this.state.passPhrase}
              placeholder={this.state.passPhrase.placeholder}
              onChange={this.handlePassPhrase.bind(this)}
            />
            <FormControl.Feedback />
          <HelpBlock className="helpMessage">{ _passPhraseMessage }</HelpBlock>
        </FormGroup>
      : <FormGroup validationState={ _passPhraseState } >
          <ControlLabel>{this.lng.passPhrase.label}</ControlLabel>
            <FormControl
              disabled
              inputRef={ ref => this.inputPassphrase = ref }
              type="text"
              value={this.state.passPhrase}
              placeholder={this.state.passPhrase.placeholder}
              onChange={this.handlePassPhrase.bind(this)}
            />
            <FormControl.Feedback />
          <HelpBlock className="helpMessage">{ _passPhraseMessage }</HelpBlock>
        </FormGroup>;

    const _fielPassPhrase = (this.props.fiel)
      ? _passPhrase
      : null;

    const _key = (this.props.fiel)
      ? <InputFile accept=".key" lng={this.lng.key} reset={this.state.passPhrase} 
          enabled={((this.state.passPhrase.length > 0) ? true : false) && !this.state.processRunning} 
          process={this.loadKeyFIEL.bind(this)} valid={ (state) => { this.setState({ selectedKey : state }) }} />
      : null;

    const _buttonEncrypt = (this.state.selectedFile && !this.state.processRunning)
      ? <Button bsStyle="primary" onClick={ event => { this.handleProcess(event, 'encrypt') } }>{this.lng.buttonEncrypt.label}</Button>
      : <Button bsStyle="primary" disabled onClick={ event => { this.handleProcess(event, 'encrypt') } }>{this.lng.buttonEncrypt.label}</Button>;

    const _buttonSingEncrypt = (this.state.selectedFile && this.state.selectedCert
      && this.state.selectedKey && this.state.passPhrase != '' && !this.state.processRunning)
      ? <Button bsStyle="primary" onClick={ event => { this.handleProcess(event, 'singandencrypt') } }>{this.lng.buttonSignEncrypt.label}</Button>
      : <Button bsStyle="primary" disabled onClick={ event => { this.handleProcess(event, 'singandencrypt') } }>{this.lng.buttonSignEncrypt.label}</Button>;

    const _buttonEncrypting = (this.state.loadingPublicKeysState !== 'danger' && !this.state.validatingSession)
      ? <Button bsStyle="primary" disabled>
        <div className="box-encrypt-text-encripting">
          {(this.props.fiel) ? this.lng.buttonProcess.labelSignEncrypt : this.lng.buttonProcess.labelEncrypt }
        </div>
        {_spinnerButton}
      </Button>
      : null;

    const _button = (this.props.fiel) ? _buttonSingEncrypt : _buttonEncrypt;

    const _finalButton = (this.state.processRunning) ? _buttonEncrypting : _button;

    const _processMessages = this.state.processMessages.map((message, index) => {
      return <li key={"pmKey" + index }>{message}</li>;
    });

    const _publicKeys = (this.state.loadingPublicKeys && this.state.loadingPublicKeysState == 'info')
      ? <li>
          <div className="box-encrypt-text-loading-public-keys">{this.state.loadingPublicKeysMessage}</div>
          <div className="box-encrypt-spinner-loading-public-keys">
          {_whiteSpinner}
          </div>
        </li>
      : <li>
          {this.state.loadingPublicKeysMessage}
        </li>;

    return (
      <form>
        <InputFile reset={this.state.resetInputs} enabled={!this.state.processRunning} lng={this.lng.fileToEncrypt} 
          process={this.loadFileForEncrypt.bind(this)} beforeProcess={ this.beforeLoadFileForEncrypt.bind(this) } 
          valid={ (state) => { this.setState({ selectedFile : state }) }} />
        {_cert}
        {_fielPassPhrase}
        {_key}
        <div className="box-encrypt-footer">
          <hr />
          <div className="containerButton">
            {_finalButton}
            <br />
            <br />
            <Collapse in={this.state.validatingSession}>
              <Alert bsStyle={this.state.processState}>
                <ul>
                  {_processMessages}
                </ul>
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
