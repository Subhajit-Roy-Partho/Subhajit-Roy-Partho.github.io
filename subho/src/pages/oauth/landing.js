import { graphql, navigate } from "gatsby";
import * as React from "react";
import { MDBRipple } from 'mdb-react-ui-kit';
import sha256 from 'crypto-js/sha256';
import Base64 from 'crypto-js/enc-base64';

export default function Landing({data}){
  function makeid(length) {
    let result = '';
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    const charactersLength = characters.length;
    let counter = 0;
    while (counter < length) {
      result += characters.charAt(Math.floor(Math.random() * charactersLength));
      counter += 1;
    }
    return result;
  };
  const [state,setState]=React.useState("");
  const [challange,setChallange] =React.useState("");
  const [count,setCount]= React.useState(0);


  if (count ==0 ){
    setState(makeid(30));
    setChallange(Base64.stringify(sha256(state)));
    setCount(1);
  }
  if (count ==0 ){
    setState(makeid(30));
    setChallange(Base64.stringify(sha256(state)));
    setCount(1);
  }
  
  if (typeof window != "undefined"){
    React.useEffect(()=>{
      localStorage.setItem("state",JSON.stringify(state));
      localStorage.setItem("challange",JSON.stringify(challange));
      });
    }

  // state = String(localStorage.state).substring(1,String(localStorage.state).length-1);
  // challange = String(localStorage.challange).substring(1,1,String(localStorage.challange).length-1);
  function amazonClick(){
      console.log(state,challange,data.site.siteMetadata.amazonClientId);
    navigate(`https://www.amazon.com/ap/oa?client_id=`+
    data.site.siteMetadata.amazonClientId
    +`&scope=profile&response_type=code&state=`+state+`&redirect_uri=https://subhajit-roy-partho.netlify.app/oauth/access&code_challenge=`+challange+`&code_challenge_method=S256`
    )}
  return(
      <div>
          <MDBRipple
            className='bg-image hover-overlay shadow-1-strong rounded'
            rippleTag='div'
            rippleColor='light'
          >
            <img src="https://images-na.ssl-images-amazon.com/images/G/01/lwa/btnLWA_drkgry_195x46.png" onClick={()=>{amazonClick()}} />
            <a href='#!'>
              <div className='mask' style={{ backgroundColor: 'rgba(251, 251, 251, 0.2)' }}></div>
            </a>
          </MDBRipple>
      </div>
  )
}

export const query = graphql`
query Amazon{
    site {
      siteMetadata {
        amazonClientId
      }
    }
  }`