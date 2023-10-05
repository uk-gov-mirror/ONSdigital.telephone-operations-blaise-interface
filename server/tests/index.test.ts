import supertest from "supertest";
import { IMock, Mock, It } from 'typemoq';
import BlaiseApiClient from "blaise-api-node-client";
import nodeServer from "../server";

const blaiseApiMock: IMock<BlaiseApiClient> = Mock.ofType(BlaiseApiClient);

const app = nodeServer(blaiseApiMock.object);

const request = supertest(app);

describe("Test Heath Endpoint", () => {
    it("should return a 200 status and json message", async () => {
        try {
            const response = await request.get("/tobi-ui/version/health");

            expect(response.statusCode).toEqual(200);
            expect(response.body).toStrictEqual({healthy: true});
        } catch (error) {
            console.error(error);
        }
    });
});