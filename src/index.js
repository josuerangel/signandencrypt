import React from 'react';
import ReactDOM from 'react-dom';
// import BoxTest from './components/box-test/index.jsx';
import BoxEncrypt from './components/box-encrypt/index.jsx';
// import BoxDecrypt from './components/box-decrypt/index.jsx';
import ModalEncrypt from './components/modal-encrypt/index.jsx';
import ModalDecrypt from './components/modal-decrypt/index.jsx';
// import EncryptButtons from './components/encrypt-buttons/index.jsx';

const _sp = {
  language: 'sp',
  publicKey: {
    running: 'Cargando llaves publicas . . .  ',
    success: 'Llaves publicas cargadas correctamente',
    error: 'Ocurrió un error al cargar las llaves públicas',
  }, 
  fileToEncrypt: {
    label: 'Archivo a firmar y encriptar',
    help: 'Extensiones no permitidas: pages, exe, xml, flv, mp3, mp4, avi y wma',
    running: 'Validando archivo . . . ',
    success: 'Archivo válido para encriptación',
    error: 'Ocurrió un error al leer el archivo a encriptar :: ',
    invalidExtension: ['Archivo {originalName} no permitido', 'Extensiones no permitidas: {blockedExtensions}'],
    invalidSize: 'El archivo {originalName} supera el tamaño límite de {sizeMax} MB'
  },
  cert: {
    label: 'Certificado digital (Archivo .cer de FIEL)',
    help: 'Archivo con extensión .cer',
    running: 'Validando archivo .cer . . . ',
    success: 'Certificado válido',
    error: 'Ocurrió un error al validar el certificado',
    invalidExtension: ['Certificado no válido', 'Extensiones permitidas: .cer'],
    notValid: 'Certificado no vigente',
    invalidSession: 'Imposible validar certificado, la sesión ha expirado',
    invalidDates: 'Certificado no vigente',
  },
  passPhrase: {
    label: 'Clave de acceso (Contraseña FIEL)',
    placeholder: '',
    help: 'Clave de acceso del archivo FIEL',
    success: 'Contraseña válida',
    error: 'Contraseña incorrecta',
  },
  key : {
    label: 'Llave privada (Archivo .key de FIEL)',
    help: 'Archivo con extensión .key',
    running: 'Validando archivo .key . . .',
    success: 'Llave válida',
    error: 'Ocurrió un error al validar la llave',
    notCurrent: 'Llave no vigente',
    invalidExtension: ['Llave no válida', 'Extensiones permitidas: .key'],
    notMatchKeyWithCert: 'Llave incorrecta',
    invalidPassphrase: 'Clave de acceso incorrecta, favor de revisar la contraseña FIEL',
  },
  buttonEncrypt: {
    label: 'Encriptar',
  },
  buttonSignEncrypt: {
    label: 'Firmar y Encriptar',
  },
  buttonProcess: {
    labelEncrypt: 'Encriptando . . .',
    labelSignEncrypt: 'Firmando y encriptando . . .',
    labelDecrypt: 'Desencriptando . . . ',
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
    help: 'Extensiones permitidas: CFE y CFEI',
    validateExtensions: 'Tipo de extensión inválida, extensiones no permitidas: ',
    invalidExtension: ['Archivo {originalName} no permitido', 'Extensiones permitidas: CFE y CFEI'],
    running: 'Validando archivo . . . ',
    success: 'Archivo validado para desencriptación',
    error: 'Ocurrió un error al leer el archivo para desencriptar',
  },
  buttonDecrypt: {
    label: 'Desencriptar'
  },
  passPhraseKey1: {
    label: 'Clave de acceso (Clave PGP 1)',
    placeholder: '',
    help: 'Clave de acceso del archivo PGP 1',
    success: 'Contraseña válida',
    error: 'Contraseña incorrecta',
  },  
  passPhraseKey2: {
    label: 'Clave de acceso (Clave PGP 2)',
    placeholder: '',
    help: 'Clave de acceso del archivo PGP 2',
    success: 'Contraseña válida',
    error: 'Contraseña incorrecta',
  },  
  privateKey1: {
    label: 'Llave privada (Clave PGP 1)',
    help: 'Archivo con extensión .gpg',
    running: 'Validando archivo .gpg . . . ',
    success: 'Llave privada válida',
    error: 'Ocurrió un error validando archivo .gpg',
    invalidExtension: ['Llave no válida', 'Extensiones permitidas: .gpg'],
    invalidPassphrase: 'Clave de acceso (Clave PGP 1) incorrecta, favor de revisar la contraseña',
    invalidForDecrypt: ['La Llave privada (Clave PGP 1) es incompatible para la desencriptación'],
  },
  privateKey2: {
    label: 'Llave privada (Clave PGP 2)',
    help: 'Archivo con extensión .gpg',
    running: 'Validando archivo .gpg . . . ',
    success: 'Llave privada válida',
    error: 'Ocurrió un error validando archivo .gpg',
    invalidExtension: ['Llave no válida', 'Extensiones permitidas: .gpg'],
    invalidPassphrase: 'Clave de acceso (Clave PGP 2) incorrecta, favor de revisar la contraseña',
    invalidForDecrypt: ['La llave privada (Clave PGP 2) es incompatible para la desencriptación'],
  },
  modal: {
    buttonLauncher: 'Firmar Propuesta Nacional',
    header : 'Firmar Propuesta Nacional',
    buttonClose: 'Cerrar',
    footerMessage: 'Para obtener asistencia técnica comuniquese al télefono',
    footerMessageNumber: '+ 52 (55) 5000 4200',
  }
};

