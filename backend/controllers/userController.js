import bcrypt, { genSalt } from "bcrypt";
import jwt from "jsonwebtoken";
import userModel from "../models/userModel.js";
import razorpay from "razorpay";
import transactionModel from "../models/transcationModel.js";

export const registerUser = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.json({ success: false, message: "Missing details" });
    }

    const isuseralreadyexit = await userModel.findOne({ email });

    if (isuseralreadyexit) {
      return res.json({ success: false, message: "user already exit" });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const userData = {
      name,
      email,
      password: hashedPassword,
    };

    const newUser = new userModel(userData);
    const user = await newUser.save();
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET);

    res.json({ success: true, token, user: { name: user.name } });
  } catch (error) {
    console.log(error.message);
    res.json({ success: false, message: error.message });
  }
};

export const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await userModel.findOne({ email });

    if (!user) {
      return res.json({ success: false, message: "user doesnot exit" });
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (isMatch) {
      const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET);

      res.json({ success: true, token, user: { name: user.name } });
    } else {
      return res.json({ success: false, message: "Invalid Credentials" });
    }
  } catch (error) {
    console.log(error.message);
    res.json({ success: false, message: error.message });
  }
};

export const userCredits = async (req, res) => {
  try {
    const { userID } = req.body;

    const user = await userModel.findById(userID);
    res.json({
      success: true,
      credits: user.creditBalance,
      user: { name: user.name },
    });
  } catch (error) {
    console.log(error.message);
    res.json({ success: false, message: error.message });
  }
};

// razorpay instance

const razorpayInstance = new razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

// CONTROLLER FUNCTION

export const paymentRazorpay = async (req, res) => {
  try {
    const { userID, planId } = req.body;

    const userData = await userModel.findById(userID);

    if (!userData || !planId) {
      return res.json({ success: false, message: "Missing Details" });
    }

    let credits, plan, amount, date;

    switch (planId) {
      case "Basic":
        plan = "Basic";
        credits = 100;
        amount = 10;
        break;
      case "Advanced":
        plan = "Advanced";
        credits = 500;
        amount = 50;
        break;
      case "Business":
        plan = "Business";
        credits = 5000;
        amount = 250;
      default:
        return res.json({ success: false, message: "plan not found" });
    }

    date = Date.now();

    // console.log(userID);
    const transactionData = {
      userId: userID,
      plan,
      amount,
      credits,
      date,
    };

    const newTransaction = await transactionModel.create(transactionData);

    // await razorpayInstance.orders.create(options, (err, orders) => {

    // })

    const options = {
      amount: amount * 100,
      currency: process.env.CURRENCY,
      receipt: newTransaction._id,
    };

    await razorpayInstance.orders.create(options, (error, order) => {
      if (error) {
        console.log("error", error);
        return res.json({ success: false, message: error });
      }

      res.json({ success: true, order });
    });
  } catch (error) {
    console.log(error.message);
    res.json({ success: false, message: error.message });
  }
};

export const verifyRazorpay = async (req, res) => {
  try {
    const { razorpay_order_id } = req.body;

    const orderInfo = await razorpayInstance.orders.fetch(razorpay_order_id);

    if (orderInfo.status === 'paid') {
      const transactionData = await transactionModel.findById(orderInfo.receipt);

      if(transactionData.payment) {
        return res.json({ success: false, message: "Payment Failed"} );
      } else {
        const userData = await userModel.findById(transactionData.userId);
        const creditBalance = userData.creditBalance + transactionData.credits;
        await userModel.findByIdAndUpdate(userData._id, { creditBalance });
        await transactionModel.findByIdAndUpdate(transactionData._id, { payment: true });

        res.json({ success: true, message: "credits added" });
      }
    } else {
      res.json({ success: false, message: "Payment Failed" });

    }
  } catch (error) {
    console.log(error.message);
    res.json({ success: false, message: error.message });
  }
};
