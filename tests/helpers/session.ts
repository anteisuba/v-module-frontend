type SessionUser = {
  id: string;
  slug?: string;
  email?: string;
  displayName?: string | null;
};

export function createServerSession(
  user: Partial<SessionUser> = {}
) {
  return {
    user: {
      id: "user-1",
      slug: "creator",
      email: "creator@example.com",
      displayName: "Creator",
      ...user,
    },
  };
}