const _en = {
  language: 'en',
  publicKey: {
    running: 'Loading public keys. . . ',
    success: 'Public keys loaded correctly',
    error: 'An error occurred while loading the public keys',
  },
  fileToEncrypt: {
    label: 'File to sign and encrypt',
    help: 'Extensions not allowed: pages, exe, xml, flv, mp3, mp4, avi and wma',
    running: 'Validating file . . . ',
    success: 'File valid for encryption',
    error: 'An error occurred while reading the file to be encrypted ::',
    invalidExtension: ['File {originalName} not allowed', 'Extensions not allowed: {blockedExtensions}'],
    invalidSize: 'The file {originalName} exceeds the size limit of {sizeMax} MB'
  },
  cert: {
    label: 'Digital certificate (FIEL .cer file)',
    help: 'File with extension .cer',
    running: 'Validating .cer file . . . ',
    success: 'Valid certificate',
    error: 'An error occurred while validating the certificate',
    invalidExtension: ['Invalid certificate', 'Allowed extensions: .cer'],
    notValid: 'Certificate not valid',
    invalidSession: 'Unable to validate certificate, the session has expired',
    invalidDates: 'Certificate not valid',
    },
  passPhrase: {
    label: 'Password (FIEL Password)',
    placeholder: '',
    help: 'FIEL file access password',
    success: 'Valid password',
    error: 'Incorrect password',
  },
  key: {
    label: 'Private key (FILE .key file)',
    help: 'File with extension .key',
    running: 'Validating .key file . . . ',
    success: 'Valid key',
    error: 'An error occurred when validating the key',
    notCurrent: 'Key not valid',
    invalidExtension: ['Invalid key', 'Allowed extensions: .key'],
    notMatchKeyWithCert: 'Wrong key',
    invalidPassphrase: 'Incorrect password, please check the FIEL password',
  },
  buttonEncrypt: {
    label: 'Encrypt',
  },
  buttonSignEncrypt: {
    label: 'Sign and Encrypt',
  },
  buttonProcess: {
    labelEncrypt: 'Encrypting . . . ',
    labelSignEncrypt: 'Signing and encrypting . . . ',
    labelDecrypt: 'Decrypt . . . ',
  },
  encrypt: {
    running: 'Encrypting file ...',
    success: 'Encryption process executed correctly',
    error: 'An error occurred in the encryption process'
  },
  sign: {
    running: 'Signing file . . .',
    success: 'Signed process executed correctly',
    error: 'An error occurred in the signing process'
  },
  process: {
    label: 'Process:',
    running: 'Running process . . .',
    success: 'The process was executed correctly',
    error: 'An error was found during the process'
  },
  fileToDecrypt: {
    label: 'File to decrypt',
    help: 'Allowed extensions: CFE and CFEI',
    validateExtensions: 'Invalid extension type, extensions not allowed:',
    invalidExtension: ['File {originalName} not allowed', 'Allowed extensions: CFE and CFEI'],
    running: 'Validating file . . . ',
    success: 'File validated for decryption',
    error: 'An error occurred while reading the file to decrypt',
  },
  buttonDecrypt: {
    label: 'Decrypt'
  },
  passPhraseKey1: {
    label: 'Password (PGP 1 key)',
    placeholder: '',
    help: 'PGP 1 file password',
    success: 'Valid password',
    error: 'Invalid password',
  },
  passPhraseKey2: {
    label: 'Password (PGP 2 key)',
    placeholder: '',
    help: 'PGP 2 file access password',
    success: 'Valid password',
    error: 'Invalid password',
  },
  privateKey1: {
    label: 'Private key (Key PGP 1)',
    help: 'File with extension .gpg',
    running: 'Validating .gpg file . . . ',
    success: 'Valid private key',
    error: 'An error occurred validating .gpg file',
    invalidExtension: ['Invalid key', 'Allowed extensions: .gpg'],
    invalidPassphrase: 'Incorrect password (Password PGP 1), please check the password',
    invalidForDecrypt: ['The private key (PGP 1 key) is incompatible for decryption'],
  },
  privateKey2: {
    label: 'Private key (PGP 2 key)',
    help: 'File with extension .gpg',
    running: 'Validating .gpg file . . . ',
    success: 'Valid private key',
    error: 'An error occurred validating .gpg file',
    invalidExtension: ['Invalid key', 'Allowed extensions: .gpg'],
    invalidPassphrase: 'Incorrect password (Password PGP 2), please check the password',
    invalidForDecrypt: ['The private key (PGP 2 key) is incompatible for decryption'],
  },
  modal: {
    buttonLauncher: 'Sign National Proposal',
    header: 'Sign National Proposal',
    buttonClose: 'Close',
    footerMessage: 'For technical assistance, contact the telephone',
    footerMessageNumber: '+ 52 (55) 5000 4200',
  },
};

