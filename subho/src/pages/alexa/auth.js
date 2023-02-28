import * as React from "react";


export default function Index(props){
    var string = props.location.search;
    string = string.split("?");
    return(
        <div>
            <h1>Developing</h1>
            <p>
                The userID is : {string[1]}
            </p>
        </div>
    )
}