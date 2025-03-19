// pages/api/auth/[...nextauth].ts
import NextAuth, { Account, Profile, User } from "next-auth"
import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";
import fs from 'fs';
import path from 'path';
import { compare} from 'bcryptjs';

// Directory for user accounts
const usersDir = path.join(process.cwd(), 'data/users');
if (!fs.existsSync(usersDir)) {
  fs.mkdirSync(usersDir, { recursive: true });
}

// Helper function to get sanitized user ID from email
const getUserIdFromEmail = (email: string) => email.replace(/[^a-zA-Z0-9]/g, '_');

export const authOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials: Partial<Record<"email" | "password", unknown>>,) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        const userId = getUserIdFromEmail(credentials?.email as string);
        const userFilePath = path.join(usersDir, `${userId}.json`);
        
        // Check if user exists
        if (!fs.existsSync(userFilePath)) {
          return null;
        }

        try {
          const userData = JSON.parse(fs.readFileSync(userFilePath, 'utf8'));
          
          // Skip password check for Google users who are trying to log in with credentials
          if (userData.provider === "google") {
            return null;
          }
          
          // Verify password for credential users
          const isValid = await compare(credentials.password as string, userData.password);
          
          if (!isValid) {
            return null;
          }

          return {
            id: userId,
            email: userData.email,
            name: userData.name
          };
        } catch (error) {
          console.error("Error during credentials authorization:", error);
          return null;
        }
      }
    })
  ],
  callbacks: {
    async signIn({ user, account, profile }: { user: User; account: Account | null; profile?: Profile | null }) {
      // Handle Google sign in
      if (account?.provider === "google" && user.email) {
        const userId = getUserIdFromEmail(user.email);
        const userFilePath = path.join(usersDir, `${userId}.json`);
        
        try {
          // Create or update user file for Google login
          let userData;
          
          if (fs.existsSync(userFilePath)) {
            // Update existing user
            userData = JSON.parse(fs.readFileSync(userFilePath, 'utf8'));
            userData = {
              ...userData,
              name: user.name || userData.name,
              image: user.image || userData.image,
              lastLogin: new Date().toISOString()
            };
          } else {
            // Create new user
            userData = {
              id: userId,
              email: user.email,
              name: user.name,
              image: user.image,
              provider: "google",
              createdAt: new Date().toISOString(),
              lastLogin: new Date().toISOString()
            };
          }
          
          fs.writeFileSync(userFilePath, JSON.stringify(userData, null, 2));
        } catch (error) {
          console.error("Error saving Google user data:", error);
          return false;
        }
      }
      
      return true;
    },
    async jwt({ token, user, account }) {
      // Add userId to the token
      if (user?.email) {
        token.userId = getUserIdFromEmail(user.email);
      }
      
      // Add provider info to token
      if (account) {
        token.provider = account.provider;
      }
      
      return token;
    },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    async session({ session, token }: { session: any; token: any }) {
      // Add userId to session
      if (session.user) {
        session.user.id = token.userId as string;
        // Add provider info to session
        session.user.provider = token.provider as string;
      }
      return session;
    }
  },
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  secret: process.env.NEXTAUTH_SECRET,
  debug: process.env.NODE_ENV === 'development',
};

// Extend the built-in session types
declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
      provider?: string;
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    userId: string;
    provider?: string;
  }
}

export const { auth, handlers, signIn, signOut } = NextAuth(authOptions);



