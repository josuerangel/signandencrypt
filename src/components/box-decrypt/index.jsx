import React from 'react';
import mime from 'mime-types';
import * as asn1js from "asn1js";
import {ContentInfo, EncapsulatedContentInfo, SignedData } from 'pkijs';
import Utils from '../utils.js';
import sindejs from '../sindejs.js';
import * as FileSaver from 'file-saver';
import * as pdfmake from 'pdfmake/build/pdfmake';
import * as vfs from 'pdfmake/build/vfs_fonts.js';
import '../styles.min.css';
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
			passPhraseKey1: '12345678a',
			passPhraseKey2: '12345678a'
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

	handleDecrypt(){
		console.log('handleDecrypt init');
		const _decrypt = sindejs.decrypt(this.dataFileForDecrypt.data, this.dataFileForDecrypt.type, this.publicKeys, this.privateKeys);
		_decrypt.then(
			(cms) => {
				console.log('cms after decrypt');
				console.log(cms);
				if (this.dataFileForDecrypt.encryptExtension == 'cfe') this.unsign(cms);
				else {
					const blobfile = Utils.b64toBlob(cms.data, this.dataFileForDecrypt.typeFile);
				  // const blobfile = new Blob([cms.data], {type: this.dataFileForDecrypt.typeFile});
      		FileSaver.saveAs(blobfile, this.dataFileForDecrypt.originalName);
				}
			},
			(error) => {
				console.log(error);
			}
		);
	}

	loadFileForDecrypt(file){
    Object.assign(this.dataFileForDecrypt, Utils.getOriginalDataFromName(file.name));
    const readFile = Utils.readFileForDecrypt(file);
    readFile.then((value) => {
      Object.assign(this.dataFileForDecrypt, value);
      console.log('loaded and parse file for decrypt: ', this.dataFileForDecrypt);
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
	            <FormInput type="file" onChange={ event => { this.handleLoadFile(event, 'fileForDecrypt') } }></FormInput>
	            <FormInput type="file" accept=".gpg" onChange={ event => { this.handleLoadFile(event, 'privateKey1') } }></FormInput>
	            <FormInput type="text" onChange={ event => { this.handlePassPhrase(event, 1) }} value={ this.state.passPhraseKey1 } ></FormInput>
	            <FormInput type="file" accept=".gpg" onChange={ event => { this.handleLoadFile(event, 'privateKey2') } }></FormInput>
	            <FormInput type="text" onChange={ event => { this.handlePassPhrase(event, 2) }} value={ this.state.passPhraseKey2 } ></FormInput>
	            <Button type="primary" onClick={this.handleDecrypt.bind(this)}><Spinner type="inverted" />Desencryptar</Button>
	        </FormRow>
	        </Col>
	      </Row>
				</div>
				)
		}
};

BoxDecrypt.propTypes = {
	publicKey1: PropTypes.string.isRequired,
	publicKey2: PropTypes.string.isRequired
}

module.exports = BoxDecrypt;