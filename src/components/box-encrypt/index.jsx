import React from 'react';
import PropTypes from 'prop-types';
import Utils from '../utils.js';
import UtilsFIEL from '../utils_fiel.js';
import sindejs from '../sindejs.js';
import * as FileSaver from 'file-saver';
import pdfMake from "pdfmake/build/pdfmake";
import pdfFonts from "pdfmake/build/vfs_fonts";
pdfMake.vfs = pdfFonts.pdfMake.vfs;

import '../styles.min.css';
import { Row, Col, FormRow, FormField, FormInput, FileUpload, Button, Spinner} from 'elemental';

class BoxEncrypt extends React.Component {
  constructor(props) {
    super(props);

    this.messageForEncryptB64;
    this.dataFileForEncrypt = {};
    this.publicKeys = {};
    this.privateKeys = {};
    this.FIEL = {};

    this.state = {
      passPhrase: '12345678a',
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

  handleEncrypt(event){
    event.preventDefault();
    console.log('start Encrypt');
    const encryptProcess = sindejs.encrypt(this.messageForEncryptB64, this.publicKeys);
    encryptProcess.then(
      (messageEncrypted) => {
        console.log('message encrypted');
        console.log(messageEncrypted);
        const blobfile = new Blob([messageEncrypted], {type: "text/plain;charset=utf-8"});
        console.log('this.dataFileForEncrypt', this.dataFileForEncrypt);
        const dataFilesPDF = {
          originalName: this.dataFileForEncrypt.originalName,
          originalMD5: this.dataFileForEncrypt.md5,
          originalSize: this.dataFileForEncrypt.sizeOriginalFile,
          name: this.dataFileForEncrypt.originalName + ".cfei",
          MD5: Utils.getMD5(messageEncrypted),
          size: blobfile.size + 3
        }
        FileSaver.saveAs(blobfile, this.dataFileForEncrypt.originalName + ".cfei");
        pdfMake.createPdf(sindejs.getPdfDefinition(this.publicKeys, dataFilesPDF)).download(this.dataFileForEncrypt.originalName + '.acuseGeneracion.pdf');
      }, 
      (error) => { console.log(error); }
    );
  }

  handleSignEncrypt(event){
    event.preventDefault();
    console.log('start SingEncrypt');
    const singProcess = sindejs.sing(this.messageForEncryptB64, this.FIEL.certificatePem, this.FIEL.keyPEM);
    singProcess.then(
      (messageSigned)=> {
        console.log('messageSigned');
        console.log(messageSigned);
        const encryptProcess = sindejs.encrypt(messageSigned, this.publicKeys);
        encryptProcess.then(
          (messageEncrypted) => {
            console.log('message encrypted');
            console.log(messageEncrypted);
            const blobfile = new Blob([messageEncrypted], {type: "text/plain;charset=utf-8"});
            console.log('blob: ', blobfile);
            const dataFilesPDF = {
              originalName: this.dataFileForEncrypt.originalName,
              originalMD5: this.dataFileForEncrypt.md5,
              originalSize: this.dataFileForEncrypt.sizeOriginalFile,
              name: this.dataFileForEncrypt.originalName + ".cfe",
              MD5: Utils.getMD5(messageEncrypted),
              size: blobfile.size + 3
            }
            FileSaver.saveAs(blobfile, this.dataFileForEncrypt.originalName + ".cfe");
            pdfMake.createPdf(sindejs.getPdfDefinition(this.publicKeys, dataFilesPDF)).download(this.dataFileForEncrypt.originalName + '.acuseGeneracion.pdf');            
          }, 
          (error) => { console.log(error); }
        );
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
    return (
      <div>
      <Row>
        <Col sm="1/4">
          <FormRow>
            <FormField label="Archivo a encriptar"></FormField>
          </FormRow>
        </Col>
        <Col sm="3/4">
          <FormRow>
            <FormInput type="file" onChange={ event => { this.handleLoadFile(event, 'fileForEncrypt') } }></FormInput>
            <FormInput type="file" accept=".cer" onChange={ event => { this.handleLoadFile(event, 'certificate') }}></FormInput>
            <FormInput type="file" accept=".key" onChange={ event => { this.handleLoadFile(event, 'keyFIEL') }}></FormInput>
            <FormInput type="text" onChange={this.handlePassPhrase.bind(this)} value={this.state.passPhrase}></FormInput>
            <Button type="primary" onClick={this.handleSignEncrypt.bind(this)}><Spinner type="inverted" />firmando y encriptando</Button>
            <Button type="primary" onClick={this.handleEncrypt.bind(this)}>encriptar</Button>
        </FormRow>
        </Col>
      </Row>
      </div>
    )
  }
}

BoxEncrypt.propTypes = {
  publicKey1: PropTypes.string.isRequired,
  publicKey2: PropTypes.string.isRequired
}

module.exports = BoxEncrypt;
