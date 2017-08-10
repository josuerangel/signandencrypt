let i = 0;
let c = 0;
const base_64 = {
 chars: 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/',

 encode: function(data) {
     var output = '';
     for (i=0, c=data.length; i<c; i += 3)
     {
         var char1 = data.charCodeAt(i) >> 2;
         var char2 = ((data.charCodeAt(i) & 3) << 4) | data.charCodeAt(i+1) >> 4;
         var char3 = ((data.charCodeAt(i+1) & 15) << 2) | data.charCodeAt(i+2) >> 6;
         var char4 = data.charCodeAt(i+2) & 63;

         output 	+= 	this.chars.charAt(char1)
                     + 	this.chars.charAt(char2)
                     +	this.chars.charAt(char3)
                     +	this.chars.charAt(char4);
     }
     if (c % 3 == 1)
         output = output.substr(0, output.length - 2) + '==';
     else if (c % 3 == 2)
         output = output.substr(0, output.length - 1) + '=';

     return output;
 },

 decode: function(str) {
     var data = '';

     for (i=0, c=str.length; i<c; i += 4)
     {
         var char1 = this.chars.indexOf(str.charAt(i));
         var char2 = this.chars.indexOf(str.charAt(i+1));
         var char3 = this.chars.indexOf(str.charAt(i+2));
         var char4 = this.chars.indexOf(str.charAt(i+3));

         data += String.fromCharCode(char1 << 2 | char2 >> 4);
         if (char3 != -1)
             data += String.fromCharCode((char2 & 15) << 4 | char3 >> 2)
         if (char4 != -1)
             data += String.fromCharCode((char3 & 3) << 6 | char4);
     }
     return data;
 }
};

export default {
  encode: base_64.encode,
  decode: base_64.decode
}
