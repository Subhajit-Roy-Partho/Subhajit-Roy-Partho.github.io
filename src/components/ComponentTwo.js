import React from "react";
import {makeStyles } from "@material-ui/core/styles"
import ImageCard from "./ImageCard";
import Place from "../../public/storage/static/places"
import useWindowPosition from "../hook/useWindowPosition";

const useStyles = makeStyles((theme)=>({
    root:{
        minHeight:"100vh",
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        margin: '0',
        minWidth: "100%",
        [theme.breakpoints.down("md")]:{
            flexDirection: "column",
        }
    }
}))

export default function(){
    const classes = useStyles();
    const checked = useWindowPosition("header");
    return(
        <div className={classes.root} id="place-to-visit">
            <ImageCard Place={Place.title="abc",Place.subheading="def"} checked={checked}/>
            <ImageCard checked = {checked}/>
        </div>
    )
}