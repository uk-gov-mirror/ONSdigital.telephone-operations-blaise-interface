import express, { Request, Response, Router } from "express";
import { Instrument, Survey } from "../../Interfaces";
import axios, { AxiosResponse } from "axios";
import _ from "lodash";
import { fieldPeriodToText } from "../Functions";
import AuthProvider from "../AuthProvider";
import { Logger } from "../Logger";

export default function InstrumentRouter(
    BLAISE_API_URL: string,
    VM_EXTERNAL_WEB_URL: string,
    BIMS_CLIENT_ID: string,
    BIMS_API_URL: string):
    Router {
    "use strict";
    const instrumentRouter = express.Router();

    // An api endpoint that returns list of installed instruments
    instrumentRouter.get("/instruments", async (req: Request, res: Response) => {
        const log: Logger = req.log;

        log.debug("get list of items");

        const authProvider = new AuthProvider(BIMS_CLIENT_ID, log);

        async function getToStartDate(instrument: Instrument) {
            const authHeader = await authProvider.getAuthHeader();

            const response: AxiosResponse = await axios.get(
            `${BIMS_API_URL}/tostartdate/${instrument.name}`,
            {
                headers: authHeader,
                validateStatus: function (status) { return status >= 200; }
            });

            log.debug(`The BIMS request responded with a status of ${response.status} and a body of ${response.data}`);

            return response.status == 200 && response.headers["content-type"] == "application/json" ? response.data.tostartdate : null;
        }

        async function activeToday(instrument: Instrument) {
            const telOpsStartDate = await getToStartDate(instrument);

            if (telOpsStartDate == null) {
                log.debug(`the instrument ${instrument.name} is live for TO (TO start date = Not set) (Active today = ${instrument.activeToday})`);
                return instrument.activeToday;
            }

            if (Date.parse(telOpsStartDate) <= Date.now()) {
                log.debug(`the instrument ${instrument.name} is live for TO (TO start date = ${telOpsStartDate}) (Active today = ${instrument.activeToday})`);
                return instrument.activeToday;
            }

            log.debug(`the instrument ${instrument.name} is not currently live for TO (TO start date = ${telOpsStartDate}) (Active today = ${instrument.activeToday})`);
            return false;
        }

        try {
            const response: AxiosResponse = await axios.get("http://" + BLAISE_API_URL + "/api/v2/cati/questionnaires");

            const allInstruments: Instrument[] = response.data;
            const activeInstruments: Instrument[] = [];
            // Add interviewing link and date of instrument to array objects
            await Promise.all(allInstruments.map(async function (instrument: Instrument) {
                const active = await activeToday(instrument);
                log.info(`Active today outputted (${ active }) for instrument (${ instrument.name }) type of (${ typeof active })`);
                if (active) {
                    instrument.surveyTLA = instrument.name.substr(0, 3);
                    instrument.link = "https://" + VM_EXTERNAL_WEB_URL + "/" + instrument.name + "?LayoutSet=CATI-Interviewer_Large";
                    instrument.fieldPeriod = fieldPeriodToText(instrument.name);
                    activeInstruments.push(instrument);
                }
            }));

            log.info("Retrieved active instruments, " + activeInstruments.length + " item/s");

            const surveys: Survey[] = _.chain(activeInstruments)
                // Group the elements of Array based on `surveyTLA` property
                .groupBy("surveyTLA")
                // `key` is group's name (surveyTLA), `value` is the array of objects
                .map((value: Instrument[], key: string) => ({ survey: key, instruments: value }))
                .value();

            res.json(surveys);
        }
        catch(error) {
            // handle error
            log.error("Failed to retrieve instrument list");
            log.error(error);
            res.status(500).json(error);
        }
    });

    return instrumentRouter;
}
