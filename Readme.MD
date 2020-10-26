# Blaise Survey Manager Lite

Blaise Dashboard for accessing active surveys and CATI dashboard.

### Setup

#### Prerequisites
To run Blaise Survey Manger Lite locally, you'll need to have [Node installed](https://nodejs.org/en/).
To have the list of instruments load on the page, you'll need to have [Blaise Instrument Checker](https://github.com/ONSdigital/blaise-instrument-checker) running locally
 or you can [port forward from a Kubernetes pod](https://kubernetes.io/docs/tasks/access-application-cluster/port-forward-access-application-cluster/) running in a sanndbox.  

#### Setup locally steps
Clone the Repo
```shell script
git clone https://github.com/ONSdigital/blaise-survey-manager-lite.git
```

Create a new .env file and add the following variables.

| Variable                      | Description                                                                     | Var Example                  |
|-------------------------------|---------------------------------------------------------------------------------|------------------------------|
| PORT                          | Optional variable, specify the Port for express server to run on. If not passed in this is set as 5000 by default.                                              | 5009                         |
| VM_EXTERNAL_WEB_URL           | External Url used for CATI dashboard and survey links.                          | tel-client-server.uk         |
| VM_INTERNAL_URL               | Internal url of the Blaise VM which is sent to the Instrument checker service.  | tel-web-server.internal.uk   |
| VM_EXTERNAL_CLIENT_URL        | External link to connect to Blaise remotely through Blaise Server Manager.      | tel-web-server.uk            |
| BLAISE_INSTRUMENT_CHECKER_URL | Url that Blaise Instrument Checker is running on to send calls to.              | localhost:5003               |


The .env file should be setup as below
```.env
PORT=5001
VM_EXTERNAL_WEB_URL='tel-client-server.uk'
VM_INTERNAL_URL='tel-web-server.internal.uk'
VM_EXTERNAL_CLIENT_URL='tel-web-server.uk'
BLAISE_INSTRUMENT_CHECKER_URL='localhost:5003'
```

Install required modules
```shell script
yarn install
```

Run the service
```shell script
yarn start
```

This will log the port the service is running on where you can connect from
```shell script
App is listening on port 5001
```

### Tests
The [Jest testing framework](https://jestjs.io/en/) has been setup in this project, all tests currently reside in the `tests` directory.
This currently only running tests on the health check endpoint, haven't got the hang of mocking Axios yet.
 
To run the tests run
```shell script
yarn run test
```

### Dockerfile
You can run this service in a container, the Dockerfile is setup to:
- Setup Yarn and the required dependencies.
- Run the tests, the build will fail if the tests fail.
- Run Yarn Start on startup