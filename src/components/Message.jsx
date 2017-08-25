export default class Message {
  constructor(parameters = {}){
    /**
     * @file {File}
     * @description file for parse to decrypt
     */
     this.file = parameters.file;
  }

  /**
   * @param {(File)} file for parse to decrypt
   * @returns {Promise} Promise return openpgp message parsed
   */
  static readFile(file){
    return new Promise((resolve, reject) => {
      let message;
      const reader = new FileReader();
      const openpgp = require('openpgp');

      // ascii message
      reader.onload = (event) => {
        let data = event.target.result;
        try{
          resolve(openpgp.message.readArmored(data));
          //message = this.openpgp.message.readArmored(data);
          //resolve('loaded armored file for decrypt');
        }
        catch(e){
          // binary message
          reader.onload = (event) => {
            data = event.target.result;
            try {
              const bytes = new Uint8Array(data);
              //this.messageForDecrypt = this.openpgp.message.read(bytes);
              //resolve('loaded binary file for decrypt');
              resolve(openpgp.message.read(bytes));
            }
            catch (e) {
              reject(Error('File for decrypt is not valid: ' + e));
            }
          };
          reader.readAsArrayBuffer(file);
        }
      };
      reader.readAsText(file);
    });
  }
}
