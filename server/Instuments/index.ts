import express, { Request, Response, Router } from "express";
import { Instrument, Survey } from "../../Interfaces";
import axios, { AxiosResponse } from "axios";
import _ from "lodash";
import { fieldPeriodToText } from "../Functions";
import AuthProvider from "../AuthProvider";
import { Logger } from "../Logger";

export default function InstrumentRouter(
    blaiseApiUrl: string,
    vmExternalWebUrl: string,
    bimsClientID: string,
    bimsApiUrl: string
): Router {
    "use strict";
    const instrumentRouter = express.Router();

    // An api endpoint that returns list of installed instruments
    instrumentRouter.get("/instruments", async (req: Request, res: Response) => {
        const log: Logger = req.log;

        log.debug("get list of items");

        const authProvider = new AuthProvider(bimsClientID, log);

        async function getToStartDate(instrument: Instrument) {
            const authHeader = await authProvider.getAuthHeader();

            const response: AxiosResponse = await axios.get(
            `${bimsApiUrl}/tostartdate/${instrument.name}`,
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

        async function getActiveTodayInstrument(instrument: Instrument) {
            const active = await activeToday(instrument);
            log.info(`Active today outputted (${ active }) for instrument (${ instrument.name }) type of (${ typeof active })`);
            if (!active) {
                return [];
            }
            instrument.surveyTLA = instrument.name.substr(0, 3);
            instrument.link = "https://" + vmExternalWebUrl + "/" + instrument.name + "?LayoutSet=CATI-Interviewer_Large";
            instrument.fieldPeriod = fieldPeriodToText(instrument.name);
            return [instrument];
        }

        try {
            const response: AxiosResponse = await axios.get("http://" + blaiseApiUrl + "/api/v2/cati/questionnaires");
            const allInstruments: Instrument[] = response.data;
            const activeInstruments: Instrument[] = _.flatten(await Promise.all(allInstruments.map(getActiveTodayInstrument)));

            log.info("Retrieved active instruments, " + activeInstruments.length + " item/s");

            const surveys: Survey[] = _.chain(activeInstruments)
                .groupBy("surveyTLA")
                .map((value: Instrument[], key: string) => ({ survey: key, instruments: value }))
                .value();

            res.json(surveys);
        }
        catch(error) {
            log.error("Failed to retrieve instrument list");
            log.error(error);
            res.status(500).json(error);
        }
    });

    return instrumentRouter;
}
