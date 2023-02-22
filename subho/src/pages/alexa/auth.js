import * as React from "react";


export default function Index(props){
    var string = props.location.search;
    string = string.split("?");
    var userId = string[1].substring(6);
    // var data = string[2].split("data=").splice(1);
    console.log(userId);
    return(
        <div>
            <h1>Developing</h1>
            <p>
                The userID is : {userId}
            </p>
            {/* <p>
                The Data is: {data}
            </p> */}
        </div>
    )
}