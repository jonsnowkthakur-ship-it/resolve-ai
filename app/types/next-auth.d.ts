import "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: "ADMIN" | "AGENT";
      name?: string | null;
      email?: string | null;
      image?: string | null;
    };
  }

  interface User {
    role: "ADMIN" | "AGENT";
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id?: string;
    role?: "ADMIN" | "AGENT";
  }
}