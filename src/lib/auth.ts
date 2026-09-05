import { NextAuthOptions, getServerSession } from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import CredentialsProvider from "next-auth/providers/credentials";
import GitHubProvider from "next-auth/providers/github";
import GoogleProvider from "next-auth/providers/google";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { logger } from "@/lib/logger";

// ─── Type Augmentation ───────────────────────────────────────────────────────

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      email: string;
      name: string | null;
      image: string | null;
      role: string;
      status: string;
      firmId: string | null;
      firmSlug: string | null;
      firmName: string | null;
      firmRole: string | null;
    };
  }

  interface User {
    id: string;
    role: string;
    status: string;
    firmId?: string | null;
    firmSlug?: string | null;
    firmName?: string | null;
    firmRole?: string | null;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    role: string;
    status: string;
    firmId?: string | null;
    firmSlug?: string | null;
    firmName?: string | null;
    firmRole?: string | null;
  }
}

// ─── Auth Configuration ──────────────────────────────────────────────────────

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(db) as NextAuthOptions["adapter"],
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
    updateAge: 24 * 60 * 60, // 24 hours
  },
  pages: {
    signIn: "/auth/login",
    signOut: "/auth/logout",
    error: "/auth/error",
    verifyRequest: "/auth/verify",
    newUser: "/auth/welcome",
  },
  providers: [
    // ── Credentials Provider ────────────────────────────────────────────
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          logger.warn("Auth attempt with missing credentials");
          throw new Error("Email and password are required");
        }

        try {
          const user = await db.user.findUnique({
            where: { email: credentials.email.toLowerCase().trim() },
            include: {
              firmMemberships: {
                include: {
                  firm: {
                    select: {
                      id: true,
                      slug: true,
                      name: true,
                      isActive: true,
                    },
                  },
                },
                where: { isActive: true },
                take: 1,
              },
            },
          });

          if (!user) {
            logger.warn("Auth attempt for non-existent user", {
              email: credentials.email,
            });
            throw new Error("Invalid email or password");
          }

          if (user.status !== "ACTIVE") {
            logger.warn("Auth attempt for inactive user", {
              userId: user.id,
              status: user.status,
            });
            throw new Error("Account is not active. Please contact support.");
          }

          if (!user.password) {
            logger.warn("Auth attempt for OAuth-only user", {
              userId: user.id,
            });
            throw new Error(
              "This account uses social login. Please sign in with your provider."
            );
          }

          const isPasswordValid = await bcrypt.compare(
            credentials.password,
            user.password
          );

          if (!isPasswordValid) {
            logger.warn("Auth attempt with invalid password", {
              userId: user.id,
            });
            throw new Error("Invalid email or password");
          }

          // Update last login timestamp
          await db.user.update({
            where: { id: user.id },
            data: { lastLoginAt: new Date() },
          });

          const firmMembership = user.firmMemberships[0];

          logger.info("Successful credential auth", {
            userId: user.id,
            firmId: firmMembership?.firmId,
          });

          return {
            id: user.id,
            email: user.email,
            name: user.name,
            image: user.image,
            role: user.role,
            status: user.status,
            firmId: firmMembership?.firmId ?? null,
            firmSlug: firmMembership?.firm.slug ?? null,
            firmName: firmMembership?.firm.name ?? null,
            firmRole: firmMembership?.role ?? null,
          };
        } catch (error) {
          if (error instanceof Error && error.message.includes("Invalid")) {
            throw error;
          }
          logger.error("Auth error during credential verification", {
            error: error instanceof Error ? error.message : "Unknown error",
            email: credentials.email,
          });
          throw new Error("Authentication failed. Please try again.");
        }
      },
    }),

    // ── GitHub Provider ──────────────────────────────────────────────────
    GitHubProvider({
      clientId: process.env.GITHUB_CLIENT_ID ?? "",
      clientSecret: process.env.GITHUB_CLIENT_SECRET ?? "",
      authorization: {
        params: {
          scope: "read:user user:email",
        },
      },
      profile(profile) {
        return {
          id: profile.id.toString(),
          name: profile.name || profile.login,
          email: profile.email,
          image: profile.avatar_url,
          role: "ASSOCIATE",
          status: "ACTIVE",
        };
      },
    }),

    // ── Google Provider ──────────────────────────────────────────────────
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID ?? "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? "",
      authorization: {
        params: {
          prompt: "consent",
          access_type: "offline",
          response_type: "code",
          scope: "openid email profile",
        },
      },
      profile(profile) {
        return {
          id: profile.sub,
          name: profile.name,
          email: profile.email,
          image: profile.picture,
          role: "ASSOCIATE",
          status: "ACTIVE",
        };
      },
    }),
  ],

  callbacks: {
    // ── JWT Callback ─────────────────────────────────────────────────────
    async jwt({ token, user, trigger, session }) {
      // On initial sign in
      if (user) {
        token.id = user.id;
        token.role = user.role;
        token.status = user.status;
        token.firmId = user.firmId ?? null;
        token.firmSlug = user.firmSlug ?? null;
        token.firmName = user.firmName ?? null;
        token.firmRole = user.firmRole ?? null;
      }

      // On session update
      if (trigger === "update" && session) {
        token.firmId = session.firmId ?? token.firmId;
        token.firmSlug = session.firmSlug ?? token.firmSlug;
        token.firmName = session.firmName ?? token.firmName;
        token.firmRole = session.firmRole ?? token.firmRole;
      }

      // Refresh user data periodically
      const now = Math.floor(Date.now() / 1000);
      if (token.exp && now > token.exp - 60 * 60) {
        try {
          const freshUser = await db.user.findUnique({
            where: { id: token.id },
            include: {
              firmMemberships: {
                include: {
                  firm: {
                    select: {
                      id: true,
                      slug: true,
                      name: true,
                      isActive: true,
                    },
                  },
                },
                where: { isActive: true },
                take: 1,
              },
            },
          });

          if (freshUser) {
            const firmMembership = freshUser.firmMemberships[0];
            token.role = freshUser.role;
            token.status = freshUser.status;
            token.firmId = firmMembership?.firmId ?? null;
            token.firmSlug = firmMembership?.firm.slug ?? null;
            token.firmName = firmMembership?.firm.name ?? null;
            token.firmRole = firmMembership?.role ?? null;
          }
        } catch (error) {
          logger.error("Error refreshing user data in JWT", {
            userId: token.id,
            error: error instanceof Error ? error.message : "Unknown error",
          });
        }
      }

      return token;
    },

    // ── Session Callback ─────────────────────────────────────────────────
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id;
        session.user.role = token.role;
        session.user.status = token.status;
        session.user.firmId = token.firmId ?? null;
        session.user.firmSlug = token.firmSlug ?? null;
        session.user.firmName = token.firmName ?? null;
        session.user.firmRole = token.firmRole ?? null;
      }

      return session;
    },

    // ── Sign In Callback ─────────────────────────────────────────────────
    async signIn({ user, account, profile }) {
      if (!account) return false;

      // Allow credentials sign in
      if (account.provider === "credentials") {
        return true;
      }

      // For OAuth providers, check if user exists or create
      try {
        const existingUser = await db.user.findUnique({
          where: { email: user.email?.toLowerCase().trim() ?? "" },
          include: {
            accounts: {
              where: {
                provider: account.provider,
                providerAccountId: account.providerAccountId,
              },
            },
          },
        });

        if (existingUser) {
          // Check if this account is already linked
          if (existingUser.accounts.length === 0) {
            // Link the OAuth account to existing user
            await db.account.create({
              data: {
                userId: existingUser.id,
                type: account.type,
                provider: account.provider,
                providerAccountId: account.providerAccountId,
                refresh_token: account.refresh_token ?? null,
                access_token: account.access_token ?? null,
                expires_at: account.expires_at ?? null,
                token_type: account.token_type ?? null,
                scope: account.scope ?? null,
                id_token: account.id_token ?? null,
                session_state: account.session_state ?? null,
              },
            });
          }

          // Update user data from OAuth profile
          if (profile) {
            await db.user.update({
              where: { id: existingUser.id },
              data: {
                name: profile.name ?? existingUser.name,
                image: (profile as any).picture ?? existingUser.image,
                lastLoginAt: new Date(),
              },
            });
          }

          user.id = existingUser.id;
          (user as any).role = existingUser.role;
          (user as any).status = existingUser.status;

          return true;
        }

        // Create new user from OAuth
        const newUser = await db.user.create({
          data: {
            email: user.email?.toLowerCase().trim() ?? "",
            name: user.name ?? profile?.name ?? null,
            image: user.image ?? (profile as any)?.picture ?? null,
            emailVerified: new Date(),
            role: "ASSOCIATE",
            status: "ACTIVE",
            lastLoginAt: new Date(),
            accounts: {
              create: {
                type: account.type,
                provider: account.provider,
                providerAccountId: account.providerAccountId,
                refresh_token: account.refresh_token ?? null,
                access_token: account.access_token ?? null,
                expires_at: account.expires_at ?? null,
                token_type: account.token_type ?? null,
                scope: account.scope ?? null,
                id_token: account.id_token ?? null,
                session_state: account.session_state ?? null,
              },
            },
          },
        });

        user.id = newUser.id;
        (user as any).role = newUser.role;
        (user as any).status = newUser.status;

        logger.info("New user created via OAuth", {
          userId: newUser.id,
          provider: account.provider,
        });

        return true;
      } catch (error) {
        logger.error("Error during OAuth sign in", {
          provider: account.provider,
          error: error instanceof Error ? error.message : "Unknown error",
        });
        return false;
      }
    },

    // ── Redirect Callback ────────────────────────────────────────────────
    async redirect({ url, baseUrl }) {
      // Redirect to dashboard after sign in
      if (url.startsWith("/")) return `${baseUrl}${url}`;

      // Allow redirects to same origin
      try {
        const urlObj = new URL(url);
        const baseUrlObj = new URL(baseUrl);
        if (urlObj.origin === baseUrlObj.origin) return url;
      } catch {
        // Invalid URL
      }

      return baseUrl;
    },
  },

  // ── Event Handlers ────────────────────────────────────────────────────
  events: {
    async signIn({ user, account, isNewUser }) {
      logger.info("User signed in", {
        userId: user.id,
        provider: account?.provider ?? "credentials",
        isNewUser,
      });
    },

    async signOut({ token }) {
      logger.info("User signed out", {
        userId: token.id,
      });
    },

    async session({ session, token }) {
      // Track active sessions if needed
    },
  },

  // ── Error Handling ────────────────────────────────────────────────────
  logger: {
    error(code, metadata) {
      logger.error("NextAuth error", { code, metadata });
    },
    warn(code) {
      logger.warn("NextAuth warning", { code });
    },
    debug(code, metadata) {
      logger.debug("NextAuth debug", { code, metadata });
    },
  },

  debug: process.env.NODE_ENV === "development",
};

