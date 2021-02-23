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

        const client = new SingleNodeClient({'host': this.iotaNode.host, 'port': this.iotaNode.port});
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

                        break;
                case 'bundles':
                        break;
                case 'tags':
                        break;
                case 'approvees':
                      //  objeto = {approvees:[iota_value]};
                      
                        break;
                }

                console.log(objeto);
                const info = await client.info();
                client.info((error, success) => {
                  //console.log("Report from iota node:");
                  this.status({});
                  if (error) {
                     console.log(error);
                     msg.payload=error;
                     self.send(msg);
                  } else {
                     console.log(success);
                     msg.payload=success;
                     self.send(msg);
                  }
		  self.readyIota = true;
                });
            }
        });
    }
    RED.nodes.registerType("iotainfo",iotainfo);
}
