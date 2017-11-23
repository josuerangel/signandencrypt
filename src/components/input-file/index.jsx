import React from 'react';
import PropTypes from 'prop-types';
import Loader from 'halogen/RingLoader';
import FormGroup from 'react-bootstrap/lib/FormGroup';
import ControlLabel from 'react-bootstrap/lib/ControlLabel';
import FormControl from 'react-bootstrap/lib/FormControl';
import HelpBlock from 'react-bootstrap/lib/HelpBlock';
import Utils from '../../sindejs/utils.js';
import '../css/spinner.styl';
import format from 'string-template';

class InputFile extends React.Component {
	constructor(props){
		super(props);

		this.dataFile;

		this.state = {
			theInputKey: props.reset,
			validation: null,
			running: false,
			help: this.props.lng.help,
		}
	}

	componentWillReceiveProps(nextProps) {
		// console.log('componentWillReceiveProps nextProps: ', nextProps);
		// console.log('componentWillReceiveProps this.props: ', this.props);
		if (nextProps.reset !== this.props.reset){
			this.setState({ 
				theInputKey: nextProps.reset,
				validation: null,
				running: false,
				help: this.props.lng.help,
			});			
		}
	}

	handleChange(value){
		if (typeof this.props.valid === 'function'){
			this.props.valid(value);
		}

		if (typeof this.props.afterProcess === 'function')
			this.props.afterProcess(value);
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
		console.log('InputFile rejectEvent reject: ', reject);
		const _message = (reject.message === undefined) ? this.props.lng.error : reject.message;
		console.log('InputFile rejectEvent _message: ', _message);
		this.setState({
			theInputKey: Math.random().toString(36),
			running: false,
			help: _message,
			validation: 'error',
		}, this.handleChange(false));
	}

	launchBeforeProcess(file){
		if (typeof this.props.beforeProcess === 'function') {
			this.props.beforeProcess();
		}
	};

	handleLoadFile(event){
		console.log('InputFile handleLoadFile event', event);
		console.log('InputFile handleLoadFile event.target.value', event.target.value);
		this.inputFile = event;
		event.preventDefault();
		const file = event.target.files[0];

    if (this.props.accept != "*"){
	    const _dataFile = Utils.getOriginalDataFromName(file.name);
  	  console.log('InputFile handleLoadFile _dataFile: ', _dataFile);
  	  this.dataFile = _dataFile;
  	  console.log('InputFile handleLoadFile contains: ', this.props.accept.includes);
  	  const _ext = '.' + _dataFile.encryptExtension;
  	  console.log('InputFile handleLoadFile _ext: ', _ext);
  	  const validExtension = this.props.accept.split(',').map(ext => { return ext.trim() }).includes(_ext);
  	  console.log('InputFile handleLoadFile validExtension: ', validExtension);
  	  if (!validExtension){
  	  	this.rejectEvent({ message: this.props.lng.invalidExtension.map(msg => { return format(msg, _dataFile) }) });
  	  	return;
  	  }
    }

		this.setState({
      running: true,
      help: this.props.lng.running,
      validation: null,
		}, () => {
			this.launchBeforeProcess(file);
			setTimeout(() => {
				if (typeof this.props.process === 'function') {
					// const _ext = fileExtension(file.name);
					// console.log('handleLoadFile _ext: ', _ext);

					const _promise = this.props.process(file);
					console.log('InputFile callProcess process promise: ', _promise);

					if (_promise === undefined) {
						this.rejectEvent({ message: 'InputFile need a Promise for process function.' });
						return;
					}

					const isPromise = typeof _promise.then === 'function';
					if (!isPromise) {
						this.rejectEvent({ message: 'InputFile need a Promise for process function.' });
						return;
					}

					_promise.then(this.resolveEvent.bind(this), this.rejectEvent.bind(this));
				}
			}, 1500);
		});
	}

	render(){
    const _spinnerBlockHelp =
      <div className="spinnerContainer">
        <Loader color="#48A0DC" size="32px" margin="4px"/>
      </div>;

    const _control = (this.props.enabled)
    	? <FormControl key={ this.state.theInputKey || '' } type="file" accept={this.props.accept} onChange={ this.handleLoadFile.bind(this) } />
    	: <FormControl disabled key={ this.state.theInputKey || '' } type="file" accept={this.props.accept} onChange={ this.handleLoadFile.bind(this) } />;

    const _help = (this.state.help.map !== undefined)
    	? <ul>{ this.state.help.map( (message, index) => { return <li key={"helpMessage"+index}>{message}</li> }) } </ul>
    	: this.state.help;

		return (
      <FormGroup validationState={ this.state.validation }>
        <ControlLabel>{ this.props.lng.label }</ControlLabel>
        {_control}
        <FormControl.Feedback />
        <HelpBlock className="HelpBlockSpinner">
          <div className={ (this.state.running) ? "helpMessageSpinner" : "helpMessage" }>
            { _help }
          </div>
          { (this.state.running) ? _spinnerBlockHelp : null }
        </HelpBlock>
      </FormGroup>
		);
	}
}

InputFile.defaultProps = {
	accept: '*',
	enabled: true,
	beforeProcess: () => {},
	afterProcess: () => {},
	process: () => {},
	valid: () => {},
	reset: 'init',
};

InputFile.propType = {
	accept: PropTypes.string,
	lng : PropTypes.object.isRequired,
	enabled: PropTypes.bool,
	beforeProcess: PropTypes.func,
	afterProcess: PropTypes.func,
	process: PropTypes.func,
	valid: PropTypes.func,
	reset: PropTypes.string,
};

module.exports = InputFile;
