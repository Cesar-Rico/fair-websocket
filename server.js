const WebSocket = require('ws');
const PORT = process.env.PORT || 8080;
const server = require('http').createServer();
const wss = new WebSocket.Server({ server });

let counter = 0;
let interval = null;

wss.on('connection', (ws) => {
    console.log('New client connected');
    ws.send(JSON.stringify({ type: 'counter', value: counter }));

    ws.on('message', (message) => {
        try {
            const data = JSON.parse(message);

            if (data.action === "reset") {
                console.log("Resetting counter...");
                counter = 60;
            } else if (data.action === "add") {
                console.log("Adding 5 minutes...");
                counter += 5;
            } else if (data.action === "stop") {
                console.log("Stopping counter...");
                counter = 0;
                clearInterval(interval);
                interval = null;
            } else if (data.action === "start") {
                console.log("Starting counter...");
                if (interval) return;

                let counterInMinutes = parseInt(data.message);
                if (isNaN(counterInMinutes) || counterInMinutes <= 0) return;

                counter = counterInMinutes * 60;
                interval = setInterval(() => {
                    counter--;
                    if (counter <= 0) {
                        clearInterval(interval);
                        interval = null;
                    }
                    broadcast({ type: "counter", value: counter });
                }, 1000);
            }
            broadcast({ type: "counter", value: counter });
        } catch (error) {
            console.error("Invalid JSON received:", message);
        }
    });

    ws.on('close', () => {
        console.log('Client disconnected');
        // Si no hay clientes conectados, detener el contador
        if (wss.clients.size === 0 && interval) {
            clearInterval(interval);
            interval = null;
            console.log("No clients connected, stopping interval.");
        }
    });
});

function broadcast(data){
    wss.clients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify(data));
        }
    })
}

server.listen(PORT, () => {
    console.log(`Servidor HTTP corriendo en http://localhost:${PORT}`);
});