import React, {useEffect, useState} from 'react';
import Header from "./Components/Header";
import BetaBanner from "./Components/BetaBanner";
import ExternalLink from "./Components/ExternalLink";
import {DefaultErrorBoundary} from "./Components/DefaultErrorBoundary";
import {ErrorBoundary} from "./Components/ErrorBoundary";
import {field_period_to_text} from "./Functions";
import "./App.css";
import Footer from "./Components/Footer";

interface ListItem {
    name: string
    link: string
    id: string
    status: string
    "server-park": string
}

interface urlData {
    external_client_url: string
    external_cati_dashboard_web_url: string
}

function App() {

    useEffect(() => {
        getList()
        getUrlData()
    }, []);


    let [list, setList] = useState<ListItem[]>([]);
    let [urlData, setUrlData] = useState<urlData>({external_client_url: "", external_cati_dashboard_web_url: ""});

    function getList() {
        fetch('/api/getList')
            .then((r: Response) => (
                    r.json()
                        .then((json: ListItem[]) => {
                                console.log("Set List")
                                console.log(json)
                                setList(json)
                            }
                        ).catch((error: any) => (
                        console.error("Unable to read json from response")
                    ))
                ).catch((error: any) => (
                    console.error("Failed to call api /api/getList" + error)
                )
                )
            )
    }

    function getUrlData() {
        fetch('/api/url_info')
            .then((r: Response) => (
                    r.json()
                        .then((json: urlData) => {
                                console.log("Set List")
                                console.log(json)
                                setUrlData(json)
                            }
                        ).catch((error: any) => (
                        console.error("Unable to read json from response")
                    ))
                ).catch((error: any) => (
                    console.error("Failed to call api /api/getList" + error)
                )
                )
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
                        <p>
                            <ExternalLink text={"Link to CATI dashboard"}
                                          link={urlData.external_cati_dashboard_web_url}/>
                        </p>
                        <table id="basic-table" className="table ">
                            <caption className="table__caption">Active surveys</caption>
                            <ErrorBoundary errorMessageText={"Unable to load table correctly"}>
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
                                            let date = field_period_to_text(item.name)
                                            return (
                                                <tr className="table__row" key={item.id}>
                                                    <td className="table__cell ">
                                                        {item.name}
                                                    </td>
                                                    <td className="table__cell ">
                                                        {date}
                                                    </td>
                                                    <td className="table__cell ">
                                                        <ExternalLink text={"Interview"}
                                                                      link={item.link}
                                                                      ariaLabel={"Launch interview for instrument " + item.name + " " + date}/>
                                                    </td>
                                                </tr>
                                            )
                                        })
                                        :
                                        <tr>
                                            <td className="table__cell " colSpan={3}>
                                                No items found
                                            </td>
                                        </tr>
                                }
                                </tbody>
                            </ErrorBoundary>
                        </table>
                    </DefaultErrorBoundary>
                </main>
            </div>
            <Footer external_client_url={urlData.external_client_url}/>
        </>
    );
}

export default App;
