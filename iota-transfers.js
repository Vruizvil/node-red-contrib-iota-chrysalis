const iotajs = require('@iota/iota.js');
const TRAN = require('transliteration');
const convert = (from, to) => str => Buffer.from(str, from).toString(to);
const utf8ToHex = convert('utf8', 'hex');
const hexToUtf8 = convert('hex', 'utf8');
module.exports = function(RED) {
    function iotatransfers(config) {
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

	          function isEmpty(val){
	                return (val === undefined || val == null || val.length <= 0) ? true : false;
	          }

            function see_args(callback) {
		            callback= msg.payload;
 		             //console.log("init see_args: ", callback);
                if (isEmpty(callback)) {
                  callback = config.iotaAddressFrom;
                }
	              if (isEmpty(callback)) {
		              console.log("msg.payload incorrect address format: ", msg.payload);
		              console.log("Args function incorrect address format: ", config.iotaAddressFrom);
		              callback = null;
	              }
              return callback;
            }

            async function run_transfer(fromSeed,addressTo,amountToSend,messageKey,messageData) {
                    addr = addressTo;
                    if (!iotajs.Bech32Helper.matches(addr, node.bech32HRP)) {
                      ad = await client.addressEd25519(addr);
                      bech_ad = iotajs.Bech32Helper.toBech32(iotajs.ED25519_ADDRESS_TYPE, iotajs.Converter.hexToBytes(ad.address), node.bech32HRP);
                    } else {
                         ad = await client.address(addr);
                         bech_ad = addr;
                         };
                  console.log("AddressTo Hex Bech32: ", ad.address, bech_ad);

                  //Prepare Wallet Seed
                  seed = fromSeed;
                  const walletSeed = new iotajs.Ed25519Seed(iotajs.Converter.hexToBytes(seed));
                  const walletPath = new iotajs.Bip32Path("m/44'/4218'/0'/0'/0'");
                  const walletAddressSeed = walletSeed.generateSeedFromPath(walletPath);
                  const walletEd25519Address = new iotajs.Ed25519Address(walletAddressSeed.keyPair().publicKey);
                  const newAddress = walletEd25519Address.toAddress();
                  const newAddressH = iotajs.Converter.bytesToHex(newAddress);
                  const newAddressHex = await client.addressEd25519(newAddressH);
                  const newAddressBech = iotajs.Bech32Helper.toBech32(iotajs.ED25519_ADDRESS_TYPE, newAddress, node.bech32HRP);
                  console.log("Wallet Address From: ", newAddressHex, newAddressBech);

                  //Prepare Outputs to send tokens
                  output = [
                       { addressBech32: bech_ad,
                       amount: amountToSend,
                       isDustAllowance: false }
                       ];
                   console.log("OutPut: ", output);

                   //Prepare Message Payload
                   let txt = JSON.stringify(messageData);
                   messageData = TRAN.transliterate(txt);
                   console.log("Message to Send: ", messageData);
                   const submitMessage = {
                   payload: {
                     key: iotajs.Converter.utf8ToHex(messageKey),
                     data: iotajs.Converter.utf8ToHex(messageData)
                     }
                   };
                   console.log("Payload message: ", submitMessage.payload);
                   //const message2Id = await Iota.sendEd25519(client,walletSeed,0,ad.address,amountToSend,submitMessage.payload).then(success,error);
                   const message2Id = await iotajs.sendMultiple(client, walletSeed,0, output, submitMessage.payload).then(success,error);

                   console.log("Created Message Transfer Id", message2Id);
                   const walletBalance = await iotajs.getBalance(client, walletSeed, 0);
                   console.log("Wallet Address Balance", walletBalance);
             }

            if (this.readyIota) {
              console.log("Running iota-transfers...");
              this.readyIota = false;
              var self = this;
              switch (config.iotaSelect){
                case 'NewWallet':
	                break;
                case 'SendTokens':
                  fromSeed = config.iotaAddressFrom;
                  addressTo = config.iotaAddressTo;
                  amountToSend = config.iotaValue;
                  messageKey = "node-red-contrib-iota-Chrysalis";
                  messageData = config.iotaMessage;
                  run_transfer(fromSeed, addressTo, amountToSend, messageKey, messageData);
                  break;
                }
                //this.status(orig_status);
		            this.readyIota = true;
            }
        });
    }
    RED.nodes.registerType("iotatransfers",iotatransfers);
}
