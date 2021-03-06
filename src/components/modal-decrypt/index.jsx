import React, { Component } from 'react';
import Button from 'react-bootstrap/lib/Button';
import Modal from 'react-bootstrap/lib/Modal';
import Popover from 'react-bootstrap/lib/Popover';
import Tooltip from 'react-bootstrap/lib/Tooltip';
import OverlayTrigger from 'react-bootstrap/lib/OverlayTrigger';
import BoxDecrypt from '../box-decrypt/index.jsx';
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
		return (
			<div>
				<Button bsStyle="primary" onClick={this.open.bind(this)} >{ this.props.options.language.modal.buttonLauncher }</Button>
				<Modal show={this.state.showModal} onHide={this.close.bind(this)}>
          <Modal.Header className="box-encrypt-header" closeButton>
            <Modal.Title className="box-encrypt-header-text">{this.props.options.language.modal.header}</Modal.Title>
          </Modal.Header>
          <Modal.Body>
          	<BoxDecrypt
							publicKey1={this.props.options.publicKeys.key1}
							publicKey2={this.props.options.publicKeys.key2}
              publicKeysURL={this.props.options.publicKeys.urlGetNames}
              publicKeysURLBase={this.props.options.publicKeys.urlCompleteNames}
							language={this.props.options.language}
						/>
          </Modal.Body>
        </Modal>				
			</div>
		);
	}
}

module.exports = ModalEncrypt;