import React from "react"
import { Component } from "react"
import Layout from "../components/layout"
import Login from "../components/login"
import Signup from "../components/signup"
// import firebase from "../components/fire"
import {FireSignOut, FireCheck} from "../service/fireLogin"
import {Button} from "react-bootstrap"

export default class authPage extends Component{
    constructor(props){
        super(props);
        this.state={
            check: 0,
        }
        this.handlerLogin= this.handlerLogin.bind(this);
    }
    onSignOut(){
        FireSignOut()
        this.setState({check:1})
    }

    handlerLogin(){
        this.setState({check:2})
    }

    checkFire(){
        if(FireCheck()===true){
            console.log("True")
        }else{
            console.log("False")
        }
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
                            <h1>This is working</h1>
                            <Signup />
                            <p/>
                            <p/>
                            <br/>
                            <Login action={this.handlerLogin}/>
                            <p/>
                            <p/>
                            <Button onClick={()=>this.onSignOut()}>Sign Out</Button>
                            <Button onClick={()=>this.checkFire()}> Check </Button>
                            <p>
                                {(this.state.check === 1)?(
                                    <>
                                    Successfully Loged out
                                    </>
                                ):(this.state.check === 2)?(
                                    <>
                                    Successfully Loged in
                                    </>
                                ):null}
                            </p>
                        </Layout>
                    </div>
        )
    }
}