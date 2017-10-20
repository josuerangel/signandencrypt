import React from 'react';
import ReactDOM from 'react-dom';
import BoxEncrypt from './components/box-encrypt/index.jsx';
import BoxDecrypt from './components/box-decrypt/index.jsx';

const _keys = {
	public: {
		key1 : 'http://localhost:8080/apps2012/filesPublication/QApgp1.gpg',
		key2 : 'http://localhost:8080/apps2012/filesPublication/QApgp2.gpg'
	}
};

ReactDOM.render(<BoxEncrypt publicKey1={_keys.public.key1} publicKey2={_keys.public.key2} />, 
	document.getElementById('boxencrypt'));
ReactDOM.render(<BoxDecrypt publicKey1={_keys.public.key1} publicKey2={_keys.public.key2} />, 
	document.getElementById('boxdecrypt'));
