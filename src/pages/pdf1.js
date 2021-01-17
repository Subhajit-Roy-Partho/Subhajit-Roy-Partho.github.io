import React, { useState } from "react"
import {Document, Page, pdfjs} from "react-pdf"

// import Layout from "../components/layout"
import SEO from "../components/seo"
import gate from "../../public/storage/pdf/GATE/Bio2020.pdf"
import "./pdftest.css"
import {Button, h3} from "bootstrap-react"
import {
    useWindowSize,
  } from '@react-hook/window-size'

pdfjs.GlobalWorkerOptions.workerSrc=`//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.js`;


export default function Pdf1(){
    const [width] = useWindowSize({fps:60});
    const [pageNumber,setPageNumber] = useState(1);
    const [maxPage,setMaxPage] = useState(20);
    function nextPage(){
        if(pageNumber !== maxPage){
            setPageNumber(pageNumber+1);
        }
    }
    function prevPage(){
        if(pageNumber !== 1){
            setPageNumber(pageNumber-1);
        }
    }
    function onPDFLoad(Page){
        setMaxPage(Page);
    }

    return(
        <>
        <div
    style={{
    //   margin: `0 auto`,
        maxWidth: 960,
        padding: `0 1.0875rem 1.45rem`,
        marginTop: '4em',
    }}>
    <>
        <SEO title="GATE Biotechnology 2020" />           

        <div className="button" style={{display: "flex"}}>
            <Button onClick={()=>prevPage()} className="prevButton mr-3">Previous  {pageNumber-1}</Button>
            <h3>{pageNumber} of {maxPage}</h3>
            <Button onClick={()=>nextPage()} className="nextButton ml-3" >Next   {pageNumber+1}</Button>    
        </div>
        <div style={{display: "flex" ,minWidth: "100%"}}>
        <Document file={gate} onContextMenu={(e) => e.preventDefault()} className="pdf-document" onLoadSuccess={(pdf)=>onPDFLoad(pdf.numPages)} renderMode="canvas`">
            <Page pageNumber={pageNumber} width={width}/>
        </Document>
        </div>
        <div style={{display:"flex"}}>
            <Button onClick={()=>nextPage()} className="buttonLast"> <h2>Next</h2></Button>
        </div>
    </>
</div>
</>
    );
}