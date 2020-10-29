import React, {useEffect, useState} from 'react';
import Header from "./Components/Header";
import BetaBanner from "./Components/BetaBanner";
import ExternalLink from "./Components/ExternalLink";
import {DefaultErrorBoundary} from "./Components/DefaultErrorBoundary";
import {ErrorBoundary} from "./Components/ErrorBoundary";
import "./App.css";
import Footer from "./Components/Footer";
import ONSErrorPanel from "./Components/ONSErrorPanel";

interface ListItem {
    name: string
    link: string
    id: string
    status: string
    "server-park": string
    date: string
    "install-date": string
}

interface listError {
    error: boolean,
    message: string
}

interface window {
    VM_EXTERNAL_CLIENT_URL: string
    CATI_DASHBOARD_URL: string
}

function App() {

    let [externalClientUrl, setExternalClientUrl] = useState<string>("External URL should be here");
    let [externalCATIUrl, setExternalCATIUrl] = useState<string>("/Blaise");


    useEffect(function retrieveVariables() {
        setExternalClientUrl(process.env.NODE_ENV === 'development' ?
            process.env.REACT_APP_VM_EXTERNAL_CLIENT_URL || externalClientUrl : (window as any).VM_EXTERNAL_CLIENT_URL)
        setExternalCATIUrl(process.env.NODE_ENV === 'development' ?
            process.env.REACT_APP_CATI_DASHBOARD_URL || externalCATIUrl : (window as any).CATI_DASHBOARD_URL)
    }, [externalClientUrl, externalCATIUrl]);

    let [list, setList] = useState<ListItem[]>([]);
    let [listError, setListError] = useState<listError>({error: false, message: "Loading ..."});

    useEffect(() => {
        getList()
    }, []);

    function getList() {
        fetch('/api/instruments')
            .then((r: Response) => {
                if (r.status === 200) {
                    r.json()
                        .then((json: ListItem[]) => {
                                console.log("Set instrument list")
                                console.log(json)
                                setList(json)
                            setListError({error: false, message: ""});
                            }
                        ).catch(() => {
                        console.error("Unable to read json from response");
                        setListError({error: true, message: "Unable to load surveys"});
                    })
                } else {
                    console.error("Failed to retrieve instrument list, status " + r.status)
                    setListError({error: true, message: "Unable to load surveys"});
                }
            }).catch(() => {
                console.error("Failed to retrieve instrument list")
                setListError({error: true, message: "Unable to load surveys"});
            }
        )
    }


    return (
        <>
            <BetaBanner/>
            <Header title={"Blaise Survey Manager Lite"}/>
            <div id={"body"} className="page__container container">
                <main id="main-content" className="page__main">
                    <DefaultErrorBoundary>
                        <h1>Interviewing</h1>
                        {listError.error && <ONSErrorPanel/>}
                        <p className="u-mt-m">
                            <ExternalLink text={"Link to CATI dashboard"}
                                          link={externalCATIUrl}/>
                        </p>
                        <table id="basic-table" className="table ">
                            <caption className="table__caption">Active surveys table</caption>
                            <ErrorBoundary errorMessageText={"Unable to load survey table correctly"}>
                                <thead className="table__head">
                                <tr className="table__row">
                                    <th scope="col" className="table__header ">
                                        <span>Instrument</span>
                                    </th>
                                    <th scope="col" className="table__header ">
                                        <span>Date</span>
                                    </th>
                                    <th scope="col" className="table__header ">
                                        <span>Link to interview</span>
                                    </th>
                                </tr>
                                </thead>
                                <tbody className="table__body">
                                {
                                    list && list.length > 0
                                        ?
                                        list.map((item: ListItem) => {
                                            return (
                                                <tr className="table__row" key={item.id}>
                                                    <td className="table__cell ">
                                                        {item.name}
                                                    </td>
                                                    <td className="table__cell ">
                                                        {item.date}
                                                    </td>
                                                    <td className="table__cell ">
                                                        <ExternalLink text={"Interview"}
                                                                      link={item.link}
                                                                      ariaLabel={"Launch interview for instrument " + item.name + " " + item.date}/>
                                                    </td>
                                                </tr>
                                            )
                                        })
                                        :
                                        <tr>
                                            <td className="table__cell " colSpan={3}>
                                                {listError.message}
                                            </td>
                                        </tr>
                                }
                                </tbody>
                            </ErrorBoundary>
                        </table>
                    </DefaultErrorBoundary>
                </main>
            </div>
            <Footer external_client_url={externalClientUrl}/>
        </>
    );
}

export default App;
