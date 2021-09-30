import React from "react"
import { graphql, useStaticQuery} from "gatsby"
import Img from "gatsby-image";

export const squareImage = graphql`
        fragment squareImage on File {
            childImageSharp {
            fluid(maxWidth: 2000) {
                ...GatsbyImageSharpFluid
            }
            }
        }
        `
