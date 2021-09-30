import React from "react"
import { Link } from "gatsby"

import Layout from "../components/layout"
import SEO from "../components/seo"
import "./page2.css"
const BlogPage = () => (
  <div
        style={{
          margin: `0 auto`,
          maxWidth: 960,
          padding: `0 1.0875rem 1.45rem`,
          marginTop: '4em',
        }}>
  <Layout>
    <SEO title="Blog Page" />

    <h1>This is blog page</h1>
    <p>It is working</p>
    <p><Link to="/blog/my-first-post">Test Blog </Link></p>
    <Link to="/">Go back to the homepage</Link>

  </Layout>
  </div>
)

export default BlogPage
