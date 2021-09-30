import React, { Component } from "react"
import { Link } from "gatsby"
// import{ init, emailjs } from 'emailjs-com';
// init("user_0TXlbY688f5EYF2wWN0fj");

import Layout from "../components/layout"
import SEO from "../components/seo"
import "./page2.css"

export default class TestPage extends Component{
    constructor(){
        super();
        this.state = {
            data: ''
        }
    }
    componentDidMount() {
        // Simple GET request using fetch
        fetch('https://us-central1-edusite-cc257.cloudfunctions.net/app')
            .then(response => response.json())
            .then((data2) => this.setState({data: data2}))
            .catch(function(error){
                console.log(error);
            });
        // var templateParams = {
        //     email: 'myself.parthamondal1998@gmail.com'
        // };
    //     emailjs.send('service_4jk45iu', 'template_xgfv3rt', templateParams)
    // .then(function(response) {
    //    console.log('SUCCESS!', response.status, response.text);
    // }, function(error) {
    //    console.log('FAILED...', error);
    // });
            
    }
    render(){
        return(
            <div
        style={{
          margin: `0 auto`,
          maxWidth: 960,
          padding: `0 1.0875rem 1.45rem`,
          marginTop: '4em',
        }}>
  <Layout>
    <SEO title="Test Page" />
    
    <h1>Hi from the second page</h1>
    <p>Welcome to page 2</p>
    <p>{this.state.data}</p>
    {console.log(this.state.data)}
        
    <Link to="/">Go back to the homepage</Link>
  </Layout>
  </div>
        );
    };
}
