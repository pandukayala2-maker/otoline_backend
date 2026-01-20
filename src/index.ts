import cors from 'cors';
import express, { Express } from 'express';
import path from 'path';
import fs from 'fs';
import router from './common/base_routes';
import ServerAppConfig from './config/server_config';
import CustomErrorHandler from './middleware/error_handler';
import { payloadHandler } from './middleware/payload_handler';
import Config from './config/dot_config';
import corsMiddleware from './utils/cors';
import { apiRequestInfo } from './utils/logger';

const app: Express = express();

app.use(cors({ origin: true }));
app.use(corsMiddleware);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(express.static(path.join(__dirname, '..', 'assets/')));
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.static('/mnt/autoline/public/'));

// Serve vendor uploaded media even if STATIC_PATH is not set correctly
const staticRoot = Config._STATIC_PATH || path.join(__dirname, '..');

// Vendor images
app.use('/vendor', (req, res, next) => {
	const safePath = path.normalize(req.path).replace(/^\\|\//, '');
	const candidate = path.join(staticRoot, 'vendor', safePath);
	console.log(`[IMAGE] Vendor image requested: ${req.path}`);
	console.log(`[IMAGE] Looking for: ${candidate}`);
	console.log(`[IMAGE] File exists: ${fs.existsSync(candidate)}`);
	if (fs.existsSync(candidate)) {
		console.log(`✅ [IMAGE] Serving vendor image: ${candidate}`);
		return res.sendFile(candidate);
	}
	console.log(`❌ [IMAGE] Vendor image not found: ${candidate}`);
	// Return 404 for missing images instead of passing to next route
	if (req.path.includes('/image/')) {
		return res.status(404).send('Image not found');
	}
	next();
});

// Category images
app.use('/category', (req, res, next) => {
	const safePath = path.normalize(req.path).replace(/^\\|\//, '');
	const candidate = path.join(staticRoot, 'assets', 'category', safePath);
	console.log(`[IMAGE] Category image requested: ${req.path}`);
	console.log(`[IMAGE] Looking for: ${candidate}`);
	console.log(`[IMAGE] File exists: ${fs.existsSync(candidate)}`);
	if (fs.existsSync(candidate)) {
		console.log(`✅ [IMAGE] Serving category image: ${candidate}`);
		return res.sendFile(candidate);
	}
	console.log(`❌ [IMAGE] Category image not found: ${candidate}`);
	// Return 404 for missing images instead of passing to next route
	if (req.path.includes('/image/')) {
		return res.status(404).send('Image not found');
	}
	next();
});

// Banner images
app.use('/banner', (req, res, next) => {
	const safePath = path.normalize(req.path).replace(/^\\|\//, '');
	const candidate = path.join(staticRoot, 'assets', 'banner', safePath);
	console.log(`[IMAGE] Banner image requested: ${req.path}`);
	console.log(`[IMAGE] Looking for: ${candidate}`);
	console.log(`[IMAGE] File exists: ${fs.existsSync(candidate)}`);
	if (fs.existsSync(candidate)) {
		console.log(`✅ [IMAGE] Serving banner image: ${candidate}`);
		return res.sendFile(candidate);
	}
	console.log(`❌ [IMAGE] Banner image not found: ${candidate}`);
	// Return 404 for missing images instead of passing to next route
	if (req.path.includes('/image/')) {
		return res.status(404).send('Image not found');
	}
	next();
});

// Car images - handle /car/image/:filename
app.use('/car/image', (req, res) => {
	const safePath = path.normalize(req.path).replace(/^\\|\//, '');
	// Since route is /car/image, req.path starts with /, so safePath is just the filename
	const candidate = path.join(staticRoot, 'public', 'car', 'image', safePath);
	console.log(`[IMAGE] Car image requested: ${req.path}`);
	console.log(`[IMAGE] Looking for: ${candidate}`);
	console.log(`[IMAGE] File exists: ${fs.existsSync(candidate)}`);
	if (fs.existsSync(candidate)) {
		console.log(`✅ [IMAGE] Serving car image: ${candidate}`);
		return res.sendFile(candidate);
	}
	console.log(`❌ [IMAGE] Car image not found: ${candidate}`);
	res.status(404).send('Image not found');
});

// Service images
app.use('/service/image', (req, res, next) => {
	const safePath = path.normalize(req.path).replace(/^\\|\//, '');
	const candidate = path.join(staticRoot, 'vendor', safePath);
	console.log(`[IMAGE] Service image requested: ${req.path}`);
	console.log(`[IMAGE] Looking for: ${candidate}`);
	console.log(`[IMAGE] File exists: ${fs.existsSync(candidate)}`);
	if (fs.existsSync(candidate)) {
		console.log(`✅ [IMAGE] Serving service image: ${candidate}`);
		return res.sendFile(candidate);
	}
	console.log(`❌ [IMAGE] Service image not found: ${candidate}`);
	res.status(404).send('Image not found');
});

// Product images (also served from vendor folder)
app.use('/product/image', (req, res, next) => {
	const safePath = path.normalize(req.path).replace(/^\\|\//, '');
	const candidate = path.join(staticRoot, 'vendor', safePath);
	console.log(`[IMAGE] Product image requested: ${req.path}`);
	console.log(`[IMAGE] Looking for: ${candidate}`);
	console.log(`[IMAGE] File exists: ${fs.existsSync(candidate)}`);
	if (fs.existsSync(candidate)) {
		console.log(`✅ [IMAGE] Serving product image: ${candidate}`);
		return res.sendFile(candidate);
	}
	console.log(`❌ [IMAGE] Product image not found: ${candidate}`);
	res.status(404).send('Image not found');
});

app.use(apiRequestInfo);
app.use(payloadHandler);

app.use('/v1', router);
app.use(CustomErrorHandler.invalidEndPointHandler);
app.use(CustomErrorHandler.errorHandler);

ServerAppConfig.createSever(app);