const options = {
	publicKeys: {
		key1 : 'http://localhost:8080/apps2012/vendors/sindejs/QApgp1.gpg',
		key2 : 'http://localhost:8080/apps2012/vendors/sindejs/QApgp2.gpg',
    urlGetNames: 'http://localhost:8080/apps2012/filter/SvtFIEL?option=getPublicKeysNames',
    urlCompleteNames: 'http://localhost:8080/apps2012/vendors/sindejs/'
	},
	language: _sp,
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
      OSCPUrl: 'http://localhost:8080/apps2012/filter/SvtFIEL?option=validateCert',
		}
	},
	blockedExtensions: ['pages','exe','xml','flv','mp3','mp4','avi','wma', 'mov'],
	maxSize: 40,
  validateSessionUrl: 'http://localhost:8080/apps2012/filter/SvtFIEL?option=validateSession',
};

// ReactDOM.render(<EncryptButtons options={options} />, document.getElementById('modalEncrypt'));

ReactDOM.render(<ModalEncrypt options={options} />, document.getElementById('modalEncrypt'));

ReactDOM.render(<ModalDecrypt options={options} />, document.getElementById('modalDecrypt'));

// ReactDOM.render(<BoxTest publicKey1={options.publicKeys.key1} publicKey2={options.publicKeys.key2} />,
// 	document.getElementById('boxtest'));

// ReactDOM.render(
// 	<BoxEncrypt
// 		fiel={options.fiel.show}
// 		CA={options.fiel.certificate.CA}
//     OSCPUrl={options.fiel.certificate.OSCPUrl}
// 		publicKey1={options.publicKeys.key1}
// 		publicKey2={options.publicKeys.key2}
// 		blockedExtensions={options.blockedExtensions}
// 		language={options.language}
// 		maxSize={options.maxSize}
// 	/>,
// 	document.getElementById('boxencrypt')
// 	);

// ReactDOM.render(<BoxDecrypt language={options.language} publicKey1={options.publicKeys.key1} publicKey2={options.publicKeys.key2} />,
// 	document.getElementById('boxdecrypt'));
