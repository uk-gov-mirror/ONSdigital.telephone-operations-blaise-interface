import React from 'react';

function ONSErrorPanel() {
    return (
        <>
            <div className="panel panel--error panel--simple">
                <div className="panel__body">
                    <p>
                        Blaise Survey Manager is unable to verify currently active surveys.
                        <br/>
                        Try reloading the page.
                    </p>
                    <p>
                        If you are still experiencing problems <a href="https://ons.service-now.com/">report this issue</a> to Service Desk.
                    </p>
                </div>
            </div>
        </>
    );
}

export default ONSErrorPanel;
