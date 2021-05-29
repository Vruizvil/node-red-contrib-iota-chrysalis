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
              run_health();
              //return callback;
            }
            async function error(callback) {
              console.log("Fail: ", callback);
              console.error(callback);
              msg.payload=callback;
              self.send(msg);
              run_health();
              //return callback;
            }
            async function run_messageId(messageID) {
                  callback = await client.message(messageID)
                    .then((callback) => {
                      console.log("Done run_messageId")
                      callback2=callback;
                      callback2.messageId = messageID;
    		              console.log("Inside run_messageId : ", callback);
                      if (callback.payload.type == 2) {
                        callback2.payload.index = Buffer.from(callback.payload.index,'hex').toString('ascii');
                        callback2.payload.data = Buffer.from(callback.payload.data,'hex').toString('ascii');
                        success(callback2)
                      } else {
                        error(callback2);
                      }
                    })
                    .catch((err) => error(err));
            }
	          function isEmpty(val) {
	                return (val === undefined || val == null || val.length <= 0) ? true : false;
	          }
	          function isMessageID(val) {
	                return (val.length = 64 && iotajs.Converter.isHex(val)) ? true : false;
	          }
            function see_args(callback) {
              console.log("inside see_args: ", msg);
              switch (config.iotaSelect) {
                case 'messageChildren':
                 callback = (isEmpty(msg.payload.message) ? (isEmpty(msg.payload) ? config.iotaValue : msg.payload) : msg.payload.message);
                 if (isEmpty(callback) || !isMessageID(callback)) {
                  console.log("msg.payload incorrect messageID format: ", msg.payload);
                  console.log("Args function incorrect messageID format: ", config.iotaValue);
                  callback = null;
                }
                break;
                case 'messageFind':
                 callback = (isEmpty(msg.payload.messageToFind) ? (isEmpty(msg.payload) ? config.iotaValue : msg.payload) : msg.payload.messageToFind);
                break;
                case 'messageID':
                 callback = (isEmpty(msg.payload.message) ? (isEmpty(msg.payload) ? config.iotaValue : msg.payload) : msg.payload.message);
                 if (isEmpty(callback) || !isMessageID(callback)) {
                  console.log("msg.payload incorrect messageID format: ", msg.payload);
                  console.log("Args function incorrect messageID format: ", config.iotaValue);
                  callback = null;
                }
                break;
                case 'messageSubmit':
                 messageData = (isEmpty(msg.payload.messageToSubmit) ? (isEmpty(msg.payload) ? config.iotaValue : msg.payload) : msg.payload.messageToSubmit);
                 messageIndex = (isEmpty(msg.payload.messageIndex) ? ("node-red-contrib-iota-Chrysalis") : msg.payload.messageIndex);

                 let txt = JSON.stringify(messageData);
                 messageData = TRAN.transliterate(txt);
                 console.log("Done: ", messageData);
                 const submitMessage = {
                 // Parents can be left undefined if you want the node to populate the field
                 //parentMessageIds: client.tips().tipMessageIds.slice(0, iota_js_1.MAX_NUMBER_PARENTS),
                 payload: {
                   type: iotajs.INDEXATION_PAYLOAD_TYPE,
                   index: iotajs.Converter.utf8ToHex(messageIndex),
                   data: iotajs.Converter.utf8ToHex(messageData)
                   }
                 };
                 callback = submitMessage;
                break;
              }
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
              console.log("Running iota-messages...");
              this.readyIota = false;
              var self = this;
              //var orig_status = this.status();
              //this.status({fill:"blue",shape:"ring",text:"connecting"});
              switch (config.iotaSelect){
                case 'messageChildren':
                node.status({fill:"red",shape:"ring",text:"SearchChildren..."});
                  messageID = see_args()
                  if (!isEmpty(messageID)) {
                     client.messageChildren(messageID).then(success,error);
                   } else {
                     msg_error = "Error: Incorrect messageID format";
                     //self.send(msg);
                     error(msg_error);
                   }
                  break;
                case 'messageFind':
                  node.status({fill:"red",shape:"ring",text:"SearchMessageIndex..."});
                  messageToFind = see_args();
                  if (!isEmpty(messageToFind)) {
                    //console.log(messageToFind);
                    client.messagesFind(iotajs.Converter.utf8ToBytes(messageToFind)).then(success,error);
                  } else {
                    msg_error = "Error: Incorrect message to find format";
                    //self.send(msg);
                    error(msg_error);
                  }
                  break;
                case 'messageID':
                  node.status({fill:"red",shape:"ring",text:"SearchMessageID..."});
		              messageID = see_args()
		              if (!isEmpty(messageID) && isMessageID(messageID)) {
			                 run_messageId(messageID);
		              } else {
			                 msg_error = "Error: Incorrect messageID format";
			                 //self.send(msg);
                       error(msg_error);
			            }
                  break;
                case 'messageSubmit':
                  node.status({fill:"red",shape:"ring",text:"SubmitMessage..."});
                  submitMessage = see_args();
                  client.messageSubmit(submitMessage).then(success,error);
                  break;
                }
		            this.readyIota = true;
            }
        });
    }
    RED.nodes.registerType("iotamessages",iotamessages);
}
