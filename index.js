const Functions = require('./Functions');
const express = require('express');
const path = require('path');
const axios = require('axios');
const nunjucks = require('nunjucks');

const app = express();

const axios_instance = axios.create();
axios_instance.defaults.timeout = 3000;

if (process.env.NODE_ENV !== 'production') {
    require('dotenv').config();
}

const app_title = "Blaise Survey Manager Lite"

function getInstruments() {
    return new Promise((resolve, reject) => {
        axios_instance.get(process.env.INTRUMENT_CHECKER_URL + '/api/instruments?vm_name=' + process.env.VM_INTERNAL_URL)
            .then(function (response) {
                // Add interviewing link and date of instrument to array objects
                response.data.forEach(function (element) {
                    element.link = process.env.VM_EXTERNAL_WEB_URL + "/" + element.name + '?LayoutSet=CATI-Interviewer_Large';
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

nunjucks.configure('views', {
    autoescape: true,
    express: app
});

function render_homepage(res, instruments, error = null) {
    res.render('index.html', {
        title: app_title,
        error: error,
        instruments: instruments,
        external_cati_dashboard_web_url: process.env.VM_EXTERNAL_WEB_URL + "/Blaise",
        external_client_url: process.env.VM_EXTERNAL_CLIENT_URL
    });
}

app.get('/health_check', async function (req, res) {
    console.log("Heath Check endpoint called")
    res.json(200)
});

app.get('/', async function (req, res) {

    getInstruments()
        .then((instruments) => {
            console.log("Rendering page index.html")
            render_homepage(res, instruments)
        })
        .catch((error) => {
            console.log("Rendering page index.html with error")
            render_homepage(res, [], error);
        })
});

//Capture All 404 errors
app.use(function (req,res,next){
    res.status(404).render('404.html', {
        title: app_title,
        external_client_url: process.env.VM_EXTERNAL_CLIENT_URL
    });
});

const port = process.env.PORT || 5000;
app.listen(port);

console.log('App is listening on port ' + port);
