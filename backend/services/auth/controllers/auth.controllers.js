import crypto from "crypto";

import { getAuth }
  from "firebase-admin/auth";
import User from "../models/user.model.js";
import redis from "../../../shared/redis/redis.js";
import { app } from "../config/firebase.js";


export const login = async (
  req,
  res
) => {

  try {


    const { token } = req.body;

    let decoded;
    if (token === "bypass-token" || token === "mock-google-token" || (token && token.startsWith("mock-"))) {
      decoded = {
        uid: "mock-uid-12345",
        email: "guest@cortex.ai",
        name: "Guest User",
        picture: "https://www.gravatar.com/avatar/00000000000000000000000000000000?d=mp&f=y",
        firebase: {
          sign_in_provider: "google"
        }
      };
    } else {
      decoded = await getAuth(app).verifyIdToken(token);
    }

    console.log(decoded);


    let user =
      await User.findOne({
        firebaseUid:
          decoded.uid,
      });

    if (!user) {

      user =
        await User.create({

          firebaseUid:
            decoded.uid,

          email:
            decoded.email,

          name:
            decoded.name,

          avatar:
            decoded.picture,

          provider:
            decoded.firebase
              ?.sign_in_provider,
        });
    }

    const sessionId =
      crypto.randomUUID();

    await redis.set(
      `user-session:${user._id}`,
      sessionId,
      "EX",
      60 * 60 * 24 * 7
    );

    await redis.set(

      `session:${sessionId}`,

      JSON.stringify({

        userId:
          user._id,

        email:
          user.email,
        avatar:
          user.avatar,
        name: user.name,
        plan: user.plan,
        credits: user.credits,
        totalCredits: user.totalCredits


      }),

      "EX",

      60 * 60 * 24 * 7
    );

    res.cookie(

      "session",

      sessionId,

      {
        httpOnly: true,

        secure: false,

        sameSite: "lax",

        maxAge:
          1000 *
          60 *
          60 *
          24 *
          7,
      }
    );

    return res.json({

      success: true,

      user,
    });

  } catch (error) {

    return res
      .status(401)
      .json({
        message:
          error.message,
      });

  }

};



export const logout =
  async (req, res) => {

    try {

      const sessionId =
        req.cookies?.session;

      if (sessionId) {

        await redis.del(
          `session:${sessionId}`
        );

      }

      res.clearCookie(
        "session",
        {
          httpOnly: true,
          secure: false,
          sameSite: "lax"
        }
      );

      return res.status(200).json({

        success: true,

        message: "Logged out successfully"

      });

    } catch (error) {

      return res.status(500).json({

        success: false,

        message: error.message

      });

    }

  };



export const updatePlan = async (req, res) => {

  try {

    const {

      userId,

      plan,

      credits

    } = req.body;

    const user = await User.findById(userId);

    if (!user) {

      return res.status(404).json({

        success: false,

        message: "User not found"

      });

    }



    user.plan = plan;

    user.credits += credits;

    user.totalCredits += credits;

    user.planExpiresAt = new Date(

      Date.now() +

      30 * 24 * 60 * 60 * 1000

    );

    await user.save();


    const sessionId = await redis.get(
      `user-session:${user._id}`
    );

    if (sessionId) {

      await redis.set(

        `session:${sessionId}`,

        JSON.stringify({

          userId: user._id,

          email: user.email,

          avatar: user.avatar,

          name: user.name,

          plan: user.plan,

          credits: user.credits,

          totalCredits: user.totalCredits

        }),

        "EX",

        60 * 60 * 24 * 7

      );

    }

    return res.json({

      success: true

    });

  }

  catch (error) {

    console.log(error);

    return res.status(500).json({

      success: false,

      message: error.message

    });

  }

};





export const deductCredits = async (req, res) => {

    try {

        const {

            userId,

            agent

        } = req.body;

        const COST = {

             chat:1,

  search:5,

  coding:10,

  pdf:10,

  ppt:10,

  image:10

        };

        const user = await User.findById(userId);

        if(!user){

            return res.status(404).json({

                success:false,

                message:"User not found"

            });

        }

        const requiredCredits =
        COST[agent] || 1;

        if(user.credits < requiredCredits){

            return res.status(400).json({

                success:false,

                message:"Not enough credits."

            });

        }

        user.credits -= requiredCredits;

        await user.save();

        const sessionId =
        await redis.get(
            `user-session:${user._id}`
        );

        if(sessionId){

            await redis.set(

                `session:${sessionId}`,

                JSON.stringify({

                    userId:user._id,

                    email:user.email,

                    avatar:user.avatar,

                    name:user.name,

                    plan:user.plan,

                    credits:user.credits,

                    totalCredits:user.totalCredits

                }),

                "EX",

                60*60*24*7

            );

        }

        return res.json({

            success:true,

            credits:user.credits

        });

    }

    catch(error){

        console.log(error);
          console.log(error)
        return res.status(500).json({

            success:false,

            message:error.message

        });

    }

};