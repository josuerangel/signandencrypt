import React from 'react';
import ReactDOM from 'react-dom';
// import BoxTest from './components/box-test/index.jsx';
import BoxEncrypt from './components/box-encrypt/index.jsx';
// import BoxDecrypt from './components/box-decrypt/index.jsx';
import ModalEncrypt from './components/modal-encrypt/index.jsx';
// import ModalDecrypt from './components/modal-decrypt/index.jsx';
// import EncryptButtons from './components/encrypt-buttons/index.jsx';

const _sp = {
  fileToEncrypt: {
    label: 'Archivo a encriptar',
    help: 'Recuerde que las extensiones deben ser validas, ejemplo: PDF, DOCX, XLSX, etc...',
    validateExtensions: 'Tipo de extensión inválida, extensiones no permitidas: ',
    validateMaxSize: 'El archivo NombreDelArchivo.extensión supera el tamaño límite de ',
    readRunning: 'Leyendo y convirtiendo archivo ... ',
    valid: 'Archivo valido para encriptación.',
    error: 'Ocurrió un error al leer el archivo a encriptar :: ',
  },
  inputFile: {
    label: 'Archivo a encriptar',
    help: 'Recuerde que las extensiones deben ser validas, ejemplo: PDF, DOCX, XLSX, etc...',
    running: 'Leyendo y convirtiendo archivo ... ',
    success: 'Archivo valido para encriptación.',
    error: 'Ocurrió un error al leer el archivo a encriptar :: ',
  },      
  cert: {
    label: 'Certificado FIEL',
    help: 'Archivo con extensión .cert',
    running: 'Leyendo, convirtiendo y validando certificado ... ',
    success: 'Certificado valido.',
    error: 'Ocurrió un error al leer el certificado.',
  },
  passPhrase: {
    label: 'Contraseña para llave FIEL',
    placeholder: 'Ingresar contraseña FIEL',
    help: 'Debe capturar la contraseña para habilidar la selección del archivo de la llave.'
  },
  key : {
    label: 'Llave FIEL',
    help: 'Seleccionar el archivo .key proporcionado por SAT',
    running: 'Leyendo y desencriptando llave FIEL ...',
    success: 'Llave desencriptada correctamente.',
    error: 'Ocurrió un error al desencriptar la llave, favor de validar la constraseña de la llave FIEL.',
  },
  buttonEncrypt: {
    label: 'Encriptar',
  },
  encrypt: {
    running: 'Encriptando archivo ... ',
    success: 'Proceso de encriptación ejecutado correctamente.',
    error: 'Ocurrió un error en el proceso de encriptación.'
  },
  sign: {
    running: 'Firmando archivo ... ',
    success: 'Proceso de firmado ejecutado correctamente.',
    error: 'Ocurrió un errro en el proceso de firmado.'
  },
  process: {
    label: 'Proceso:',
    running: 'Ejecutando proceso ... ',
    success: 'Se ejecuto correctamente el proceso.',
    error: 'Se encontro un error durante el proceso.'
  },
  fileToDecrypt: {
    label: 'Archivo a desencriptar',
    help: 'Recuerde que las extensiones validas son: .CFE y .CFEI',
    validateExtensions: 'Tipo de extensión inválida, extensiones no permitidas: ',
    running: 'Leyendo y convirtiendo archivo ... ',
    success: 'Archivo valido para desencriptar.',
    error: 'Ocurrió un error al leer el archivo para desencriptar :: ',        
  },
  buttonDecrypt: {
    label: 'Desencriptar'
  },
  passPhraseDecrypt: {
    label: 'Contraseña para la llave privada',
    placeholder: 'Ingrese contraseña para la llave privada',
    help: 'Debe capturar la contraseña para habilidar la selección del archivo de la llave privada',
  },
  privateKey1: {
    label: 'Llave privada GPG 1',
    help: 'Seleccionar el archivo .gpg de su llave privada.',
    running: 'Leyendo y desencriptando llave GPG ...',
    success: 'Llave desencriptada correctamente.',
    error: 'Ocurrió un error al desencriptar la llave, favor de validar la constraseña de la llave privada',        
  },      
  privateKey2: {
    label: 'Llave privada GPG 2',
    help: 'Seleccionar el archivo .gpg de su llave privada.',
    running: 'Leyendo y desencriptando llave GPG ...',
    success: 'Llave desencriptada correctamente.',
    error: 'Ocurrió un error al desencriptar la llave, favor de validar la constraseña de la llave privada',        
  },
  modal: {
  	buttonLauncher: 'Firmar propuestas nacionales',
  	header : 'Firmar propuestas',
  	buttonClose: 'Cerrar',
  }
};

