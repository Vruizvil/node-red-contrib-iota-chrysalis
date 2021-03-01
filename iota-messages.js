const iotajs = require('@iota/iota.js');
const TRAN = require('transliteration');
const convert = (from, to) => str => Buffer.from(str, from).toString(to);
const utf8ToHex = convert('utf8', 'hex');
const hexToUtf8 = convert('hex', 'utf8');
module.exports = function(RED) {
    function iotamessages(config) {
        RED.nodes.createNode(this,config);
        var node = this;
        node._sec = 2;
	      node._firstroot = '';
        var iota_value = '';
        this.iotaNode = RED.nodes.getNode(config.iotaNode);

        const client = new iotajs.SingleNodeClient(this.iotaNode.host + ":" + this.iotaNode.port);
        node.readyIota = true;
        async function run_health(callback) {
              await client.health()
                      .then(callback => {
                        //console.log("Health Node: ", callback);
                        node.status({fill:"green",shape:"ring",text:"Heathy"});
                      })
                      .catch(fail => {
                        //console.log("Health Node: ", false);
                        node.status({fill:"red",shape:"ring",text:"Unhealthy"});
                      })
        }
        run_health();

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
                  callback = await client.message(messageID) //.then(success,error);
                  msg.payload=callback;
		              console.log("Done : ", callback);
                  msg.payload.messageId = messageID;
                  msg.payload.payload.index = Buffer.from(callback.payload.index,'hex').toString('ascii');
                  msg.payload.payload.data = Buffer.from(callback.payload.data,'hex').toString('ascii');
                  self.send(msg);
                  //return callback;
            }
	          function isEmpty(val){
	                return (val === undefined || val == null || val.length <= 0) ? true : false;
	          }
	          function isMessageID(val) {
	                return (val.length = 64 && iotajs.Converter.isHex(val)) ? true : false;
	          }
            function see_args(callback) {
		            callback= msg.payload;
 		             //console.log("init see_args: ", callback);
                if (isEmpty(callback) || !isMessageID(callback)) {
                  callback = config.iotaValue;
	                 if (isEmpty(callback) || !isMessageID(callback)){
		                console.log("msg.payload incorrect messageID format: ", msg.payload);
		                console.log("Args function incorrect messageID format: ", config.iotaValue);
		                //callback = Buffer.from('0000000000000000000000000000000000000000000000000000000000000000','hex');
		                callback = null;
	                }
                }
                //console.log("end see_args: ", callback);
                return callback;
            }
            function see_message(callback) {
              messageData = config.iotaValue;
              if (!isEmpty(msg.payload)) {
                messageData = msg.payload;
              }
              let txt = JSON.stringify(messageData);
              messageData = TRAN.transliterate(txt);
              console.log("Done: ", messageData);
              const submitMessage = {
              // Parents can be left undefined if you want the node to populate the field
              //parentMessageIds: client.tips().tipMessageIds.slice(0, iota_js_1.MAX_NUMBER_PARENTS),
              payload: {
                type: iotajs.INDEXATION_PAYLOAD_TYPE,
                index: iotajs.Converter.utf8ToHex("node-red-contrib-iota-Chrysalis"),
                data: iotajs.Converter.utf8ToHex(messageData)
                }
              };
              callback = submitMessage;
              return callback;
            }
            if (this.readyIota) {
              console.log("Searching dataset...");
              this.readyIota = false;
              var self = this;
              //var orig_status = this.status();
              //this.status({fill:"blue",shape:"ring",text:"connecting"});
              switch (config.iotaSelect){
                case 'messageDeserialize':
                  //const ArgsFunction = iota_value;
                  //if (msg.payload !== null) {
                  //  messageRaw = msg.payload;
                  //}
                  console.log(see_args());
                  iotajs.deserializeMessage(new iotajs.ReadStream(see_args())).then(success,error);
                  break;
                case 'messageFind':
                  messageToFind = config.iotaValue;
                  if (!isEmpty(msg.payload)) {
                    messageToFind = msg.payload;
                  }
                  console.log(messageToFind);
                  client.messagesFind(iotajs.Converter.utf8ToBytes(messageToFind)).then(success,error);
                  break;
                case 'messageID':
		              messageID = see_args()
		              if (!isEmpty(messageID)) {
			                 run_messageId(messageID);
		              } else {
			                 msg.payload="Error: Incorrect messageID format";
			                 self.send(msg);
			            }
                  break;
                case 'messageSubmit':
                  submitMessage = see_message();
                  client.messageSubmit(submitMessage).then(success,error);
                  break;
                }
                //this.status(orig_status);
		            this.readyIota = true;
            }
        });
    }
    RED.nodes.registerType("iotamessages",iotamessages);
}
