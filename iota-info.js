const { SingleNodeClient, Converter } = require('@iota/iota.js');
const TRAN = require('transliteration');

module.exports = function(RED) {
    function iotainfo(config) {
        RED.nodes.createNode(this,config);
        var node = this;
        node._sec = 2;
	      node._firstroot = '';
        var iota_value = '';
        this.iotaNode = RED.nodes.getNode(config.iotaNode);

        const client = new SingleNodeClient(this.iotaNode.host + ":" + this.iotaNode.port);
        node.readyIota = true;


        node.on('input', function(msg) {
            async function success(callback) {
              console.log("Done: ", callback);
              msg.payload=callback;
              self.send(msg);
              //return callback;
            }
            async function error(callback) {
              console.log("Fail: ", callback);
              console.error(callback);
              msg.payload=callback;
              self.send(msg);
              //return callback;
            }

            async function run_messageId(messageID) {
                  callback = await client.message(messageID).then(success,error);
                  msg.payload=callback;
                  msg.payload.payload.index = Converter.hexToUtf8(callback.payload.index);
                  msg.payload.payload.data = Converter.hexToUtf8(callback.payload.data);
                  self.send(msg);
                  //return callback;
          }


            if (this.readyIota) {
              console.log("Searching dataset...")
              this.readyIota = false;
              var self = this;
              this.status({fill:"red",shape:"ring",text:"connecting"});
              iota_value = config.iotaValue;

              var objeto;
              switch (config.iotaSelect){
                case 'info':
                  client.info().then(success,error);
                  break;
                case 'tips':
                  client.tips().then(success,error);
                  break;
                case 'messageID':
                  //iota_value = msg.payload;
                  messageID = iota_value;
                  //client.message(messageID).then(success,error);
                  run_messageId(messageID)
                  break;
                case 'messageSubmit':
                      //  objeto = {approvees:[iota_value]};
                        break;
                }
                //console.log(objeto);

                this.status({});
		            self.readyIota = true;
            }
        });
    }
    RED.nodes.registerType("iotainfo",iotainfo);
}
