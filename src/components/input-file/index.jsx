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

	handleLoadFile(event){
		console.log('InputFile handleLoadFile event', event);		
		event.preventDefault();

		this.setState({
      running: true,
      help: this.props.lng.running,
      validation: 'warning',
		});

		if (typeof this.props.process == 'function') {
			console.log('InputFile handleLoadFile process');
			const _promise = this.props.process(event.target.files[0]);
		}
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
};

InputFile.propType = {
	lng : PropTypes.object.isRequired,
	enabled: PropTypes.bool,
	process: PropTypes.func,
};

module.exports = InputFile;