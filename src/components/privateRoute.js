import React from "react"
import { navigate } from "gatsby"
import FireLogin from "../service/fireLogin";

const PrivateRoute = ({ component: Component, location, ...rest }) => {
  if (!FireLogin() && location.pathname !== `/app/login`) {
    navigate("/app/login")
    return null
  }
  return <Component {...rest} />
}
export default PrivateRoute