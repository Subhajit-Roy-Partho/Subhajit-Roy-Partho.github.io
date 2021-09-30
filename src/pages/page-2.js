import React from "react"
import { Link } from "gatsby"

import Layout from "../components/layout"
import SEO from "../components/seo"
import "./page2.css"
const SecondPage = () => (
  <div
        style={{
          margin: `0 auto`,
          maxWidth: 960,
          padding: `0 1.0875rem 1.45rem`,
          marginTop: '4em',
        }}>
  <Layout>
    <SEO title="Page two" />
    
    <h1>Hi from the second page</h1>
    <p>Welcome to page 2</p>
    
    <p><iframe title="youtube" 
        width="560" 
        height="315" 
        src="https://www.youtube-nocookie.com/embed/aqz-KE-bpKQ" 
        frameborder="0" 
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
        allowfullscreen="allowfullscreen"
        mozallowfullscreen="mozallowfullscreen" 
        msallowfullscreen="msallowfullscreen" 
        oallowfullscreen="oallowfullscreen" 
        webkitallowfullscreen="webkitallowfullscreen"></iframe></p>
        
    <Link to="/">Go back to the homepage</Link>
    
  </Layout>
  </div>
)

export default SecondPage
