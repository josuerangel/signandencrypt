import React, { Component } from 'react';
import ModalEncrypt from '../modal-encrypt/index.jsx';
import deepcopy from 'deepcopy';

export class EncryptButtons extends Component {
	constructor(props){
		super(props);
		this.optNational = deepcopy(this.props.options);
		this.optInternational = deepcopy(this.props.options);
	}

	componentDidMount() {
		this.optInternational.fiel.show = false;
		this.optInternational.language.modal.buttonLauncher = 'Firmar Propuestas Internacionales';
	}

	render() {
		const _style = {
			display: 'inline-block',
		}
		return (	
			<div>
				<ModalEncrypt key="modalN" options={ this.optNational } />
				<ModalEncrypt key="modalI" options={ this.optInternational } />
			</div>
		);
	}
}

module.exports = EncryptButtons;