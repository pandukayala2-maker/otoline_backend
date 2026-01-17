import { Express } from 'express';
import fs from 'fs';
import http from 'http';
import https from 'https';
import { EnvEnum } from '../constant/enum';
import { logger } from '../utils/logger';
import WebSocketConfig from '../websockets/websocket_config';
import MongoConnection from './connection';
import Config from './dot_config';

const port: string = Config._PORT;

class ServerAppConfig {
    public static async createSever(app: Express) {
        try {
            const mongoConnection = MongoConnection.getInstance();
            await mongoConnection.connect();

            // Use development HTTP for local development, HTTPS for production
            const env = Config._APP_ENV?.toLowerCase().trim();
            
            if (env === 'production' || env === 'staging') {
                this.httpsServer(app);
            } else {
                // Default to HTTP for development
                this.httpServer(app);
            }
        } catch (error) {
            console.error('Application failed to start:', error);
            process.exit(1); // Exit the application on a critical failure
        }
    }

    private static httpsServer(app: Express) {
        const options: Record<string, unknown> = {
            key: fs.readFileSync('/etc/letsencrypt/live/hm.api.ansoftt.com/privkey.pem'),
            cert: fs.readFileSync('/etc/letsencrypt/live/hm.api.ansoftt.com/fullchain.pem'),            
        };
        const httpServer = https.createServer(options, app);
        httpServer
            .listen(port, function () {
                console.info(`Secure Server Started with SSL at port : ${port}`);
                logger.info(`Secure Server Started with SSL at port : ${port}`);
            })
            .on('error', (err) => {
                console.error('Error starting HTTPS server:', err);
            });
    }

    private static httpServer(app: Express) {
        const httpServer = http.createServer(app);
        new WebSocketConfig(httpServer);
        httpServer.listen(Number(port), '0.0.0.0', () => {
            console.log(`Local server started at port : ${port} on all network interfaces (0.0.0.0)`);
        });
    }
}

export default ServerAppConfig;
