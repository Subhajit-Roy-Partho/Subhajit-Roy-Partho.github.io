import React from "react"
import { Router } from "@reach/router"
import Layout from "../components/layout"
import Profile from "../components/profile"
import Auth from "./auth"
import PrivateRoute from "../components/privateRoute"
const App = () => (
  <Layout>
    <Router>
      <PrivateRoute path="/app/profile" component={Profile} />
      <Auth path="/app/login"/>
    </Router>
  </Layout>
)
export default App