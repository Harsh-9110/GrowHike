// server/googleauth.ts
import connectPg from "connect-pg-simple";
import type { Express, RequestHandler } from "express";
import session from "express-session";
import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import { storage } from "./storage";

const demoUser = {
  id: "demo-user",
  email: "demo@growhike.local",
  firstName: "Demo",
  lastName: "Trader",
  profileImageUrl: null,
};

function hasGoogleOAuthConfig() {
  return Boolean(
    process.env.GOOGLE_CLIENT_ID &&
      process.env.GOOGLE_CLIENT_SECRET &&
      process.env.GOOGLE_CALLBACK_URL,
  );
}

export function getAuthMode() {
  const googleConfigured = hasGoogleOAuthConfig();
  const demoEnabled =
    process.env.ENABLE_AUTH_BYPASS === "true" ||
    (!googleConfigured && process.env.ENABLE_AUTH_BYPASS !== "false");
  const defaultProvider =
    process.env.DEFAULT_AUTH_PROVIDER === "google" && googleConfigured
      ? "google"
      : demoEnabled
        ? "demo"
        : "google";

  return {
    googleConfigured,
    demoEnabled,
    defaultProvider,
  };
}

function getSession() {
  const sessionTtl = 7 * 24 * 60 * 60 * 1000; // 1 week
  const PgStore = connectPg(session);
  const useDatabaseSessionStore =
    process.env.NODE_ENV === "production" ||
    process.env.USE_DATABASE_SESSION === "true";
  const sessionOptions: session.SessionOptions = {
    secret:
      process.env.SESSION_SECRET ||
      "growhike-local-demo-session-secret-change-me",
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
      maxAge: sessionTtl,
    },
  };

  if (useDatabaseSessionStore) {
    sessionOptions.store = new PgStore({
      conString: process.env.DATABASE_URL,
      createTableIfMissing: true,
      ttl: sessionTtl,
      tableName: "sessions",
    });
  }

  return session(sessionOptions);
}

async function upsertGoogleUser(profile: any) {
  const user = {
    id: profile.id,
    email: profile.emails?.[0]?.value,
    firstName: profile.name?.givenName,
    lastName: profile.name?.familyName,
    profileImageUrl: profile.photos?.[0]?.value,
  };

  await storage.upsertUser(user);
  return user;
}

export async function setupGoogleAuth(app: Express) {
  const authMode = getAuthMode();

  app.set("trust proxy", 1);
  app.use(getSession());
  app.use(passport.initialize());
  app.use(passport.session());

  if (authMode.googleConfigured) {
    passport.use(
      new GoogleStrategy(
        {
          clientID: process.env.GOOGLE_CLIENT_ID!,
          clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
          callbackURL: process.env.GOOGLE_CALLBACK_URL!,
        },
        async (_accessToken, _refreshToken, profile, done) => {
          const user = await upsertGoogleUser(profile);
          done(null, user);
        },
      ),
    );
  }

  passport.serializeUser((user: any, cb) => cb(null, user));
  passport.deserializeUser((user: any, cb) => cb(null, user));

  if (authMode.googleConfigured) {
    app.get(
      "/api/auth/google",
      passport.authenticate("google", {
        scope: ["profile", "email"],
      }),
    );

    app.get(
      "/api/auth/google/callback",
      passport.authenticate("google", {
        successRedirect: "/",
        failureRedirect: "/login",
      }),
    );
  } else {
    const missingConfigResponse: RequestHandler = (_req, res) => {
      res.status(503).json({
        message:
          "Google OAuth is not configured. Demo login is available at /api/auth/demo.",
      });
    };

    app.get(
      "/api/auth/google",
      authMode.demoEnabled
        ? (_req, res) => res.redirect("/api/auth/demo")
        : missingConfigResponse,
    );
    app.get("/api/auth/google/callback", missingConfigResponse);
  }

  if (authMode.demoEnabled) {
    app.get("/api/auth/demo", async (req, res, next) => {
      try {
        try {
          await storage.upsertUser(demoUser);
        } catch (error) {
          if (process.env.NODE_ENV === "production") throw error;
          console.warn("Skipping demo user database upsert:", error);
        }

        req.login(demoUser, (error) => {
          if (error) return next(error);
          return res.redirect("/");
        });
      } catch (error) {
        next(error);
      }
    });
  }

  // Current user
  app.get("/api/auth/user", (req, res) => {
    if (req.user) {
      res.json(req.user);
    } else {
      res.status(401).json({ message: "Unauthorized" });
    }
  });

  // Logout
  app.get("/api/auth/logout", (req, res) => {
    req.logout(() => res.redirect("/"));
  });

  // Auth status
  app.get("/api/auth/status", (req, res) => {
    res.json({
      authenticated: req.isAuthenticated ? req.isAuthenticated() : false,
      user: req.user || null,
    });
  });

  app.get("/api/auth/mode", (_req, res) => {
    res.json(getAuthMode());
  });
}

export const isAuthenticated: RequestHandler = (req, res, next) => {
  if (req.isAuthenticated && req.isAuthenticated()) return next();
  return res.status(401).json({ message: "Unauthorized" });
};
