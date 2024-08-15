import express from "express";
import path from "path";
import favicon from "serve-favicon";
import cookieParser from "cookie-parser";
import helmet from "helmet";
import compression from "compression";
import { fileURLToPath } from "url";
import { dirname } from "path";
import sessionParser from "./routes/session_parser.js";
import utils from "./services/utils.js";
import assets from "./routes/assets.js";
import routes from "./routes/routes.js";
import custom from "./routes/custom.js";
import error_handlers from "./routes/error_handlers.js";
import { startScheduledCleanup } from "./services/erase.js";
import sql_init from "./services/sql_init.js";
import oidc from 'express-openid-connect';
import openID from './services/open_id.js';

await import('./services/handlers.js');
await import('./becca/becca_loader.js');
require('dotenv').config();

const app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

if (!utils.isElectron()) {
    app.use(compression()); // HTTP compression
}

app.use(helmet.default({
    hidePoweredBy: false, // errors out in electron
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false
}));

app.use(express.text({ limit: '500mb' }));
app.use(express.json({ limit: '500mb' }));
app.use(express.raw({ limit: '500mb' }));
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public/root')));
app.use(`/manifest.webmanifest`, express.static(path.join(__dirname, 'public/manifest.webmanifest')));
app.use(`/robots.txt`, express.static(path.join(__dirname, 'public/robots.txt')));
app.use(sessionParser);
app.use(favicon(`${__dirname}/../images/app-icons/win/icon.ico`));

if (openID.checkOpenIDRequirements()) 
    app.use(oidc.auth(openID.generateOAuthConfig()));

assets.register(app);
routes.register(app);
custom.register(app);
error_handlers.register(app);

// triggers sync timer
require('./services/sync');

// triggers backup timer
require('./services/backup');

// trigger consistency checks timer
require('./services/consistency_checks');

require('./services/scheduler');

if (utils.isElectron()) {
    require('@electron/remote/main').initialize();
}

export = app;
