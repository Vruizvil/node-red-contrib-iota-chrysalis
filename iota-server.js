module.exports = function(RED) {
    function IotaServer(n) {
        RED.nodes.createNode(this,n);
        this.host = n.host;
        this.port = n.port;
        //host and port for iota provider
    }
    
    RED.nodes.registerType("iotaserver",IotaServer);
}
