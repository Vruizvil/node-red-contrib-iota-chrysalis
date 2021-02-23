module.exports = function(RED) {
    function IotaServerNode(n) {
        RED.nodes.createNode(this,n);
        this.host = n.host;
        this.port = n.port;
        //host and port for iota provider
    }
    RED.nodes.registerType("iota-server",IotaServerNode);
}
