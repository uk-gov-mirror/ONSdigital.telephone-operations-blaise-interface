const Functions = require('./Functions');
const express = require('express');
const axios = require('axios');
// const nunjucks = require('nunjucks');
const path = require('path');

const server = express();

const axios_instance = axios.create();
axios_instance.defaults.timeout = 10000;

if (process.env.NODE_ENV !== 'production') {
    require('dotenv').config();
}

const app_title = "Blaise Survey Manager Lite"

function getInstruments() {
    return new Promise((resolve, reject) => {
        axios_instance.get("http://" + process.env.BLAISE_INSTRUMENT_CHECKER_URL + '/api/instruments?vm_name=' + process.env.VM_INTERNAL_URL)
            .then(function (response) {
                // Add interviewing link and date of instrument to array objects
                response.data.forEach(function (element) {
                    element.link = "https://" + process.env.VM_EXTERNAL_WEB_URL + "/" + element.name + '?LayoutSet=CATI-Interviewer_Large';
                    element.date = Functions.field_period_to_text(element.name)
                });
                console.log("Retrieved instrument list, " + response.data.length + " item/s")
                resolve(response.data)
            })
            .catch(function (error) {
                // handle error
                console.error("Failed to retrieve instrument list")
                console.error(error)
                reject(error)
            })
    })
}

// An api endpoint that returns a short list of items
server.get('/api/instruments', (req,res) => {
    console.log('get list of items');

    axios_instance.get("http://" + process.env.BLAISE_INSTRUMENT_CHECKER_URL + '/api/instruments?vm_name=' + process.env.VM_INTERNAL_URL)
        .then(function (response) {
            // Add interviewing link and date of instrument to array objects
            response.data.forEach(function (element) {
                element.link = "https://" + process.env.VM_EXTERNAL_WEB_URL + "/" + element.name + '?LayoutSet=CATI-Interviewer_Large';
                element.date = Functions.field_period_to_text(element.name)
            });
            console.log("Retrieved instrument list, " + response.data.length + " item/s")
            return res.json(response.data)
        })
        .catch(function (error) {
            // handle error
            console.error("Failed to retrieve instrument list")
            console.error(error)
            return res.status(500).json(error)
        })
});
// nunjucks.configure('views', {
//     autoescape: true,
//     express: server
// });


server.get('/health_check', async function (req, res) {
    console.log("Heath Check endpoint called")
    res.status(200).json({status: 200})
});

function render_homepage(res, instruments, error = null) {
    res.render('index.html', {
        title: app_title,
        error: error,
        instruments: instruments,
        external_cati_dashboard_web_url: "https://" + process.env.VM_EXTERNAL_WEB_URL + "/Blaise",
        external_client_url: process.env.VM_EXTERNAL_CLIENT_URL
    });
}

// server.get('/', async function (req, res) {
//     getInstruments()
//         .then((instruments) => {
//             console.log("Rendering page index.html")
//             render_homepage(res, instruments)
//         })
//         .catch((error) => {
//             console.log("Rendering page index.html with error")
//             render_homepage(res, [], error);
//         })
// });


// where ever the built package is
const buildFolder = '../build';

// load the value in the server
const { TITLE, VM_EXTERNAL_CLIENT_URL, VM_EXTERNAL_WEB_URL } = process.env;
let CATI_DASHBOARD_URL = "https://" + VM_EXTERNAL_WEB_URL + "/Blaise"

// treat the index.html as a template and substitute the value
// at runtime
server.set("views", path.join(__dirname, buildFolder));

server.engine("html", require("ejs").renderFile);

server.use(
    "/static",
    express.static(path.join(__dirname, `${buildFolder}/static`)),
);

server.get("*", function (req, res) {
    res.render("index.html", {VM_EXTERNAL_CLIENT_URL, CATI_DASHBOARD_URL});
});


//Capture All 404 errors
// server.use(function (req, res){
//     res.status(404).render('404.html', {
//         title: app_title,
//         external_client_url: process.env.VM_EXTERNAL_CLIENT_URL
//     });
// });

module.exports = server
