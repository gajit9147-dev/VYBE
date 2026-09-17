export interface NavigationItemConfig {
  id: string;
  label: string;
  route: string;
  badge?: number | string;
  mobilePrimary?: boolean;
}

export const primaryNavigation: NavigationItemConfig[] = [
  {
    id: "discover",
    label: "Discover",
    route: "/app",
    mobilePrimary: true
  },
  {
    id: "answers",
    label: "Answers",
    route: "/app/answers",
    badge: "New",
    mobilePrimary: true
  },
  {
    id: "matches",
    label: "Matches",
    route: "/app/matches",
    badge: 3,
    mobilePrimary: true
  },
  {
    id: "messages",
    label: "Messages",
    route: "/app/messages",
    badge: 1,
    mobilePrimary: true
  },
  {
    id: "profile",
    label: "Profile",
    route: "/app/profile",
    mobilePrimary: true
  }
];

export const secondaryNavigation: NavigationItemConfig[] = [
  {
    id: "shell-demo",
    label: "Shell Demo",
    route: "/app/shell-demo"
  },
  {
    id: "moments",
    label: "Moments",
    route: "/app/moments"
  },
  {
    id: "surprise",
    label: "Surprise Vibe",
    route: "/app/surprise"
  },
  {
    id: "settings",
    label: "Settings",
    route: "/app/settings"
  }
];

export const mobileNavigation = primaryNavigation.filter((item) => item.mobilePrimary);
