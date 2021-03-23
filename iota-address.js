const iotajs = require('@iota/iota.js');
const TRAN = require('transliteration');
const convert = (from, to) => str => Buffer.from(str, from).toString(to);
const utf8ToHex = convert('utf8', 'hex');
const hexToUtf8 = convert('hex', 'utf8');
module.exports = function(RED) {
    function iotaaddress(config) {
        RED.nodes.createNode(this,config);
        var node = this;
        node._sec = 2;
	      node._firstroot = '';
        var iota_value = '';
        this.iotaNode = RED.nodes.getNode(config.iotaNode);

        const client = new iotajs.SingleNodeClient(this.iotaNode.host + ":" + this.iotaNode.port);
        node.readyIota = true;
        node.bech32HRP = "";
        async function run_health(callback) {
              await client.info()
                      .then(callback => {
                        //console.log("Health Node: ", callback);
                        if (callback.isHealthy) {
                          node.bech32HRP = callback.bech32HRP;
                          node.status({fill:"green",shape:"ring",text:"Heathy"});
                        } else {
                          node.bech32HRP = callback.bech32HRP;
                          node.status({fill:"red",shape:"ring",text:"Unhealthy"});
                        }
                      })
                      .catch(fail => {
                        //console.log("Health Node: ", callback);
                        node.status({fill:"red",shape:"ring",text:"NoConnected"});
                      });
                    return callback;
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
            async function bech32ToHex(val) {
              //callback = iotajs.Converter.bytesToHex(iotajs.Bech32Helper.fromBech32(val, node.bech32HRP).addressBytes)
              //console.log("bech32ToHex: ", val, callback);
              if (iotajs.Bech32Helper.matches(val, node.bech32HRP)) {
                ad = await client.address(val);
                callback = ad.address;
                console.log("Bech32 to Hex: ", val, callback);
              } else {
                  ad = await client.addressEd25519(val);
                  ad_bech = iotajs.Bech32Helper.toBech32(iotajs.ED25519_ADDRESS_TYPE, iotajs.Converter.hexToBytes(ad.address), node.bech32HRP);
                  console.log("Hex to Bech32: ", ad.address, ad_bech);
                  callback = val;
                };
              return callback;  //return Hex format
            }
	          function isEmpty(val){
	                return (val === undefined || val == null || val.length <= 0) ? true : false;
	          }
	          function isMessageID(val) {
                  //console.log("isMessageID length isHex?: ", val, val.length, iotajs.Converter.isHex(val));
	                return (val.length = 64 && iotajs.Converter.isHex(val)) ? true : false;
	          }
            function isAddress(val) {
                  add_hex = bech32ToHex(val);
                  return isMessageID(add_hex);
                  //return (bech32ToHex(val).length = 64 && iotajs.Converter.isHex(bech32ToHex(val))) ? true : false;
            }
            function isOutput(val) {
                  return (val.length = 68 && iotajs.Converter.isHex(val)) ? true : false;
            }
            async function run_addr(callback) {
                    addr = callback
                    if (!iotajs.Bech32Helper.matches(addr, node.bech32HRP)) {
                      ad = await client.addressEd25519(addr);
                      bech_ad = iotajs.Bech32Helper.toBech32(iotajs.ED25519_ADDRESS_TYPE, iotajs.Converter.hexToBytes(ad.address), node.bech32HRP);
                   } else {
                         ad = await client.address(addr);
                         bech_ad = addr;
                         };
                  console.log("Origen ADDR Hex Bech32: ", ad.address, bech_ad);
                  return bech_ad;
                 }
            function see_args(callback) {
		            callback= msg.payload;
 		             //console.log("init see_args: ", callback);
                if (isEmpty(callback))  {
                  callback = config.iotaAddressFrom;
                }
                if (isEmpty(callback)) {
		                console.log("msg.payload incorrect address format: ", msg.payload);
		                console.log("Args function incorrect address format: ", config.iotaAddressFrom);
		                callback = null;
	                }
                return callback;
            }
            function see_message(callback) {
              messageData = config.iotaMessage;
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
              console.log("Running iota-transfers...");
              this.readyIota = false;
              var self = this;
              switch (config.iotaSelect){
                case 'AddressInfo':
                  addr_from = see_args();
                  if (!isEmpty(addr_from)) {
                     bech32Addr = run_addr(addr_from);
                     msg.addressFrom = bech32Addr;
                   } else {
                     msg.addressFrom = "Error: Incorrect Address format";
                     break;
                     //self.send(msg);
                   }
                  client.address(bech32Addr).then(success,error);
                  break;
                case 'AddressOutput':
                  addr_from = see_args();
                  if (!isEmpty(addr_from)) {
                     bech32Addr = run_addr(addr_from);
                     msg.addressFrom = bech32Addr;
                   } else {
                     msg.addressFrom = "Error: Incorrect Address format";
                     break;
                     //self.send(msg);
                   }
                  client.addressOutputs(bech32Addr).then(success,error);
                  break;
                case 'HexToBech32':
                  addr_from = see_args();
                  if (!isEmpty(addr_from)) {
                     bech32Addr = run_addr(addr_from);
                     msg.payload = bech32Addr;
                     self.send(msg);
                  }
                break;
                case 'Bech32ToHex':
                  addr_from = see_args();
                  if (!isEmpty(addr_from)) {
                    bech32Addr = run_addr(addr_from);
                    msg.payload = iotajs.Converter.bytesToHex(iotajs.Bech32Helper.fromBech32(bech32Addr, node.bech32HRP).addressBytes);
                    self.send(msg);
                  }
                break;
                }
                //this.status(orig_status);
		            this.readyIota = true;
            }
        });
    }
    RED.nodes.registerType("iotaaddress",iotaaddress);
}
