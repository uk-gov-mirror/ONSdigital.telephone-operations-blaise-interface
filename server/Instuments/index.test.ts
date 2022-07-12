import express from "express";
import supertest from "supertest";
import MockAdapter from "axios-mock-adapter";

import InstrumentRouter from "./index";
import axios from "axios";
import getGoogleAuthToken from "../AuthProvider/GoogleTokenProvider";

jest.mock("../AuthProvider/GoogleTokenProvider");

describe("InstrumentRouter", () => {
    const app = express();
    const mockHttp = new MockAdapter(axios);

    app.use(InstrumentRouter(
        "blaise.com",
        "vm.com",
        "bims-id",
        "http://bims.com"
    ));

    const request = supertest(app);

    const questionnaire = {
        installDate: "2022-07-12",
        name: "QUESTIONNAIRE1",
        serverParkName: "example-park",
    };

    const returnedInstrument = {
        ...questionnaire,
        fieldPeriod: "Field period unknown",
        link: "https://vm.com/QUESTIONNAIRE1?LayoutSet=CATI-Interviewer_Large",
        surveyTLA: "QUE",
    };

    const today = new Date();

    const tomorrow = new Date();
    tomorrow.setDate(today.getDate() + 1);

    const yesterday = new Date();
    yesterday.setDate(today.getDate() - 1);

    it("returns 500 when questionnaires endpoint errors", async () => {
        mockHttp.onGet("http://blaise.com/api/v2/cati/questionnaires").reply(500, {});
        const response = await request.get("/instruments");
        expect(response.status).toBe(500);
    });

    it("returns 500 when questionnaires endpoint times out", async () => {
        mockHttp.onGet("http://blaise.com/api/v2/cati/questionnaires").timeout();
        const response = await request.get("/instruments");
        expect(response.status).toBe(500);
    });

    it("sends the auth header to BIMS", async () => {
        let sentHeaders;
        (getGoogleAuthToken as jest.Mock).mockImplementation(() => Promise.resolve("example-token"));
        mockHttp
            .onGet("http://blaise.com/api/v2/cati/questionnaires")
            .reply(200, [{ ...questionnaire, activeToday: false }])
            .onGet("http://bims.com/tostartdate/QUESTIONNAIRE1")
            .reply(({ headers }) => {
                sentHeaders = headers;
                return [200, { tostartdate: today.toISOString() }];
            });
        await request.get("/instruments");
        expect(sentHeaders).toHaveProperty("Authorization", "Bearer example-token");
    });

    it("returns the instrument when tostartdate errors and questionnaire is active today", async () => {
        mockHttp
            .onGet("http://blaise.com/api/v2/cati/questionnaires")
            .reply(200, [{ ...questionnaire, activeToday: true }])
            .onGet("http://bims.com/tostartdate/QUESTIONNAIRE1")
            .reply(500);
        const response = await request.get("/instruments");
        expect(response.status).toBe(200);
        expect(response.body).toEqual([
            {
                instruments: [{ ...returnedInstrument, activeToday: true }],
                survey: "QUE"
            }
        ]);
    });

    it("does not return the instrument when tostartdate errors questionnaire is not active today", async () => {
        mockHttp
            .onGet("http://blaise.com/api/v2/cati/questionnaires")
            .reply(200, [{ ...questionnaire, activeToday: false }])
            .onGet("http://bims.com/tostartdate/QUESTIONNAIRE1")
            .reply(500);
        const response = await request.get("/instruments");
        expect(response.status).toBe(200);
        expect(response.body).toEqual([]);
    });

    it("returns the instrument when tostartdate response type is not json and questionnaire is active today", async () => {
        mockHttp
            .onGet("http://blaise.com/api/v2/cati/questionnaires")
            .reply(200, [{ ...questionnaire, activeToday: true }])
            .onGet("http://bims.com/tostartdate/QUESTIONNAIRE1")
            .reply(200, {}, { "content-type": "text/html" });
        const response = await request.get("/instruments");
        expect(response.status).toBe(200);
        expect(response.body).toEqual([
            {
                instruments: [{ ...returnedInstrument, activeToday: true }],
                survey: "QUE"
            }
        ]);
    });

    // today

    it("returns the instrument when tostartdate is today and active today", async () => {
        mockHttp
            .onGet("http://blaise.com/api/v2/cati/questionnaires")
            .reply(200, [{ ...questionnaire, activeToday: true }])
            .onGet("http://bims.com/tostartdate/QUESTIONNAIRE1")
            .reply(200, { tostartdate: today.toISOString() }, { "content-type": "application/json" });
        const response = await request.get("/instruments");
        expect(response.status).toBe(200);
        expect(response.body).toEqual([
            {
                instruments: [{ ...returnedInstrument, activeToday: true }],
                survey: "QUE"
            }
        ]);
    });

    it("does not return the instrument when tostartdate is today and not active today", async () => {
        mockHttp
            .onGet("http://blaise.com/api/v2/cati/questionnaires")
            .reply(200, [{ ...questionnaire, activeToday: false }])
            .onGet("http://bims.com/tostartdate/QUESTIONNAIRE1")
            .reply(200, { tostartdate: today.toISOString() }, { "content-type": "application/json" });
        const response = await request.get("/instruments");
        expect(response.status).toBe(200);
        expect(response.body).toEqual([]);
    });

    // tomorrow

    it("does not return the instrument when tostartdate is tomorrow and active today", async () => {
        mockHttp
            .onGet("http://blaise.com/api/v2/cati/questionnaires")
            .reply(200, [{ ...questionnaire, activeToday: true }])
            .onGet("http://bims.com/tostartdate/QUESTIONNAIRE1")
            .reply(200, { tostartdate: tomorrow.toISOString() }, { "content-type": "application/json" });
        const response = await request.get("/instruments");
        expect(response.status).toBe(200);
        expect(response.body).toEqual([]);
    });

    it("does not return the instrument when tostartdate is tomorrow and not active today", async () => {
        mockHttp
            .onGet("http://blaise.com/api/v2/cati/questionnaires")
            .reply(200, [{ ...questionnaire, activeToday: false }])
            .onGet("http://bims.com/tostartdate/QUESTIONNAIRE1")
            .reply(200, { tostartdate: tomorrow.toISOString() }, { "content-type": "application/json" });
        const response = await request.get("/instruments");
        expect(response.status).toBe(200);
        expect(response.body).toEqual([]);
    });

    // yesterday - both

    it("returns the instrument when tostartdate is yesterday and active today", async () => {
        mockHttp
            .onGet("http://blaise.com/api/v2/cati/questionnaires")
            .reply(200, [{ ...questionnaire, activeToday: true }])
            .onGet("http://bims.com/tostartdate/QUESTIONNAIRE1")
            .reply(200, { tostartdate: today.toISOString() }, { "content-type": "application/json" });
        const response = await request.get("/instruments");
        expect(response.status).toBe(200);
        expect(response.body).toEqual([
            {
                instruments: [{ ...returnedInstrument, activeToday: true }],
                survey: "QUE"
            }
        ]);
    });

    it("does not return the instrument when tostartdate is yesterday and not active today", async () => {
        mockHttp
            .onGet("http://blaise.com/api/v2/cati/questionnaires")
            .reply(200, [{ ...questionnaire, activeToday: false }])
            .onGet("http://bims.com/tostartdate/QUESTIONNAIRE1")
            .reply(200, { tostartdate: today.toISOString() }, { "content-type": "application/json" });
        const response = await request.get("/instruments");
        expect(response.status).toBe(200);
        expect(response.body).toEqual([]);
    });

    it("sets the field period from the number in the questionnaire name", async () => {
        mockHttp
            .onGet("http://blaise.com/api/v2/cati/questionnaires")
            .reply(200, [{ ...questionnaire, name: "XXXXX05", activeToday: true }])
            .onGet("http://bims.com/tostartdate/QUESTIONNAIRE1")
            .reply(200, { tostartdate: today.toISOString() }, { "content-type": "application/json" });
        const response = await request.get("/instruments");
        expect(response.status).toBe(200);
        expect(response.body).toEqual([
            {
                instruments: [{
                    activeToday: true,
                    fieldPeriod: "May 20XX",
                    installDate: "2022-07-12",
                    link: "https://vm.com/XXXXX05?LayoutSet=CATI-Interviewer_Large",
                    name: "XXXXX05",
                    serverParkName: "example-park",
                    surveyTLA: "XXX",
                }],
                survey: "XXX"
            }
        ]);
    });
});
