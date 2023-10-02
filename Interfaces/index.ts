import { Questionnaire } from "blaise-api-node-client"

interface Survey {
    questionnaires: Questionnaire[]
    survey: string
}

export type { Survey};