// ─── Helper Functions ────────────────────────────────────────────────────────

/**
 * Get the current session on the server side
 */
export async function getSession() {
  return getServerSession(authOptions);
}

/**
 * Get the current user with firm context
 */
export async function getCurrentUser() {
  const session = await getSession();

  if (!session?.user) {
    return null;
  }

  const user = await db.user.findUnique({
    where: { id: session.user.id },
    include: {
      firmMemberships: {
        include: {
          firm: {
            select: {
              id: true,
              slug: true,
              name: true,
              settings: true,
            },
          },
        },
        where: { isActive: true },
      },
    },
  });

  if (!user) {
    return null;
  }

  return {
    ...user,
    currentFirm: user.firmMemberships[0]?.firm ?? null,
    firmRole: user.firmMemberships[0]?.role ?? null,
  };
}

/**
 * Require authentication - throws if not authenticated
 */
export async function requireAuth() {
  const user = await getCurrentUser();

  if (!user) {
    throw new Error("Authentication required");
  }

  return user;
}

/**
 * Check if user has a specific role
 */
export function hasRole(
  userRole: string,
  requiredRoles: string[]
): boolean {
  return requiredRoles.includes(userRole);
}

/**
 * Check if user is a firm admin or owner
 */
export function isFirmAdmin(firmRole: string | null): boolean {
  return firmRole === "OWNER" || firmRole === "ADMIN";
}

