import express, { Request, Response, Router } from "express";
import BlaiseApiClient,  { Questionnaire } from "blaise-api-node-client";
import { Survey } from "../../Interfaces"
import axios, { AxiosResponse } from "axios";
import _ from "lodash";
import { fieldPeriodToText } from "../Functions";
import AuthProvider from "../AuthProvider";
import { Logger } from "../Logger";

function groupBySurvey(activeInstruments: Questionnaire[]) {
    return _.chain(activeInstruments)
        .groupBy("surveyTLA")
        .map((value: Questionnaire[], key: string) => ({ survey: key, questionnaires: value }))
        .value();
}

export default function InstrumentRouter(
    vmExternalWebUrl: string,
    bimsClientID: string,
    bimsApiUrl: string,
    blaiseApiClient: BlaiseApiClient
): Router {
    "use strict";
    const instrumentRouter = express.Router();

    instrumentRouter.get("/instruments", async (req: Request, res: Response) => {
        const log: Logger = req.log;

        log.debug("get list of items");

        const authProvider: AuthProvider = new AuthProvider(bimsClientID, log);

        async function getToStartDate(questionnaire: Questionnaire) {
            const authHeader = await authProvider.getAuthHeader();
            const response: AxiosResponse = await axios.get(
                `${bimsApiUrl}/tostartdate/${questionnaire.name}`,
                {
                    headers: authHeader,
                    validateStatus: function (status) { return status >= 200; }
                });

            const logMessage = `The BIMS request responded with a status of ${ response.status } and a body of ${ response.data }`;

            if (response.status !== 200) {
                log.error(logMessage);
                return null;
            }

            log.debug(logMessage);

            return response.headers["content-type"] == "application/json" ? response.data.tostartdate : null;
        }

        
        function addExtraInstrumentFields(questionnaire: Questionnaire): Questionnaire {
            return {
                ...questionnaire,
                surveyTLA: questionnaire.name.substr(0, 3),
                link: `https://${ vmExternalWebUrl }/${ questionnaire.name }?LayoutSet=CATI-Interviewer_Large`,
                fieldPeriod: fieldPeriodToText(questionnaire.name),
            };
        }
        

        async function activeToday(questionnaire: Questionnaire) {
            const telOpsStartDate = await getToStartDate(questionnaire);

            if (telOpsStartDate == null) {
                log.debug(`the instrument ${questionnaire.name} is live for TO (TO start date = Not set) (Active today = ${questionnaire.activeToday})`);
                return questionnaire.activeToday;
            }

            if (Date.parse(telOpsStartDate) <= Date.now()) {
                log.debug(`the instrument ${questionnaire.name} is live for TO (TO start date = ${telOpsStartDate}) (Active today = ${questionnaire.activeToday})`);
                return questionnaire.activeToday;
            }

            log.debug(`the instrument ${questionnaire.name} is not currently live for TO (TO start date = ${telOpsStartDate}) (Active today = ${questionnaire.activeToday})`);
            return false;
        }

        async function getActiveTodayQuestionnaire(questionnaire: Questionnaire): Promise<Questionnaire | null> {
            const active = await activeToday(questionnaire);
            log.info(`Active today outputted (${active}) for instrument (${questionnaire.name}) type of (${typeof active})`);
            
            return active ? questionnaire : null;
        }

        async function getActiveTodayQuestionnaires(allallQuestionnaires: Questionnaire[]): Promise<Questionnaire[]> {
            const activeQuestionnaires = await Promise.all(allallQuestionnaires.map(getActiveTodayQuestionnaire));
            const filteredQuestionnaires = activeQuestionnaires.filter((result) => result !== null) as Questionnaire[];
            return (filteredQuestionnaires);
                
        }

        async function getAllQuestionnaires(): Promise<Questionnaire[]> {
           return await blaiseApiClient.getAllQuestionnairesWithCatiData();
        }

        async function getSurveys(): Promise<Survey[]> {
            const allQuestionnaires = await getAllQuestionnaires();
            const activeQuestionnaires = await getActiveTodayQuestionnaires(allQuestionnaires);
            log.info(`Retrieved active instruments, ${activeQuestionnaires.length} item/s`);
             return groupBySurvey(activeQuestionnaires.map(addExtraInstrumentFields));
        }

        try {
            res.json(await getSurveys());
        } catch(error) {
            log.error("Failed to retrieve instrument list");
            log.error(error);
            res.status(500).json(error);
        }
    });

    return instrumentRouter;
}
