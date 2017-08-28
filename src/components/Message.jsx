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
      let message = { data: '', type : '' };
      const reader = new FileReader();
      const openpgp = require('openpgp');

      // ascii message
      reader.onload = event => {
        let data = event.target.result;
        try{
          message.data = openpgp.message.readArmored(data);
          message.type = 'ascii';
          resolve(message);
        }
        catch(e){
          // binary message
          reader.onload = event => {
            data = event.target.result;
            try {
              const bytes = new Uint8Array(data);
              message.data = openpgp.message.read(bytes);
              message.type = 'binary';
              resolve(message);
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
