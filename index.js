const express = require('express');
const path = require('path');
const axios = require('axios');
const dotenv = require('dotenv').config();

const app = express();


if (process.env.NODE_ENV !== 'production') {
    require('dotenv').config();
}


// Serve the static files from the React app
app.use(express.static(path.join(__dirname, 'client/build')));

// An api endpoint that returns a short list of items
app.get('/api/getList', (req,res) => {
    console.log('get list of items');

    axios.get(process.env.INTRUMENT_CHECKER_URL + '/api/instruments?vm_name=' + process.env.VM_INTERNAL_URL)
        .then(function (response) {
            // handle success
            console.log(response.data);
            // Add interviewing link of instrument to array objects
            response.data.forEach(function (element) {
                element.link = process.env.VM_EXTERNAL_WEB_URL + element.name;
            });

            res.json(response.data);
        })
        .catch(function (error) {
            // handle error
            console.log(error);
            res.json(response.data);
        })
        .then(function () {
            // always executed
        });


    // // var list = ["item1", "item2", "item3"];
    // let list = [{name: "2004", link: "/link"},{name: "2007", link: "/link"},{name: "2101", link: "/link"}];
    //
    // var list = [{name: [{baocn: ""}], link: []}]
    // res.json(list);
    // console.log('Sent list of items');
});

app.get('/api/url_info', (req,res) => {
    res.json(
        {
            external_cati_dashboard_web_url: process.env.VM_EXTERNAL_WEB_URL + "/Blaise",
            external_client_url: process.env.VM_EXTERNAL_CLIENT_URL
        }
    );
});

app.get('/cati_dashboard', (req,res) => {
    console.log("Redirect to CATI dashboard")
    res.redirect('https://dev-matt42-web-tel.social-surveys.gcp.onsdigital.uk/Blaise');
});

app.get('/interview/:instrument', (req, res) => {
    console.log("Redirect to CATI dashboard")
    res.redirect(process.env.VM_EXTERNAL_WEB_URL + req.params.instrument);
});


// Handles any requests that don't match the ones above
app.get('*', (req,res) =>{
    res.sendFile(path.join(__dirname+'/client/build/index.html'));
});

const port = process.env.PORT || 5001;
app.listen(port);

console.log('App is listening on port ' + port);
