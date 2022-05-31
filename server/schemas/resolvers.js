const { Book, User } = require("../models");
const { signToken } = require("../utils/auth");
const { AuthenticationError } = require("apollo-server-express");

const resolvers = {
  Query: {
    user: async (parent, { username }) => {
      return User.findOne({ username });
    },
    me: async (parent, args, context) => {
      if (context.user) {
        return User.findOne({ _id: context.user._id }).populate("savedBooks");
      }
      throw new AuthenticationError("You need to be logged in!");
    },
  },

  Mutation: {
    addUser: async (parent, { username, email, password }) => {
      const user = await User.create({ username, email, password });
      const token = signToken(user);
      return { token, user };
    },
    login: async (parent, { email, password }) => {
      const user = await User.findOne({ email });
      // Check if user exists
      if (!user) {
        throw new AuthenticationError("No user found with this email address");
      }
      const correctPw = await user.isCorrectPassword(password);
      // Check password is correct
      if (!correctPw) {
        throw new AuthenticationError("Incorrect credentials");
      }
      // If email and password are correct, sign user into the application with a JWT
      const token = signToken(user);
      // Return an `Auth` object
      return { token, user };
    },
    saveBook: async (parent, { book }, context) => {
      if (context.user) {
        const books = await User.findOneAndUpdate(
          { _id: context.user._id },
          { $addToSet: { savedBooks: book._id } },
          { new: true }
        );
        return books;
      }
      throw new AuthenticationError("You need to be logged in!");
    },
    deleteBook: async (parent, { book }) => {
      if (context.user) {
        const removeBook = await User.findOneAndUpdate(
          { _id: context.user._id },
          { $pull: { savedBooks: book._id } }
        );
        return removeBook;
      }
      throw new AuthenticationError("You need to be logged in!");
    },
  },
};

module.exports = resolvers;
