import React from 'react';
import PropTypes from 'prop-types';
import Loader from 'halogen/RingLoader';
import FormGroup from 'react-bootstrap/lib/FormGroup';
import ControlLabel from 'react-bootstrap/lib/ControlLabel';
import FormControl from 'react-bootstrap/lib/FormControl';
import HelpBlock from 'react-bootstrap/lib/HelpBlock';
import '../css/spinner.styl';
// import '../css/input-file.styl';

class InputFile extends React.Component {
	constructor(props){
		super(props);

		this.state = {
			validation: null,
			running: false,
			help: this.props.lng.help,
			// label: 'Choose a file...',
		}
	}

	handleChange(value){
		if (typeof this.props.valid === 'function'){
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

		const _messageReject = (reject.message === undefined ) ? '' : reject.message;
		const _message = this.props.lng.error + '   ' + _messageReject;
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
      // label: file.name,
		}, () => {
			setTimeout(() => {
				if (typeof this.props.process === 'function') {
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
    	? <FormControl type="file" accept={this.props.accept} onChange={ this.handleLoadFile.bind(this) } />
    	: <FormControl disabled type="file" accept={this.props.accept} onChange={ this.handleLoadFile.bind(this) } />;

    // const _controlInput = (this.props.enabled)
    // 	? <input onChange={this.handleLoadFile.bind(this)} type="file" name="file-1[]" id="file-1" className="inputfile inputfile-2" data-multiple-caption="{count} files selected" multiple />
    // 	: <input disabled="disabled" onChange={this.handleLoadFile.bind(this)} type="file" name="file-1[]" id="file-1" className="inputfile inputfile-2" data-multiple-caption="{count} files selected" multiple />;
    // const _controlLabel = (this.props.enabled)
    // 	? <label htmlFor="file-1"><svg xmlns="http://www.w3.org/2000/svg" width="20" height="17" viewBox="0 0 20 17"><path d="M10 0l-5.2 4.9h3.3v5.1h3.8v-5.1h3.3l-5.2-4.9zm9.3 11.5l-3.2-2.1h-2l3.4 2.6h-3.5c-.1 0-.2.1-.2.1l-.8 2.3h-6l-.8-2.2c-.1-.1-.1-.2-.2-.2h-3.6l3.4-2.6h-2l-3.2 2.1c-.4.3-.7 1-.6 1.5l.6 3.1c.1.5.7.9 1.2.9h16.3c.6 0 1.1-.4 1.3-.9l.6-3.1c.1-.5-.2-1.2-.7-1.5z"/></svg> <span>{ this.state.label }</span></label>
    // 	: <label disabled="disabled" htmlFor="file-1"><svg xmlns="http://www.w3.org/2000/svg" width="20" height="17" viewBox="0 0 20 17"><path d="M10 0l-5.2 4.9h3.3v5.1h3.8v-5.1h3.3l-5.2-4.9zm9.3 11.5l-3.2-2.1h-2l3.4 2.6h-3.5c-.1 0-.2.1-.2.1l-.8 2.3h-6l-.8-2.2c-.1-.1-.1-.2-.2-.2h-3.6l3.4-2.6h-2l-3.2 2.1c-.4.3-.7 1-.6 1.5l.6 3.1c.1.5.7.9 1.2.9h16.3c.6 0 1.1-.4 1.3-.9l.6-3.1c.1-.5-.2-1.2-.7-1.5z"/></svg> <span>{ this.state.label }</span></label>

		return (
      <FormGroup validationState={ this.state.validation }>
        <ControlLabel>{ this.props.lng.label }</ControlLabel>
        {_control}
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
}

InputFile.defaultProps = {
	accept: '*',
	enabled: true,
	process: () => {},
	valid: () => {},
};

InputFile.propType = {
	accept: PropTypes.string,
	lng : PropTypes.object.isRequired,
	enabled: PropTypes.bool,
	process: PropTypes.func,
	valid: PropTypes.func,
};

module.exports = InputFile;
