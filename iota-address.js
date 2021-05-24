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

	    function isEmpty(val) {
	      return val === undefined || val == null || val.length === 0;
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
                  console.log("Address Hex Bech32: ", ad.address, bech_ad);
                  msg.addressBech32 = bech_ad;
                  client.address(bech_ad).then(success,error);
                  //return bech_ad;
             }

           async function run_addr_output(callback) {
                   addr = callback
                   if (!iotajs.Bech32Helper.matches(addr, node.bech32HRP)) {
                     ad = await client.addressEd25519(addr);
                     bech_ad = iotajs.Bech32Helper.toBech32(iotajs.ED25519_ADDRESS_TYPE, iotajs.Converter.hexToBytes(ad.address), node.bech32HRP);
                   } else {
                        ad = await client.address(addr);
                        bech_ad = addr;
                        };
                 console.log("Address Hex Bech32: ", ad.address, bech_ad);
                 msg.addressBech32 = bech_ad;
                 client.addressOutputs(bech_ad).then(success,error);
                 //return bech_ad;
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

            if (this.readyIota) {
              console.log("Running iota-transfers...");
              this.readyIota = false;
              var self = this;
              switch (config.iotaSelect){
                case 'AddressInfo':
                  addr_from = see_args();
                  if (!isEmpty(addr_from)) {
                     run_addr(addr_from);
                   } else {
                     msg.payload = "Error: Incorrect Address format";
                     self.send(msg);
                   }
                  break;
                case 'AddressOutput':
                  addr_from = see_args();
                  if (!isEmpty(addr_from)) {
                     run_addr_output(addr_from);
                   } else {
                     msg.payload = "Error: Incorrect Address format";
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
