const { SingleNodeClient } = require('@iota/iota.js');
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
            if (this.readyIota) {
              console.log("Searching dataset...")
              this.readyIota = false;
              var self = this;
              this.status({fill:"red",shape:"ring",text:"connecting"});

              iota_value = config.iotaValue;

              var objeto;
              switch (config.iotaSelect){
                case 'info':
                  client.info()
                  .then(success => {
                	   console.log("Done: ", success);
        	                msg.payload=success;
 	                        self.send(msg);
		                 console.log("fin success")})
		              .catch(error => {
                		 console.error(error);
	                         msg.payload=error;
         	                 self.send(msg);
		                 console.log("fin error")})
                    break;
                case 'tips':
                  client.tips()
                  .then(success => {
                	   console.log("Done: ", success);
        	                msg.payload=success;
 	                        self.send(msg);
		                 console.log("fin success")})
		              .catch(error => {
                		 console.error(error);
	                         msg.payload=error;
         	                 self.send(msg);
		                 console.log("fin error")})
                    break;
                case 'messageID':
                  //iota_value = msg.payload;
                  client.message(iota_value)
                  .then(success => {
                	   console.log("Done: ", success);
        	                msg.payload=success;
 	                        self.send(msg);
		                 console.log("fin success")})
		              .catch(error => {
                		 console.error(error);
	                         msg.payload=error;
         	                 self.send(msg);
		                 console.log("fin error")})
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
