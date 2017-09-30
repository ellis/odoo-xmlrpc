/*
 *
 * Author: Faisal Sami
 * mail: faisalsami78@gmail.com
 * https://github.com/faisalsami/odoo-xmlrpc
 *
 * Updated by: Ellis Whitehead
 * https://github.com/ellis/odoo-xmlrpc
 *
 */
const xmlrpc = require('xmlrpc');
const url = require('url');

function callClientMethod(client, method, params) {
	return new Promise((resolve, reject) => {
		// console.log({method, params})
		client.methodCall(method, params, (error, value) => {
			// console.log({error, value})
			if (error) {
				reject(error);
			}
			else {
				resolve(value);
			}
		});
	});
}

const Odoo = function(config) {
	config = config || {};

	const urlparts = url.parse(config.url);
	this.host = urlparts.hostname;
	this.port = config.port || urlparts.port;
	this.db = config.db;
	this.username = config.username;
	this.password = config.password;
	this.secure = true;
	if (urlparts.protocol !== 'https:') {
		this.secure = false
	};
	let uid = 0;

	this.makeClient = function(path) {
		const clientOptions = {
			host: this.host,
			port: this.port,
			path
		};
		return (this.secure)
			? xmlrpc.createSecureClient(clientOptions)
			: xmlrpc.createClient(clientOptions);
	};

	this.connect = async function() {
		const client = this.makeClient("/xmlrpc/2/common");

		if (this.secure == false) {
			console.log("Client over HTTP")
		} else {
			console.log("Client over HTTPS port " + this.port)
		}

		const params = [
			this.db,
			this.username,
			this.password,
			{}
		];
		uid = await callClientMethod(client, "authenticate", params);
		return true;
	};

	this.execute_kw = async function(model, method, params, args) {
		const client = this.makeClient("/xmlrpc/2/object");

		const fparams = [
			this.db,
			uid,
			this.password,
			model,
			method,
			params
		];
		if (args) {
			fparams.push(args);
		}
		// console.log("fparams:", fparams);
		return callClientMethod(client, "execute_kw", fparams);
	};

	this.exec_workflow = function(model, method, params, callback) {
		const client = this.makeClient("/xmlrpc/2/object");

		const fparams = [];
		fparams.push(this.db);
		fparams.push(uid);
		fparams.push(this.password);
		fparams.push(model);
		fparams.push(method);
		for (const i = 0; i < params.length; i++) {
			fparams.push(params[i]);
		}
		client.methodCall('exec_workflow', fparams, function(error, value) {
			if (error) {
				return callback(error, null);
			}
			return callback(null, value);
		});
	};

	this.render_report = function(report, params, callback) {
		const client = this.makeClient("/xmlrpc/2/report");

		const fparams = [];
		fparams.push(this.db);
		fparams.push(uid);
		fparams.push(this.password);
		fparams.push(report);
		for (const i = 0; i < params.length; i++) {
			fparams.push(params[i]);
		}
		client.methodCall('render_report', fparams, function(error, value) {
			if (error) {
				return callback(error, null);
			}
			return callback(null, value);
		});
	};
};

module.exports = Odoo;
