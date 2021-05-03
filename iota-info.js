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
            function isEmpty(val){
                  return (val === undefined || val == null || val.length <= 0) ? true : false;
            }
            async function run_milestone(lmi) {
              lmi = parseInt(config.iotaValue);
              if (!Number.isInteger(lmi)) {
                lmi = null
              }
              if (!isEmpty(msg.payload)) {
                lmi = parseInt(msg.payload)
                if (isNaN(lmi) || !Number.isInteger(lmi)) {
                  lmi = null
                }
              }
                  if (lmi == null) {
                     await client.info()
                           .then(info => { //console.log("latestMilestoneIndex: ", info.latestMilestoneIndex);
                                           const milestone = client.milestone(info.latestMilestoneIndex).then(success,error);
                                           })
                           .catch(fail => {console.log("Health Node: ", false);})
                  } else {
                           //console.log("specified MilestoneIndex: ", lmi);
                           const milestone = client.milestone(lmi).then(success,error);
                   }
                //return milestone;
           }
           async function run_milestoneUtxoChanges(lmi) {
             lmi = parseInt(config.iotaValue);
             if (!Number.isInteger(lmi)) {
               lmi = null
             }
             if (!isEmpty(msg.payload)) {
               lmi = parseInt(msg.payload)
               if (isNaN(lmi) || !Number.isInteger(lmi)) {
                 lmi = null
               }
             }
                 if (lmi == null) {
                    await client.info()
                          .then(info => { //console.log("latestMilestoneIndex: ", info.latestMilestoneIndex);
                                  const milestone = client.milestoneUtxoChanges(info.latestMilestoneIndex).then(success,error);
                                  })
                          .catch(fail => {console.log("Health Node: ", false);})
                 } else {
                          //console.log("specified MilestoneIndex: ", lmi);
                          const milestone = client.milestoneUtxoChanges(lmi).then(success,error);
                  }
               //return milestone;
          }


            if (this.readyIota) {
              console.log("Searching dataset...");
              this.readyIota = false;
              var self = this;
              //this.status({fill:"red",shape:"ring",text:"connecting"});
              iota_value = config.iotaValue;

              switch (config.iotaSelect){
                case 'info':
                  client.info().then(success,error);
                  break;
                case 'tips':
                  client.tips().then(success,error);
                  break;
                case 'milestone':
                  run_milestone(iota_value);
                  break;
                case 'milestoneUtxoChanges':
                  run_milestoneUtxoChanges();
                  break;
                }
                //this.status({});
		            this.readyIota = true;
            }
        });
    }
    RED.nodes.registerType("iotainfo",iotainfo);
}
