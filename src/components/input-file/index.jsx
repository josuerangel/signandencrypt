import React from 'react';
import PropTypes from 'prop-types';
import Loader from 'halogen/RingLoader';
import FormGroup from 'react-bootstrap/lib/FormGroup';
import ControlLabel from 'react-bootstrap/lib/ControlLabel';
import FormControl from 'react-bootstrap/lib/FormControl';
import HelpBlock from 'react-bootstrap/lib/HelpBlock';


class InputFile extends React.Component {
	constructor(props){
		super(props);

		this.state = {
			validation: null,
			running: false,
			help: this.props.lng.help
		}
	}

	handleChange(value){
		if (typeof this.props.valid == 'function'){
			this.props.valid(value);
		}
	}

	resolveEvent(resolve){
		console.log('InputFile resolveEvent resolve: ', resolve, this);
		this.setState({
			validation: 'success',
			running: false,
			help: this.props.lng.success,
		}, this.handleChange(true));
	}

	rejectEvent(reject){
		console.log('InputFile rejectEvent reject: ', reject, this);

		const _messageReject = (reject.message == undefined ) ? '' : reject.message;
		const _message = this.props.lng.error + '   ' + _messageReject
		this.setState({
			running: false,
			help: _message,
			validation: 'error',
		}, this.handleChange(false));
	}


	handleLoadFile(event){
		console.log('InputFile handleLoadFile event', event);		
		event.preventDefault();
		const file = event.target.files[0];

		this.setState({
      running: true,
      help: this.props.lng.running,
      validation: null,
		}, () => {
			if (typeof this.props.process == 'function') {
				const _promise = this.props.process(file);
				console.log('InputFile callProcess process promise: ', _promise);

				if (_promise == undefined) {
					this.rejectEvent({ message: 'InputFile need a Promise for process function.' });
					return;
				}

				const isPromise = typeof _promise.then == 'function';
				if (!isPromise) {
					this.rejectEvent({ message: 'InputFile need a Promise for process function.' });
					return;
				}
				
				_promise.then(this.resolveEvent.bind(this), this.rejectEvent.bind(this));
			}				
		});
	}

	render(){
    const _spinnerBlockHelp = 
      <div className="spinnerContainer">
        <Loader color="#48A0DC" size="32px" margin="4px"/>
      </div>;
      		
		return (
      <FormGroup validationState={ this.state.validation }>
        <ControlLabel>{ this.props.lng.label }</ControlLabel>
        <FormControl type="file" onChange={ this.handleLoadFile.bind(this) } />
        <FormControl.Feedback />
        <HelpBlock className="HelpBlockSpinner">
          <div className={ (this.state.running) ? "helpMessageSpinner" : "helpMessage" }>
            { this.state.help }
          </div>
          { (this.state.running) ? _spinnerBlockHelp : null }
        </HelpBlock>
      </FormGroup>
		);
	}
};

InputFile.defaultProps = {
	enabled: true,
	process: () => {},
	valid: () => {},
};

InputFile.propType = {
	lng : PropTypes.object.isRequired,
	enabled: PropTypes.bool,
	process: PropTypes.func,
	valid: PropTypes.func,
};

module.exports = InputFile;