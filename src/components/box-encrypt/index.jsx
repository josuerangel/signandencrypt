import React from 'react';
import PropTypes from 'prop-types';
import sindejs from '../sindejs/sindejs.js';
import Utils from '../sindejs/utils.js';
import UtilsFIEL from '../sindejs/utils_fiel.js';
import * as FileSaver from 'file-saver';
import pdfMake from "pdfmake/build/pdfmake";
import pdfFonts from "pdfmake/build/vfs_fonts";
pdfMake.vfs = pdfFonts.pdfMake.vfs;

import '../css/styles.min.css';
import { Row, Col, Form, FormRow, FormField, FormInput, FileUpload, Button, Spinner} from 'elemental';

class BoxEncrypt extends React.Component {
  constructor(props) {
    super(props);

    this.messageForEncryptB64;
    this.dataFileForEncrypt = {};
    this.publicKeys = {};
    this.privateKeys = {};
    this.FIEL = {};

    this.state = {
      // passPhrase: '12345678a',
      passPhrase: '',
      selectedFile: false,
      selectedCert: false,
      selectedKey: false,
      nameFileToDecrypt: ''
    }
  }

  componentDidMount(){
    const _loadPublicKey1 = sindejs.loadPublicKey('http://localhost:8080/apps2012/filesPublication/QApgp1.gpg');
    _loadPublicKey1.then(
      (key) => { this.publicKeys.key1 = key; console.log('_loadKey1'); console.log(this.publicKeys.key1); }, 
      (error) => { console.log(error) }
    );

    const _loadPublicKey2 = sindejs.loadPublicKey('http://localhost:8080/apps2012/filesPublication/QApgp2.gpg');
    _loadPublicKey2.then(
      (key) => { this.publicKeys.key2 = key; console.log('_loadKey2'); console.log(this.publicKeys.key2); }, 
      (error) => { console.log(error) }
    );
  }
 
  handlePassPhrase(event) {
    event.preventDefault();
    console.log(event.target.value);
    this.setState({passPhrase: event.target.value});
  }

  encryption(message, extension){
    console.log('start Encrypt');
    const encryptProcess = sindejs.encrypt(message, this.publicKeys);
    encryptProcess.then(
      (messageEncrypted) => {
        console.log('message encrypted');
        console.log(messageEncrypted);
        const nameFile = this.dataFileForEncrypt.originalName + "." + extension;
        const blobfile = new Blob([messageEncrypted], {type: "text/plain;charset=utf-8"});
        const dataFilesPDF = {
          encryptionExtension: extension,
          originalName: this.dataFileForEncrypt.originalName,
          originalMD5: this.dataFileForEncrypt.md5,
          originalSize: this.dataFileForEncrypt.sizeOriginalFile,
          name: nameFile,
          MD5: Utils.getMD5(messageEncrypted),
          size: blobfile.size + 3
        }
        FileSaver.saveAs(blobfile, nameFile);
        pdfMake.createPdf(sindejs.getPdfDefinition(this.publicKeys, dataFilesPDF, this.props.language)).download(nameFile + '.acuseGeneracion.pdf');
      }, 
      (error) => { console.log(error); }
    );    
  }

  handleEncrypt(event){
    event.preventDefault();
    this.encryption(this.messageForEncryptB64, "cfei");
  }

  handleSignEncrypt(event){
    event.preventDefault();
    console.log('start SingEncrypt');
    const singProcess = sindejs.sing(this.messageForEncryptB64, this.FIEL.certificatePem, this.FIEL.keyPEM);
    singProcess.then(
      (messageSigned)=> {
        console.log('messageSigned');
        console.log(messageSigned);
        this.encryption(messageSigned, "cfe");
      }, 
      (error) => { console.log(error); }
    );
  }

