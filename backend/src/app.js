import express from "express";
import cookieParser from "cookie-parser";
import cors from "cors";

const app = express()

app.use(cors({
    origin: process.env.CORS_ORIGIN || "http://localhost:5173",
    credentials: true
}))

//APP level middlewares
app.use(express.json())
app.use(cookieParser())

//import routes
import authRoute from "./routes/auth.route.js"
import adminRoute from "./routes/admin.route.js"
import mechanicRoute from "./routes/mechanic.route.js"
import customerRoute from "./routes/customer.route.js"

//routes
app.use("/api/auth", authRoute)
app.use("/api/admin", adminRoute)
app.use("/api/mechanic", mechanicRoute)
app.use("/api/customer", customerRoute)



export default app