/**
 * Check if user is a firm owner
 */
export function isFirmOwner(firmRole: string | null): boolean {
  return firmRole === "OWNER";
}

/**
 * Get firm context from session
 */
export async function getFirmContext() {
  const session = await getSession();

  if (!session?.user?.firmId) {
    return null;
  }

  const firm = await db.lawFirm.findUnique({
    where: { id: session.user.firmId },
    select: {
      id: true,
      name: true,
      slug: true,
      settings: true,
      subscription: true,
      isActive: true,
    },
  });

  return firm;
}

/**
 * Validate firm membership
 */
export async function validateFirmMembership(
  userId: string,
  firmId: string
): Promise<boolean> {
  const membership = await db.firmMember.findUnique({
    where: {
      userId_firmId: { userId, firmId },
    },
  });

  return membership?.isActive ?? false;
}

/**
 * Get all firms for a user
 */
export async function getUserFirms(userId: string) {
  return db.firmMember.findMany({
    where: {
      userId,
      isActive: true,
    },
    include: {
      firm: {
        select: {
          id: true,
          name: true,
          slug: true,
          logo: true,
          isActive: true,
        },
      },
    },
    orderBy: {
      joinedAt: "desc",
    },
  });
}

/**
 * Switch active firm context
 */
export async function switchFirmContext(
  userId: string,
  firmId: string
): Promise<{ success: boolean; firm?: any }> {
  const membership = await db.firmMember.findUnique({
    where: {
      userId_firmId: { userId, firmId },
    },
    include: {
      firm: {
        select: {
          id: true,
          name: true,
          slug: true,
          settings: true,
        },
      },
    },
  });

  if (!membership?.isActive) {
    return { success: false };
  }

  return {
    success: true,
    firm: membership.firm,
  };
}

export default authOptions;
