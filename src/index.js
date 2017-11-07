import React from 'react';
import ReactDOM from 'react-dom';
import BoxTest from './components/box-test/index.jsx';
import BoxEncrypt from './components/box-encrypt/index.jsx';
import BoxDecrypt from './components/box-decrypt/index.jsx';

const options = {
	publicKeys: {
		key1 : 'http://localhost:8080/apps2012/vendors/sindejs/QApgp1.gpg',
		key2 : 'http://localhost:8080/apps2012/vendors/sindejs/QApgp2.gpg'
		// key2: 'http://localhost:8080/apps2012/filter/SvtFIEL?option=getPublicKey&url=http://common.rmmi.com/files/cfe/QApgp2.gpg'
	},
	language: 'sp',
	fiel: {
		show: false,
		certificate: {
			CA: [
				'http://localhost:8080/apps2012/vendors/sindejs/AC0_SAT.cer',
				'http://localhost:8080/apps2012/vendors/sindejs/AC1_SAT.cer',
				'http://localhost:8080/apps2012/vendors/sindejs/AC2_SAT.cer',
				'http://localhost:8080/apps2012/vendors/sindejs/AC3_SAT.cer',
				'http://localhost:8080/apps2012/vendors/sindejs/AC4_SAT.cer',
			],
			OSCP: [],
		}
	},
	blockedExtensions: ['pages','exe','xml','flv','mp3','mp4','avi','wma'],
	maxSize: 40,
};

// ReactDOM.render(<BoxTest publicKey1={options.publicKeys.key1} publicKey2={options.publicKeys.key2} />, 
// 	document.getElementById('boxtest'));
ReactDOM.render(
	<BoxEncrypt 
		fiel={options.fiel.show}
		CA={options.fiel.certificate.CA}
		OSCP={options.fiel.OSCP} 
		publicKey1={options.publicKeys.key1} 
		publicKey2={options.publicKeys.key2} 
		blockedExtensions={options.blockedExtensions}
		language={options.language}
		maxSize={options.maxSize}
	/>, 
	document.getElementById('boxencrypt')
	);
ReactDOM.render(<BoxDecrypt publicKey1={options.publicKeys.key1} publicKey2={options.publicKeys.key2} />, 
	document.getElementById('boxdecrypt'));
