import React from "react";
import {makeStyles } from "@material-ui/core/styles"
import ImageCard from "./ImageCard";

const useStyles = makeStyles((theme)=>({
    root:{
        height:"100vh"
    }
}))

export default function(){
    const classes = useStyles();
    return(
        <div className={classes.root}>
            <ImageCard/>
        </div>
    )
}