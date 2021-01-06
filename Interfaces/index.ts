interface Instrument {
    installDate: string
    name: string
    expired: boolean
    serverParkName: string
    activeToday: boolean
    surveyDays: string[]
    link: string
    fieldPeriod: string
    surveyTLA: string
}

interface Survey {
    instruments: Instrument[]
    survey_name: string
}

export type {Instrument, Survey};
