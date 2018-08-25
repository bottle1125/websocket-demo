var WebSocket = require('ws');
var WebSocketServer = WebSocket.Server;
var wss = new WebSocketServer({ port: 3000 });
var uuid = require('node-uuid');
var clients = [];

function wsSend(type, clientUuid, nickname, message) {
    for(var i = 0; i < clients.length; i++) {
        var clientSocket = clients[i].ws;
        if(clientSocket.readyState === WebSocket.OPEN) {
            clientSocket.send(JSON.stringify({
                "type": type,
                "id": clientUuid,
                "nickname": nickname,
                "message": message
            }));
        }
    }
}

var clientIndex = 1;

wss.on('connection', function(ws) {
    var clientUuid = uuid.v4();
    var nickname = "User" + clientIndex;
    clientIndex += 1;
    clients.push({ "id": clientUuid, "ws": ws, "nickname": nickname });

    var connectMessage = nickname + " 进入聊天室";
    wsSend('notification', clientUuid, nickname, connectMessage);
    
    ws.on('message', function(message) {
        if(message.indexOf('nickname_update') === 0) {
            var oldName = nickname;
            nickname = message.split(':')[1];

            var nickname_update_message = oldName + ' change to ' + nickname;
            wsSend('nickname_update', clientUuid, nickname, nickname_update_message);
        } else {
            wsSend('message', clientUuid, nickname, message);
        }
    });

    var closeSocket = function(customMessage) {
        for(var i = 0; i < clients.length; i++) {
            if(clients[i].id === clientUuid) {
                var disconnectMessage;
                if(customMessage) {
                    disconnectMessage = customMessage;
                } else {
                    disconnectMessage = nickname + ' has disconnected';
                }

                wsSend("notification", clientUuid, nickname, disconnectMessage);
                clients.splice(i, 1);
            }
        }
    };
    ws.on('close', function() {
        closeSocket();
    });
    process.on('SIGINT', function() {
        console.log('Closing things');
        closeSocket('Server has disconnected');
        process.exit();
    });
});
