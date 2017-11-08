import React from 'react'
import ModalEncrypt from '../modal-encrypt/index.jsx';

function renderModalEncrypt(options, container, callback){
  let modal = null;
  ReactDOM.render(<ModalEncrypt options={options} ref={ _modal => { modal = _modal; }} />, container, callback);
  return modal;
}

module.exports = renderModalEncrypt;
window.renderModalEncrypt = renderModalEncrypt;