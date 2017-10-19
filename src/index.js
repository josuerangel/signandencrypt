import React from 'react';
import ReactDOM from 'react-dom';
import Box from './components/box-encrypt/index.jsx';
import BoxDecrypt from './components/box-decrypt/index.jsx';

ReactDOM.render(<Box></Box>, document.getElementById('boxencrypt'));
ReactDOM.render(<BoxDecrypt></BoxDecrypt>, document.getElementById('boxdecrypt'));
