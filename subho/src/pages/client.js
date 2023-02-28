import * as React from "react";


export default function Index(props){
    var string = props.location.search.split("?");
    // string = string.split("?");
    return(
        <div>
            <h1>Developing</h1>
            <p>
                The userID is : {string[1]}
            </p>
        </div>
    )
}