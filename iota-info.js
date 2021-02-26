const iotajs = require('@iota/iota.js');
const convert = (from, to) => str => Buffer.from(str, from).toString(to);
const utf8ToHex = convert('utf8', 'hex');
const hexToUtf8 = convert('hex', 'utf8');
module.exports = function(RED) {
    function iotainfo(config) {
        RED.nodes.createNode(this,config);
        var node = this;
        node._sec = 2;
	      node._firstroot = '';
        var iota_value = '';
        this.iotaNode = RED.nodes.getNode(config.iotaNode);

        const client = new iotajs.SingleNodeClient(this.iotaNode.host + ":" + this.iotaNode.port);
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
                  msg.payload.payload.index = hexToUtf8(callback.payload.index);
                  msg.payload.payload.data = hexToUtf8(callback.payload.data);
                  self.send(msg);
                  //return callback;
          }


            if (this.readyIota) {
              console.log("Searching dataset...")
              this.readyIota = false;
              var self = this;
              this.status({fill:"red",shape:"ring",text:"connecting"});
              iota_value = config.iotaValue;

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
                  client.message(messageID).then(success,error);
                  //run_messageId(messageID);
                  break;
                case 'messageSubmit':
                  //iota_value = msg.payload;
                  messageTXT = iota_value;
                  const submitMessage = {
                        // Parents can be left undefined if you want the node to populate the field
                        //parentMessageIds: client.tips().tipMessageIds.slice(0, iota_js_1.MAX_NUMBER_PARENTS),
                        payload: {
                          type: iotajs.INDEXATION_PAYLOAD_TYPE,
                          index: iotajs.Converter.utf8ToHex("node-red-contrib-iota-Chrysalis"),
                          data: iotajs.Converter.utf8ToHex(messageTXT)
                        }
                  };
                  client.messageSubmit(submitMessage).then(success,error);
                  break;
                }
                this.status({});
		            self.readyIota = true;
            }
        });
    }
    RED.nodes.registerType("iotainfo",iotainfo);
}
