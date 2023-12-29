import { getServerDetails, getVPNSessions, startServer, stopServer } from './index';

const rawBodySaver = function (req, res, buf, encoding) {
    if (buf && buf.length) {
      req.rawBody = buf.toString(encoding || 'utf8');
    }
}

const express = require('express');
const app = express();
let bodyParser = require('body-parser');

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));


const port = process.env.SERVER_PORT ?? 3000;

app.use(function (req, res, next) {
    //Enabling CORS
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Methods", "GET,HEAD,OPTIONS,POST,PUT");
    res.header("Access-Control-Allow-Headers", "*");
      next();
});

app.post('/api/startServer', async (req, res) => {
    const event = { region: req?.body?.region, userId: req?.body?.userId };
    try {
        const response = await startServer(event);
        res.send(response);
    } catch(error: any) {
        res.status(500).send({ errorMessage: error?.message, stack: error?.stack })
    }
})

app.post('/api/stopServer', async (req, res) => {
    const event = { region: req?.body?.region, userId: req?.body?.userId, connectionId: req?.body?.connectionId };
    try {
        const response = await stopServer(event);
        res.send(response);
    } catch(error: any) {
        res.status(500).send({ errorMessage: error?.message })
    }
})

app.post('/api/getServerDetails', async (req, res) => {
    const event = { userId: req?.body?.userId };
    try {
        const response = await getServerDetails(event);
        res.send(response);
    } catch(error: any) {
        res.status(500).send({ errorMessage: error?.message })
    }
})

app.post('/api/getVPNSessions', async (req, res) => {
    const event = { userId: req?.body?.userId };
    try {
        const response = await getVPNSessions(event);
        res.send(response);
    } catch(error: any) {
        res.status(500).send({ errorMessage: error?.message })
    }
})

app.listen(port, () => {
    console.log(`PayAsYouGoVPN service listening on port ${port}`)
})