import React from 'react'
// import 'babel-polyfill';
import BoxEncrypt from '../box-encrypt/index.jsx';

/**
 * Options example, boxencrypt need the next structure
 */
/*
const options = {
	publicKeys: {
		key1 : 'http://localhost:8080/apps2012/filesPublication/QApgp1.gpg',
		key2 : 'http://localhost:8080/apps2012/filesPublication/QApgp2.gpg'
	}
};
*/

function renderBoxEncrypt(options, container, callback){
  let _box = null;
  ReactDOM.render(<BoxEncrypt language={options.language} publicKey1={options.publicKeys.key1} publicKey2={options.publicKeys.key2} 
  	ref={(_bd => { _box = _bd; })} />, container, callback);
  return _box;
}

module.exports = renderBoxEncrypt;
window.renderBoxEncrypt = renderBoxEncrypt;