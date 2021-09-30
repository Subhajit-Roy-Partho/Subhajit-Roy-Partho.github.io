import { Button, makeStyles } from "@material-ui/core";
import React, { useState } from "react"
import Img from "gatsby-image"
import { graphql, useStaticQuery } from "gatsby"
import BackgroundImage from "gatsby-background-image";
import "./auth.css"
import { TextField } from "@material-ui/core";
// import Layout from "../components/layout"


const useStyle = makeStyles((theme)=>({
    root:{
        minHeight:"100vh",
        maxHeight: "100vh",
    },
    side:{display:"flex",
    flexDirection: 'column',
    paddingLeft:"8%",
    width: "55%",
    justifyContent:"flex-start",
    [theme.breakpoints.down("md")]:{
        width: "0%",
        visibility: 'hidden',
    },
    submitButton:{
        paddingBottom:"3vh"
    }
},
}))

export function onEnter(e){
    if(e.keyCode=== 13){
        console.log("value"+e.target.value);
    }

}



export default function Auth(){
    const classes = useStyle();
        const data = useStaticQuery(graphql`
            query {
                image1: file(relativePath: { eq: "img2.jpg" }) {
                ...squareImage
                }
                image2: file(relativePath: { eq: "google.png" }){
                    childImageSharp {
                        fluid(maxWidth: 2000) {
                          ...GatsbyImageSharpFluid
                        }
                    }
                }
            }
            `)
        const ImageData= data.image1.childImageSharp.fluid;
        const [email, setEmail] = useState("");
        const [password, setPassword] = useState("");
    return(
        <BackgroundImage fluid={ImageData} style={{minHeight: "100vh", maxHeight:"100vh", backgroundSize: "cover", backgroundRepeat: "no-repeat", alignItems: 'center', flexDirection:"row"}}>
            <div style={{display: 'flex', alignItems: 'center', backgroundColor: "transparent", height: "100vh", paddingTop:"3%", paddingLeft:"3%", paddingBottom:"3%"}}>
                <div style={{display: 'flex', backgroundColor: "white", height:"100%", width: "100%", borderRadius: "1.5%", padding: "3%", flexShrink:"20", justifyContent:"center", alignItems:"center", flexDirection:"column", overflowY:"scroll"}}>
                    <div style={{display:'flex', flexDirection:"column"}}>
                        <h3 style={{paddingBottom:"5vh"}}>Login with your Email</h3>
                        <h6>Email</h6>
                        <TextField label="Your E-mail*" onChange={(event)=>{setEmail(event.target.value)}}/>
                        <p style={{paddingTop:"10%"}}><h6>Password</h6></p>
                        <TextField label="Your Password*" onKeyDown={onEnter} type="password" style={{paddingBottom:"4vh"}} onChange={(event)=>{setPassword(event.target.value)}}/>
                        <div className={classes.submitButton}><Button variant="contained" color="primary" onClick={()=>{console.log("email is "+email); console.log("password is "+password)}}>Login</Button></div>
                        <div style={{margin:"10%"}}><h6>Or use other gateway</h6></div>
                        <Img fluid={data.image2.childImageSharp.fluid} style={{width: "10rem"}}/>
                    </div>
                </div>
                {/* <div style={{width:"12%"}}/> */}
                <div className={classes.side}>
                    <div style={{display:"flex",height: "80vh", justifyContent:"center", alignItems:"center"}}><h1 style={{color:"white"}}></h1></div>
                    <div style={{display: "flex",alignSelf: "flex-end",flexDirection:"row"}}><h9 style={{color:"white"}}>
                            <a href="https://www.pexels.com/photo/hot-air-ballons-in-the-sky-2325446/">Background Image by Francesco Ungaro, from PEXELS</a>
                        </h9>
                        </div>
                </div>

            </div>
        </BackgroundImage>
    )
}
