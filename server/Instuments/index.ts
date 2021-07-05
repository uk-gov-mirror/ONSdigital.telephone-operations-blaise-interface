import express, {Request, Response, Router} from "express";
import {Instrument, Survey} from "../../Interfaces";
import axios, {AxiosResponse} from "axios";
import _ from "lodash";
import Functions from "../Functions";
import AuthProvider from "../AuthProvider"
import { Footer } from "blaise-design-system-react-components";

export default function InstrumentRouter(
    BLAISE_API_URL: string, 
    VM_EXTERNAL_WEB_URL: string, 
    BIMS_CLIENT_ID: string,
    BIMS_API_URL:string
    ): 
    Router {
    "use strict";
    const instrumentRouter = express.Router();
    const authProvider = new AuthProvider(BIMS_CLIENT_ID);

    // An api endpoint that returns list of installed instruments
    instrumentRouter.get("/instruments", (req: Request, res: Response) => {
        console.log("get list of items");

        async function activeToday(instrument: Instrument) {
            return axios({
                url: `${BIMS_API_URL}/tostartdate/${instrument.name}`,
                method: "GET",
                headers: authProvider.getAuthHeader(),
            })
            .then(function (response: AxiosResponse) {

            let TelOpsStartDateResponse = response.data;
            
            if(TelOpsStartDateResponse == null || Date.parse(TelOpsStartDateResponse) <= Date.now())
            {
                console.log(`the instrument ${instrument.name} is live for TO (TO start date = ${TelOpsStartDateResponse}) (Active today = ${instrument.activeToday})`);
                return instrument.activeToday;
            }
            console.log(`the instrument ${instrument.name} is not currently live for TO (TO start date = ${TelOpsStartDateResponse}) (Active today = ${instrument.activeToday})`);
            return false;
            })
        }

        axios.get("http://" + BLAISE_API_URL + "/api/v1/cati/instruments")
            .then(async function (response: AxiosResponse) {
                let allInstruments: Instrument[] = response.data;
                let activeInstruments: Instrument[] = [];
                // Add interviewing link and date of instrument to array objects
                await Promise.all(allInstruments.map(async function (instrument: Instrument) {
                    let active = await activeToday(instrument);
                    console.log(`Active today outputted (${active}) for instrument (${instrument.name}) type of (${typeof active})`)
                    if (active)
                    {
                        instrument.surveyTLA = instrument.name.substr(0, 3);
                        instrument.link = "https://" + VM_EXTERNAL_WEB_URL + "/" + instrument.name + "?LayoutSet=CATI-Interviewer_Large";
                        instrument.fieldPeriod = Functions.field_period_to_text(instrument.name);
                        activeInstruments.push(instrument);
                    }                
                }));
                
                console.log("Retrieved active instruments, " + activeInstruments.length + " item/s");

                const surveys: Survey[] = _.chain(activeInstruments)
                    // Group the elements of Array based on `surveyTLA` property
                    .groupBy("surveyTLA")
                    // `key` is group's name (surveyTLA), `value` is the array of objects
                    .map((value: Instrument[], key: string) => ({survey: key, instruments: value}))
                    .value();
                return res.json(surveys);
            })
            .catch(function (error) {
                // handle error
                console.error("Failed to retrieve instrument list");
                console.error(error);
                return res.status(500).json(error);
            });
    });

    return instrumentRouter;
}

