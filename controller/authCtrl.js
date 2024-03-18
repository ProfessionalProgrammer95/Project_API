const { StatusCodes } = require("http-status-codes")
const UserModel = require('../model/user')
const bcryptjs = require('bcryptjs')
const generateToken = require('../utility/token')
const mailsend = require('../config/mail')


//register
const register = async(req,res) => {
    try{
        //read the data
        const {name, email, mobile,password,role} = req.body

        //check wheathe user email and mobile registered or not
        let extEmail = await UserModel.findOne({email})
            if (extEmail)
                return res.status(StatusCodes.CONFLICT).json({status:false, msg:`${email} is already exists`})
        let extMobile = await UserModel.findOne({mobile})
            if (extMobile)
                return res.status(StatusCodes.CONFLICT).json({status:false, msg:`${mobile} is already exists`})
        
        //password encryption
        let encPass = await bcryptjs.hash(password,10)
        // salt => encrypted data (alapha numerical)

        //method to store in db
        let newUser = await UserModel.create ({
            name,
            email,
            mobile,
            password: encPass,
            role
        }) 

        //email
        let template = `<div>
                            <h1> Hi ${newUser.name},</h1>
                            <p> You have Successfully Registered at ${new Date().toString()}</p>
                            <h3 style="padding: '10px'; background:'skyblue'">
                                <strong>Username </strong> : <span style="color:'white';">
                                ${newUser.email}</span> <br/>
                                <strong>Username </strong> : <span style="color:'white';">
                                ${password}</span>
                            </h3>
                        </div>`;
        let emailRes = await mailsend(newUser.email,"Registration Information",template)

        //final response
        res.status(StatusCodes.ACCEPTED).json({status:true, msg: "User Registered successfully", user: newUser, emailRes})
    } catch (err) {
        return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({status: false, msg:err.message})
    }
}


//login
const login = async(req,res) => {
    try{
        const {email , password} =req.body

        //to check email is exists or not
        let extEmail = await UserModel.findOne({email})
        if(!extEmail)
            return res.status(StatusCode.NOT_FOUND).json({status:false, msg:`${email} id doesnt exists`})
        
        // validate the password
        let passVal = await bcryptjs.compare(password,extEmail.password)
            if(!passVal)
                return res.status(StatusCodes.UNAUTHORIZED).json({status:false, msg:`password are not matched`})


        //generate auth token
        let authToken = await generateToken(extEmail._id)

        //send mail
        let template = `<div>
                            <h1> Hi ${extEmail.name},</h1>
                            <p>You have Successfully login into profile at ${new Date().toString()}
                            </p>
                        </div>`
        let emailRes = await mailsend(extEmail.email,"Login Information",template)

        //store token in cookies
        res.cookie("authToken", authToken, {
            httpOnly:true,
            signed:true,
            maxAge: 1 * 24 * 60 * 60 * 1000
        })

        res.status(StatusCodes.OK).json({msg :"login Success", token:authToken, user:extEmail, emailRes})
    } catch (err) {
        return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({status: false, msg:err.message})
    }
}

//logout

const logout = async(req,res) => {
    try{
        res.clearCookie("authToken", {path:`/`})

        res.status(StatusCodes.OK).json({msg :"logout Successfully"})
    } catch (err) {
        return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({status: false, msg:err.message})
    }
}

//verify user authentication
const verifyUser = async(req,res) => {
    try{

        res.json({msg :"verify user"})
    } catch (err) {
        return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({status: false, msg:err.message})
    }
}

module.exports = {register, login, logout ,verifyUser}
