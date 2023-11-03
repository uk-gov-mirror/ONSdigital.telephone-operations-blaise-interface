
import React from "react";
import { defineFeature, loadFeature } from "jest-cucumber";
import {cleanup, fireEvent, render, screen, waitFor} from "@testing-library/react";
import { act } from "react-dom/test-utils";
import { createMemoryHistory } from "history";
import { Router } from "react-router-dom";
import flushPromises from "../../tests/utils";

import App from "../../App";

const feature = loadFeature(
    "./src/features/CATI_Dashboard_Link.feature",
);


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
