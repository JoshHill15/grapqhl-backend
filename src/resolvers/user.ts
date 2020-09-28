import { User } from "../entities/User";
import { MyContext } from "src/types";
import { Resolver, Mutation, Field, Arg, Ctx, ObjectType, Query } from "type-graphql";
import argon2 from "argon2"
import { EntityManager } from "@mikro-orm/postgresql"
import { COOKIE_NAME, FORGOT_PASSWORD_PREFIX } from "../constants";
import { UsernamePasswordInput } from "./UsernamePasswordInput";
import { validateRegister } from "../utils/validateRegister";
import { sendEmail } from "../utils/sendEmail";
import { v4 } from "uuid";

const forgottenPasswords: Record<string, string> = {}


@ObjectType()
class FieldError {
  @Field()
  field: string
  @Field()
  message: string
}

@ObjectType()
class UserResponse {
  @Field(() => [FieldError], { nullable: true })
  error?: FieldError[]

  @Field(() => User, { nullable: true })
  user?: User
}


@Resolver()
export class UserResolver {
  @Mutation(() => UserResponse)
  async ChangePassword(
    @Arg("token") token: string,
    @Arg("newPassword") newPassword: string,
    @Ctx() { }: MyContext
  ) {
    if (newPassword.length < 3) {
      return [{
        field: "newPassword",
        message: "length must be greater than 2"
      }]
    }



  }


  @Mutation(() => Boolean)
  async forgotPassword(
    @Arg("email") email: string,
    @Ctx() { em }: MyContext
  ) {
    const user = await em.findOne(User, { email })
    if (!user) {
      //user not in db
      return false
    }

    const token = v4()

    forgottenPasswords[email] = token
    await sendEmail(email, `<a href="http://localhost:3000/change-password/${token}">reset password</a>`)

    return true
  }

  @Query(() => User, { nullable: true })
  async me(
    @Ctx() { req, em }: MyContext
  ) {
    if (!req.session?.userId) {
      return null
    }

    const user = await em.findOne(User, { id: req.session.userId })
    return user
  }


  @Mutation(() => UserResponse)
  async register(
    @Arg("options") options: UsernamePasswordInput,
    @Ctx() { em, req }: MyContext
  ): Promise<UserResponse> {
    const error = validateRegister(options)
    if (error) {
      return { error }
    }

    const hashedPassword = await argon2.hash(options.password)
    let user = null
    try {
      const result = await (em as EntityManager).createQueryBuilder(User).getKnexQuery().insert({
        username: options.username,
        password: hashedPassword,
        email: options.email,
        created_at: new Date(),
        updated_at: new Date
      })
        .returning("*")

      user = result[0]
    }
    catch (err) {
      if (err.code === "23505") {
        //duplicate username error
        return {
          error: [
            {
              field: "username",
              message: "username already taken"
            }
          ]
        }
      }
      console.error("message: ", err);
    }
    //store user id session, set a cookie on the user
    //log them in

    req.session!.userId = user.id
    return { user }
  }

  @Mutation(() => UserResponse)
  async login(
    @Arg("usernameOrEmail") usernameOrEmail: string,
    @Arg("password") password: string,
    @Ctx() { em, req }: MyContext
  ): Promise<UserResponse> {
    const user = await em.findOne(User, usernameOrEmail.includes("@") ? { email: usernameOrEmail } : { username: usernameOrEmail })
    if (!user) {
      return {
        error: [{
          field: "usernameOrEmail",
          message: "username doesn't exist"
        }]
      }
    }
    const valid = await argon2.verify(user.password, password)
    if (!valid) {
      return {
        error: [{
          field: "password",
          message: "incorrect password"
        }]
      }
    }

    req.session!.userId = user.id

    return { user }
  }
  @Mutation(() => Boolean)
  logout(
    @Ctx() { req, res }: MyContext
  ) {
    return new Promise(resolve => req.session?.destroy(err => {
      res.clearCookie(COOKIE_NAME)
      if (err) {
        resolve(false)
        return
      }
      resolve(true)
    }))
  }

}