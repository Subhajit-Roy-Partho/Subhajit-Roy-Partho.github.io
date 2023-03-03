import axios from "axios";
import { graphql,navigate } from "gatsby";
import * as React from "react";
import { Button } from "theme-ui";

export default function Access(props){
    React.useEffect(()=>{
        localStorage.getItem('state')
    })
    var string = props.location.search.split("&");
    const code = string[0].substring(6);
    const state = string[2].substring(6);
    const originalState = localStorage.state.substring(1,localStorage.state.length-1);
    const clientId = props.data.site.siteMetadata.amazonClientId;
    const clientSecret = props.data.site.siteMetadata.amazonClientSecret;

    // if (state === originalState){
    //     console.log("sane");
    // }else{
    //     navigate('/oauth/landing')
    // }
    function trigger(){
        axios.post('https://api.amazon.com//auth/o2/token',{
            grant_type:'authorization_code',
            code: code,
            client_id: clientId,
            client_secret: clientSecret,
            redirect_uri: 'https://subhajit-roy-partho.netlify.app/alexa/client'
            // code_verifier=5CFCAiZC0g0OA-jmBmmjTBZiyPCQsnq_2q5k9fD-aAY
        }).then(function(response){
            console.log(response);
        }).catch(function(error){
            console.log(error);
        })
    }
    return(
        <div>
            {console.log()}
            <Button onClick={()=>{trigger()}}>Something</Button>
        </div>
    )
}

export const query = graphql`
query Amazon2{
    site {
      siteMetadata {
        amazonClientId
        amazonClientSecret
      }
    }
  }`