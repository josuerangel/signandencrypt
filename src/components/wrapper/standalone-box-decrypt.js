import React from 'react'
import BoxDecrypt from '../box-decrypt/index.jsx';

/**
 * Options example, boxencrypt need the next structure
 */
/*
const options = {
	publicKeys: {
		key1 : 'http://localhost:8080/apps2012/filesPublication/QApgp1.gpg',
		key2 : 'http://localhost:8080/apps2012/filesPublication/QApgp2.gpg'
	},
	language: 'sp'
};
*/

function renderBoxDecrypt(options, container, callback){
  let _box = null;
  ReactDOM.render(<BoxDecrypt language={options.language} publicKey1={options.publicKeys.key1} publicKey2={options.publicKeys.key2} 
  	ref={(_bd => { _box = _bd; })} />, container, callback);
  return _box;
}

module.exports = renderBoxDecrypt;
window.renderBoxDecrypt = renderBoxDecrypt;