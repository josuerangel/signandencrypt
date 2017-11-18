import React, { Component } from 'react';
import Button from 'react-bootstrap/lib/Button';
import Modal from 'react-bootstrap/lib/Modal';
import Popover from 'react-bootstrap/lib/Popover';
import Tooltip from 'react-bootstrap/lib/Tooltip';
import OverlayTrigger from 'react-bootstrap/lib/OverlayTrigger';
import BoxEncrypt from '../box-encrypt/index.jsx';
import '../css/style.styl';

export class ModalEncrypt extends Component {
  constructor(props){
  	super(props);
  	this.state = {
  		showModal: false,
  	};
  }

  close() {
    this.setState({ showModal: false });
  }

  open() {
    this.setState({ showModal: true });
  }

	render() {
    let options = this.props.options;
    const _style  = {
      display: 'inline-block',
      marginRight: '5px', 
    }
		return (
			<div style={ _style }>
				<Button bsStyle="primary" onClick={this.open.bind(this)} >{ this.props.options.language.modal.buttonLauncher }</Button>
				<Modal show={this.state.showModal} onHide={this.close.bind(this)}>
          <Modal.Header className="box-encrypt-header" closeButton>
            <Modal.Title className="box-encrypt-header-text">{this.props.options.language.modal.header}</Modal.Title>
          </Modal.Header>
          <Modal.Body>
          	<BoxEncrypt
							fiel={options.fiel.show}
							CA={options.fiel.certificate.CA}
              OSCPUrl={options.fiel.certificate.OSCPUrl}
							publicKey1={options.publicKeys.key1}
							publicKey2={options.publicKeys.key2}
							blockedExtensions={options.blockedExtensions}
							language={options.language}
							maxSize={options.maxSize}
						/>
          </Modal.Body>
        </Modal>				
			</div>
		);
	}
}

module.exports = ModalEncrypt;