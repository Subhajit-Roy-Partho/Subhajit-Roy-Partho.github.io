import React from "react";

const Layout = ({ placeholder, children }) => {
    return (
        <React.Fragment>
            {/* <Head />
            <Navbar
                placeholder={placeholder === undefined ? true : placeholder}
            /> */}
            <div className="wrapper">{children}</div>
            {/* <Footer /> */}
        </React.Fragment>
    );
};