  loadFileForEncrypt(file){
    console.log('getOriginalDataFromName: ', Utils.getOriginalDataFromName(file.name));
    Object.assign(this.dataFileForEncrypt, Utils.getOriginalDataFromName(file.name));
    this.dataFileForEncrypt.sizeOriginalFile = file.size;
    const readFile = Utils.readFileToB64(file);
    readFile.then((data) => {
      console.log('loaded file for encrypt to B64: ', data);
      this.messageForEncryptB64 = data;
      this.dataFileForEncrypt.md5 = Utils.getMD5(this.messageForEncryptB64);
      console.log('this.dataFileForEncrypt: ',this.dataFileForEncrypt);
      this.setState({ selectedFile: true });
    }, (err) => {
      console.log('error in loading file for encrypt: ', err);
    });
  }

  loadCertificate(file){
    const readFile = UtilsFIEL.readCertificateToPEM(file);
    readFile.then((data) => {
      this.FIEL.certificatePem = data;
      console.log('loaded certificate: ');
      console.log(this.FIEL.certificatePem);
      this.setState({ selectedCert: true });
    }, (err) => {
      console.log('error in loading certificate: ', err);
    });
  }

  loadKeyFIEL(file){
    const readFile = UtilsFIEL.readKeyFIELToPEM(file, this.state.passPhrase);
    readFile.then((data) => {
      this.FIEL.keyPEM = data;
      console.log('loaded key fiel: ');
      console.log(this.FIEL.keyPEM);
      this.setState({ selectedKey: true });
    }, (err) => {
      console.log('error in loading key fiel: ', err);
    });
  }

  handleLoadFile(event, type){
    event.preventDefault();
    let file = event.target.files[0];
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
    const _buttonEncrypt = (this.state.selectedFile) 
      ? <Button type="primary" onClick={this.handleEncrypt.bind(this)}>encriptar</Button>
      : <Button type="primary" disabled onClick={this.handleEncrypt.bind(this)}>encriptar</Button>;

    const _buttonSingEncrypt = (this.state.selectedFile && this.state.selectedCert && this.state.selectedKey && this.state.passPhrase != '')
      ? <Button type="primary" onClick={this.handleSignEncrypt.bind(this)}>Firmar y Encriptar</Button>
      : <Button type="primary" disabled onClick={this.handleSignEncrypt.bind(this)}>Firmar y Encriptar</Button>;

    const _inputKey = (this.state.passPhrase == '')
      ? <FormInput type="file" disabled accept=".key" onChange={ event => { this.handleLoadFile(event, 'keyFIEL') }}></FormInput>
      : <FormInput type="file" accept=".key" onChange={ event => { this.handleLoadFile(event, 'keyFIEL') }}></FormInput>;

    return (

      <Row>
        <Col sm="1/2">
          <FormRow>
            <FormField label="Archivo a encriptar">
              <FormInput type="file" onChange={ event => { this.handleLoadFile(event, 'fileForEncrypt') } }></FormInput>
            </FormField>
          </FormRow>
          <FormRow>
            <FormField label="Certificado FIEL (.cer)">
              <FormInput type="file" accept=".cer" onChange={ event => { this.handleLoadFile(event, 'certificate') }}></FormInput>
            </FormField>
          </FormRow>
          <FormRow>
            <FormField label="Llave privada FIEL (.key)">
              <FormInput type="text" placeholder="Clave para la llave privada FIEL" onChange={this.handlePassPhrase.bind(this)} value={this.state.passPhrase}></FormInput>
              {_inputKey}
            </FormField>
          </FormRow>          
          <FormRow>
            {_buttonSingEncrypt}
            {_buttonEncrypt}
          </FormRow>
        </Col>
      </Row>

    )
  }
};

BoxEncrypt.defaultProps = {
  language: 'en'
};

BoxEncrypt.propTypes = {
  publicKey1: PropTypes.string.isRequired,
  publicKey2: PropTypes.string.isRequired,
  language: PropTypes.string
};

module.exports = BoxEncrypt;
