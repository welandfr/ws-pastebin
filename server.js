const WebSocket = require('ws')
require('dotenv').config()

const PORT = process.env.PORT || 5000
const wss = new WebSocket.Server({ port: PORT })
const clients = new Set()

console.log(`Running WebSocket on port ${PORT}`)

// Send pasted value to all clients except specified
function sendToOtherClients(data, clientId) {
    sentInfo = []
    clients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN && clientId !== client.clientId) {
            client.send(data)
            sentInfo.push(client.clientInfo)
        }
    });
    return sentInfo
}

wss.on('connection', (ws, req) => {

    // Check token
    const urlParams = new URLSearchParams(req.url.slice(1))
    if (urlParams.get('token') !== process.env.TOKEN) {
        console.log('Invalid token: ' + urlParams.get('token'))
        ws.send(JSON.stringify({
            status: 1,
            val: 'ERROR: Invalid token.'
        }));
        ws.close()
    } 

    ws.clientId = req.headers['sec-websocket-key'] // Some random str from handshake, I'm using it as an ID (?)
    ws.clientInfo = { 
        clientId: clientId, 
        ip: req.socket.remoteAddress, 
        agent: req.headers['user-agent'], 
        connTime: new Date() 
    }
    clients.add(ws)
    console.log(`Client connected: ${req.socket.remoteAddress} (${clients.size} clients)`)

    ws.on('message', (message) => {
        data = JSON.parse(message)

        // Send pasted value to all other clients
        sentInfo = sendToOtherClients(JSON.stringify(data), ws.clientId)

        // Send message back to sender
        ws.send(JSON.stringify({
            val: `Pasted value sent to ${clients.size-1} clients`,
            clients: sentInfo
        }));
    });

    ws.on('close', () => {
        clients.delete(ws)
        console.log('Client disconnected')
    });
});