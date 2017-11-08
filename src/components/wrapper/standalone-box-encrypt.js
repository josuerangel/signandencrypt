import React from 'react'
// import 'babel-polyfill';
import BoxEncrypt from '../box-encrypt/index.jsx';

/**
 * Options example, boxencrypt need the next structure
 */
/*
const options = {
	publicKeys: {
		key1 : 'http://localhost:8080/apps2012/vendors/sindejs/QApgp1.gpg',
		key2 : 'http://localhost:8080/apps2012/vendors/sindejs/QApgp2.gpg'
	},
	language: 'sp',
	fiel: {
		show: true,
		certificate: {
			CA: [
				'http://localhost:8080/apps2012/vendors/sindejs/AC0_SAT.cer',
				'http://localhost:8080/apps2012/vendors/sindejs/AC1_SAT.cer',
				'http://localhost:8080/apps2012/vendors/sindejs/AC2_SAT.cer',
				'http://localhost:8080/apps2012/vendors/sindejs/AC3_SAT.cer',
				'http://localhost:8080/apps2012/vendors/sindejs/AC4_SAT.cer',
			],
		}
	},
	blockedExtensions: ['pages','exe','xml','flv','mp3','mp4','avi','wma'],
	maxSize: 40,
};
*/

function renderBoxEncrypt(options, container, callback){
  let _box = null;
  ReactDOM.render(
	<BoxEncrypt
		fiel={options.fiel.show}
		CA={options.fiel.certificate.CA}
		publicKey1={options.publicKeys.key1}
		publicKey2={options.publicKeys.key2}
		blockedExtensions={options.blockedExtensions}
		language={options.language}
		maxSize={options.maxSize}
		ref={ _b => { _box = _b; }}		
	/>, container, callback );
  return _box;
}

module.exports = renderBoxEncrypt;
window.renderBoxEncrypt = renderBoxEncrypt;