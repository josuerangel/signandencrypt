import React from 'react'
// import 'babel-polyfill';
import ModalDecrypt from '../modal-decrypt/index.jsx';

function renderModalDecrypt(options, container, callback){
  let modal = null;
  ReactDOM.render(<ModalDecrypt options={options} ref={ _modal => { modal = _modal; }} />, container, callback);
  return modal;
}

module.exports = renderModalDecrypt;
window.renderModalDecrypt = renderModalDecrypt;