import React from "react";
import { defineFeature, loadFeature } from "jest-cucumber";
import {cleanup, fireEvent, render, screen, waitFor} from "@testing-library/react";
import { act } from "react-dom/test-utils";
import { createMemoryHistory } from "history";
import { Router } from "react-router-dom";
import flushPromises from "../../tests/utils";


import App from "../../App";
import {survey_list_with_OPN_and_LMS_with_one_active_instrument_each} from "./API_Mock_Objects";
import {Survey} from "blaise-api-node-client";

const feature = loadFeature(
    "./src/features/CATI_Dashboard_Link.feature",
);


function mock_server_request(returnedStatus: number, returnedJSON: Survey[]) {
    global.fetch = jest.fn(() =>
        Promise.resolve({
            status: returnedStatus,
            json: () => Promise.resolve(returnedJSON),
        })
    ) as jest.Mock;
}

defineFeature(feature, test => {

    afterEach(() => {
        jest.clearAllMocks();
        cleanup();
        jest.resetModules();
    });

    beforeEach(() => {
        cleanup();
    });


    test("Following the Cati dashboard link takes a user to the case info page", ({ given, when, then }) => {
        given("I access the Telephone Operations Blaise Interface URL", async () => {
            mock_server_request(
                200,
                survey_list_with_OPN_and_LMS_with_one_active_instrument_each
            );

            const history = createMemoryHistory();
            render(
                <Router history={history}>
                    <App/>
                </Router>
            );
            await act(async () => {
                await flushPromises();
            });
        });

        when("I click the link to the CATI dashboard", async () => {
            fireEvent.click(screen.getByText(/Link to CATI dashboard/i));
            await act(async () => {
                await flushPromises();
            });
        });

        then("I arrive at the Case Info tab URL", async () => {
        await waitFor(() => {
            expect(window.location.pathname).toContain("/Blaise/CaseInfo");
    });
    });
});
});