const _en = {
  fileToEncrypt: {
    label: 'Archivo a encriptar',
    help: 'Recuerde que las extensiones deben ser validas, ejemplo: PDF, DOCX, XLSX, etc...',
    validateExtensions: 'Tipo de extensión inválida, extensiones no permitidas: ',
    validateMaxSize: 'El archivo NombreDelArchivo.extensión supera el tamaño límite de ',
    readRunning: 'Leyendo y convirtiendo archivo ... ',
    valid: 'Archivo valido para encriptación.',
    error: 'Ocurrió un error al leer el archivo a encriptar :: ',
  },
  inputFile: {
    label: 'Archivo a encriptar',
    help: 'Recuerde que las extensiones deben ser validas, ejemplo: PDF, DOCX, XLSX, etc...',
    running: 'Leyendo y convirtiendo archivo ... ',
    success: 'Archivo valido para encriptación.',
    error: 'Ocurrió un error al leer el archivo a encriptar :: ',
  },      
  cert: {
    label: 'Certificado FIEL',
    help: 'Archivo con extensión .cert',
    running: 'Leyendo, convirtiendo y validando certificado ... ',
    success: 'Certificado valido.',
    error: 'Ocurrió un error al leer el certificado.',
  },
  passPhrase: {
    label: 'Contraseña para llave FIEL',
    placeholder: 'Ingresar contraseña FIEL',
    help: 'Debe capturar la contraseña para habilidar la selección del archivo de la llave.'
  },
  key : {
    label: 'Llave FIEL',
    help: 'Seleccionar el archivo .key proporcionado por SAT',
    running: 'Leyendo y desencriptando llave FIEL ...',
    success: 'Llave desencriptada correctamente.',
    error: 'Ocurrió un error al desencriptar la llave, favor de validar la constraseña de la llave FIEL.',
  },
  buttonEncrypt: {
    label: 'Encriptar',
  },
  encrypt: {
    running: 'Encriptando archivo ... ',
    success: 'Proceso de encriptación ejecutado correctamente.',
    error: 'Ocurrió un error en el proceso de encriptación.'
  },
  sign: {
    running: 'Firmando archivo ... ',
    success: 'Proceso de firmado ejecutado correctamente.',
    error: 'Ocurrió un errro en el proceso de firmado.'
  },
  process: {
    label: 'Proceso:',
    running: 'Ejecutando proceso ... ',
    success: 'Se ejecuto correctamente el proceso.',
    error: 'Se encontro un error durante el proceso.'
  },
  fileToDecrypt: {
    label: 'Archivo a desencriptar',
    help: 'Recuerde que las extensiones validas son: .CFE y .CFEI',
    validateExtensions: 'Tipo de extensión inválida, extensiones no permitidas: ',
    running: 'Leyendo y convirtiendo archivo ... ',
    success: 'Archivo valido para desencriptar.',
    error: 'Ocurrió un error al leer el archivo para desencriptar :: ',        
  },
  buttonDecrypt: {
    label: 'Desencriptar'
  },
  passPhraseDecrypt: {
    label: 'Contraseña para la llave privada',
    placeholder: 'Ingrese contraseña para la llave privada',
    help: 'Debe capturar la contraseña para habilidar la selección del archivo de la llave privada',
  },
  privateKey1: {
    label: 'Llave privada GPG 1',
    help: 'Seleccionar el archivo .gpg de su llave privada.',
    running: 'Leyendo y desencriptando llave GPG ...',
    success: 'Llave desencriptada correctamente.',
    error: 'Ocurrió un error al desencriptar la llave, favor de validar la constraseña de la llave privada',        
  },      
  privateKey2: {
    label: 'Llave privada GPG 2',
    help: 'Seleccionar el archivo .gpg de su llave privada.',
    running: 'Leyendo y desencriptando llave GPG ...',
    success: 'Llave desencriptada correctamente.',
    error: 'Ocurrió un error al desencriptar la llave, favor de validar la constraseña de la llave privada',        
  },
  modal: {
  	buttonLauncher: 'Firmar propuestas nacionales',
  	header : 'Firmar propuestas',
  	buttonClose: 'Cerrar',
  }     
};

const options = {
	publicKeys: {
		key1 : 'http://localhost:8080/apps2012/vendors/sindejs/QApgp1.gpg',
		key2 : 'http://localhost:8080/apps2012/vendors/sindejs/QApgp2.gpg'
	},
	language: _sp,
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
      OSCPUrl: 'http://localhost:8080/apps2012/filter/SvtFIEL?option=validateCert',
		}
	},
	blockedExtensions: ['pages','exe','xml','flv','mp3','mp4','avi','wma', 'mov'],
	maxSize: 40,
};

// ReactDOM.render(<EncryptButtons options={options} />, document.getElementById('modalEncrypt'));

ReactDOM.render(<ModalEncrypt options={options} />, document.getElementById('modalEncrypt'));

// ReactDOM.render(<ModalDecrypt options={options} />, document.getElementById('modalDecrypt'));

// ReactDOM.render(<BoxTest publicKey1={options.publicKeys.key1} publicKey2={options.publicKeys.key2} />,
// 	document.getElementById('boxtest'));

ReactDOM.render(
	<BoxEncrypt
		fiel={options.fiel.show}
		CA={options.fiel.certificate.CA}
    OSCPUrl={options.fiel.certificate.OSCPUrl}
		publicKey1={options.publicKeys.key1}
		publicKey2={options.publicKeys.key2}
		blockedExtensions={options.blockedExtensions}
		language={options.language}
		maxSize={options.maxSize}
	/>,
	document.getElementById('boxencrypt')
	);

// ReactDOM.render(<BoxDecrypt language={options.language} publicKey1={options.publicKeys.key1} publicKey2={options.publicKeys.key2} />,
// 	document.getElementById('boxdecrypt'));
